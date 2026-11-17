import type { Timestamp } from 'firebase/firestore';

export type QuestionTopic = 'processos' | 'memoria' | 'sincronizacao' | 'arquivos';
export type QuestionSource = 'assunto' | 'enade';
export type QuestionLanguage = 'pt' | 'en' | 'es' | 'zh';

export interface QuestionTranslation {
  prompt: string;
  alternatives: string[];
  explanation: string;
}

export interface QuestionDocument {
  id: string;
  topic: QuestionTopic;
  source: QuestionSource;
  answer: number;
  translations: Record<QuestionLanguage, QuestionTranslation>;
  createdAt: number | Timestamp;
  updatedAt: number | Timestamp;
}
