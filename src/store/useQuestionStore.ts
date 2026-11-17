import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionSource, QuestionTopic, QuestionType } from '../types/question';

export interface CustomBankQuestion {
  id: string;
  type: QuestionType;
  topic: QuestionTopic;
  source: QuestionSource;
  prompt: string;
  alternatives: string[];
  answer: number;
  explanation: string;
  imageUrl?: string;
  imageAlt?: string;
  expectedAnswer?: string;
  expectedLines?: number;
}

export type NewCustomQuestion = Omit<CustomBankQuestion, 'id'>;

interface QuestionStoreState {
  customQuestions: CustomBankQuestion[];
  addQuestion: (question: NewCustomQuestion) => CustomBankQuestion;
  addQuestions: (questions: NewCustomQuestion[]) => CustomBankQuestion[];
  removeQuestion: (id: string) => void;
  clearCustomQuestions: () => void;
}

export const useQuestionStore = create<QuestionStoreState>()(
  persist(
    (set) => ({
      customQuestions: [],
      addQuestion: (question) => {
        const created: CustomBankQuestion = {
          ...question,
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        set((state) => ({ customQuestions: [created, ...state.customQuestions] }));
        return created;
      },
      addQuestions: (questions) => {
        const created = questions.map((question, index) => ({
          ...question,
          id: `custom-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        }));
        set((state) => ({ customQuestions: [...created, ...state.customQuestions] }));
        return created;
      },
      removeQuestion: (id) =>
        set((state) => ({
          customQuestions: state.customQuestions.filter((question) => question.id !== id),
        })),
      clearCustomQuestions: () => set({ customQuestions: [] }),
    }),
    {
      name: 'so-docente-custom-questions-v1',
    },
  ),
);
