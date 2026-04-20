import { useRef, useCallback } from 'react';
import { useSession } from '../store/session';
import { transcribeAudio } from '../lib/api';

const CHUNK_MS = 30_000;

const SUPPORTED_MIME =
  ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find(
    (t) => MediaRecorder.isTypeSupported(t)
  ) || '';

export function useMic() {
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { apiKey, addTranscriptChunk, setIsRecording } = useSession();

  const launchChunk = useCallback(
    (stream: MediaStream) => {
      const mr = new MediaRecorder(
        stream,
        SUPPORTED_MIME ? { mimeType: SUPPORTED_MIME } : {}
      );
      const chunks: Blob[] = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: mr.mimeType });
        if (blob.size < 2000) return; // skip silence
        try {
          const text = await transcribeAudio(blob, apiKey);
          if (text) addTranscriptChunk(text);
        } catch (err: any) {
          console.error('Transcription error:', err.message);
        }
      };

      mr.start();
      setTimeout(() => {
        try {
          if (mr.state === 'recording') mr.stop();
        } catch {}
      }, CHUNK_MS);
    },
    [apiKey, addTranscriptChunk]
  );

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      launchChunk(stream);
      intervalRef.current = setInterval(() => launchChunk(stream), CHUNK_MS);
    } catch (err: any) {
      throw new Error('Mic access denied: ' + err.message);
    }
  }, [launchChunk, setIsRecording]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, [setIsRecording]);

  return { start, stop };
}