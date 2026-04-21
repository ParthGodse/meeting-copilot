import type { SuggestionType } from './store/session';

export interface TypeConfig {
  label: string;
  colorClass: string;
  bgClass: string;
}

export const TYPE_CONFIG: Record<SuggestionType, TypeConfig> = {
  question: {
    label: 'Question to Ask',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10 border-cyan-500/20',
  },
  talking_point: {
    label: 'Talking Point',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/30',
  },
  answer: {
    label: 'Answer',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10 border-green-500/30',
  },
  fact_check: {
    label: 'Fact Check',
    colorClass: 'text-yellow-500',
    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
  },
};