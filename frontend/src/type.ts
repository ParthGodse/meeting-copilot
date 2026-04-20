import type { SuggestionType } from './store/session';

export interface TypeConfig {
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

export const TYPE_CONFIG: Record<SuggestionType, TypeConfig> = {
  question: {
    label: 'Question to Ask',
    icon: '❓',
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20',
  },
  talking_point: {
    label: 'Talking Point',
    icon: '💬',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10 border-green-500/20',
  },
  answer: {
    label: 'Answer',
    icon: '✅',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10 border-cyan-500/20',
  },
  fact_check: {
    label: 'Fact Check',
    icon: '🔍',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
  },
  clarification: {
    label: 'Clarification',
    icon: '📖',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
  },
  action_item: {
    label: 'Action Item',
    icon: '⚡',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
  },
};