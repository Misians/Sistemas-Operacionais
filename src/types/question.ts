import type { Timestamp } from 'firebase/firestore';

export type QuestionTopic =
  | 'introducao'
  | 'processos'
  | 'memoria'
  | 'sincronizacao'
  | 'arquivos'
  | 'io'
  | 'seguranca'
  | 'virtualizacao';
export type QuestionSource = 'assunto' | 'enade' | 'custom';
export type QuestionType = 'objetiva' | 'discursiva';
export type QuestionLanguage = 'pt' | 'en' | 'es' | 'zh';

export interface QuestionTranslation {
  prompt: string;
  alternatives: string[];
  explanation: string;
  expectedAnswer?: string;
}

export interface QuestionDocument {
  id: string;
  type?: QuestionType;
  topic: QuestionTopic;
  source: QuestionSource;
  answer: number;
  imageUrl?: string;
  imageAlt?: string;
  expectedAnswer?: string;
  expectedLines?: number;
  translations: Record<QuestionLanguage, QuestionTranslation>;
  createdAt: number | Timestamp;
  updatedAt: number | Timestamp;
}
