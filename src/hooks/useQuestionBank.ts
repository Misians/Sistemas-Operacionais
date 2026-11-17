import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ENADE_QUESTIONS,
  SUBJECT_QUESTIONS,
  type QuizQuestion,
} from '../data/questions';
import { englishQuestionMessages, spanishQuestionMessages, chineseQuestionMessages } from '../i18n/questionTranslations';
import type { QuestionDocument, QuestionLanguage, QuestionTranslation } from '../types/question';
import { useLanguage } from '../i18n/LanguageContext';

const INITIAL_QUESTION_DOCUMENTS: QuestionDocument[] = [
  ...SUBJECT_QUESTIONS.map((question, index) => createInitialQuestion(question, `subject-${index}`, 'assunto')),
  ...ENADE_QUESTIONS.map((question, index) => createInitialQuestion(question, `enade-${index}`, 'enade')),
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
  });
  const now = Date.now();

  return {
    id,
    topic: question.topic,
    source,
    answer: question.answer,
    translations: {
      pt: {
        prompt: question.prompt,
        alternatives: question.alternatives,
        explanation: question.explanation,
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
  const translation = document.translations[language];
  return {
    ...document,
    topic: document.topic,
    prompt: translation.prompt,
    alternatives: translation.alternatives,
    answer: document.answer,
    explanation: translation.explanation,
  };
}

export function useQuestionBank() {
  const { language } = useLanguage();
  const query = useQuery({
    queryKey: ['question-bank'],
    queryFn: async (): Promise<QuestionDocument[]> => {
      if (!import.meta.env.VITE_FIREBASE_API_KEY) return INITIAL_QUESTION_DOCUMENTS;
      const snapshot = await getDocs(collection(db, 'questions'));
      if (snapshot.empty && !(await getDoc(doc(db, '_metadata', 'adminSeed'))).exists()) {
        return INITIAL_QUESTION_DOCUMENTS;
      }
      return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      } as QuestionDocument));
    },
  });

  const localizedQuestions = (query.data ?? (!import.meta.env.VITE_FIREBASE_API_KEY ? INITIAL_QUESTION_DOCUMENTS : [])).map((document) =>
    toQuizQuestion(document, language),
  );

  return {
    ...query,
    questions: localizedQuestions,
    questionDocuments: query.data ?? (!import.meta.env.VITE_FIREBASE_API_KEY ? INITIAL_QUESTION_DOCUMENTS : []),
  };
}

export { INITIAL_QUESTION_DOCUMENTS };
