import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  DISCURSIVE_QUESTIONS,
  ENADE_QUESTIONS,
  SUBJECT_QUESTIONS,
  type QuizQuestion,
} from '../data/questions';
import { englishQuestionMessages, spanishQuestionMessages, chineseQuestionMessages } from '../i18n/questionTranslations';
import type { QuestionDocument, QuestionLanguage, QuestionTranslation } from '../types/question';
import { useLanguage } from '../i18n/LanguageContext';
import { useQuestionStore } from '../store/useQuestionStore';

const INITIAL_QUESTION_DOCUMENTS: QuestionDocument[] = [
  ...SUBJECT_QUESTIONS.map((question, index) => createInitialQuestion(question, `subject-${index}`, 'assunto')),
  ...ENADE_QUESTIONS.map((question, index) => createInitialQuestion(question, `enade-${index}`, 'enade')),
  ...DISCURSIVE_QUESTIONS.map((question, index) => createInitialQuestion(question, `discursive-${index}`, 'assunto')),
];

function createInitialQuestion(
  question: QuizQuestion,
  id: string,
  source: QuestionDocument['source'],
): QuestionDocument {
  const translate = (messages: Record<string, string>): QuestionTranslation => ({
    prompt: messages[question.prompt] ?? question.prompt,
    alternatives: question.alternatives.map((alternative) => messages[alternative] ?? alternative),
    explanation: messages[question.explanation] ?? question.explanation,
    ...(question.expectedAnswer
      ? { expectedAnswer: messages[question.expectedAnswer] ?? question.expectedAnswer }
      : {}),
  });
  const now = Date.now();

  return {
    id,
    type: question.type ?? 'objetiva',
    topic: question.topic,
    source,
    answer: question.answer,
    ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
    ...(question.imageAlt ? { imageAlt: question.imageAlt } : {}),
    ...(question.expectedAnswer ? { expectedAnswer: question.expectedAnswer } : {}),
    ...(typeof question.expectedLines === 'number' ? { expectedLines: question.expectedLines } : {}),
    translations: {
      pt: {
        prompt: question.prompt,
        alternatives: question.alternatives,
        explanation: question.explanation,
        ...(question.expectedAnswer ? { expectedAnswer: question.expectedAnswer } : {}),
      },
      en: translate(englishQuestionMessages),
      es: translate(spanishQuestionMessages),
      zh: translate(chineseQuestionMessages),
    },
    createdAt: now,
    updatedAt: now,
  };
}

function toQuizQuestion(
  document: QuestionDocument,
  language: QuestionLanguage,
): QuizQuestion & Pick<QuestionDocument, 'id' | 'source'> {
  const translation = document.translations[language] ?? document.translations.pt;
  return {
    ...document,
    type: document.type ?? 'objetiva',
    topic: document.topic,
    prompt: translation.prompt,
    alternatives: translation.alternatives,
    answer: document.answer,
    explanation: translation.explanation,
    expectedAnswer: translation.expectedAnswer ?? document.expectedAnswer,
    expectedLines: document.expectedLines,
    imageUrl: document.imageUrl,
    imageAlt: document.imageAlt,
  };
}

export function useQuestionBank() {
  const { language } = useLanguage();
  const customQuestions = useQuestionStore((state) => state.customQuestions);

  const query = useQuery({
    queryKey: ['question-bank'],
    queryFn: async (): Promise<QuestionDocument[]> => {
      if (!isFirebaseConfigured) return INITIAL_QUESTION_DOCUMENTS;
      try {
        const snapshot = await getDocs(collection(db, 'questions'));
        if (snapshot.empty && !(await getDoc(doc(db, '_metadata', 'adminSeed'))).exists()) {
          return INITIAL_QUESTION_DOCUMENTS;
        }
        return snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        } as QuestionDocument));
      } catch (error) {
        console.warn('Falling back to local question bank:', error);
        return INITIAL_QUESTION_DOCUMENTS;
      }
    },
  });

  const localizedQuestions = useMemo(() => {
    const base = (query.data ?? INITIAL_QUESTION_DOCUMENTS).map((document) =>
      toQuizQuestion(document, language),
    );
    return [...customQuestions, ...base];
  }, [query.data, language, customQuestions]);

  return {
    ...query,
    questions: localizedQuestions,
    questionDocuments: query.data ?? INITIAL_QUESTION_DOCUMENTS,
  };
}

export { INITIAL_QUESTION_DOCUMENTS };
