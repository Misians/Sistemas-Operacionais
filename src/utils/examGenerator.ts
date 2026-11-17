import type { QuestionSource, QuestionTopic, QuestionType } from '../types/question';

export interface BankQuestionItem {
  id: string;
  type?: QuestionType;
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

export interface ExamConfig {
  examTitle: string;
  institution: string;
  discipline: string;
  professor: string;
  term: string;
  duration: string;
  instructions: string;
  versionCount: number;
  totalCopies: number;
  shuffleQuestions: boolean;
  shuffleAlternatives: boolean;
  includeBubbleSheet: boolean;
  includeAnswerKey: boolean;
  includeExplanations: boolean;
  columns: 1 | 2;
  seed: string;
}

export interface ExamQuestionItem {
  number: number;
  originalId: string;
  code: string;
  type: QuestionType;
  topic: QuestionTopic;
  source: QuestionSource;
  prompt: string;
  alternatives: string[];
  correctIndex: number;
  correctLetter: string;
  explanation: string;
  imageUrl?: string;
  imageAlt?: string;
  expectedAnswer?: string;
  expectedLines?: number;
}

export interface ExamVersion {
  index: number;
  label: string;
  examCode: string;
  questions: ExamQuestionItem[];
}

const TOPIC_CODE_PREFIX: Record<QuestionTopic, string> = {
  processos: 'PRC',
  memoria: 'MEM',
  sincronizacao: 'SNC',
  arquivos: 'ARQ',
};

/**
 * Generates a short, deterministic, human-readable code for any question
 * so teachers can quickly identify shuffled questions during grading.
 */
export function getQuestionCode(question: Pick<BankQuestionItem, 'id' | 'topic' | 'source'>): string {
  const topicPrefix = TOPIC_CODE_PREFIX[question.topic] ?? 'SO';
  const subjectMatch = /^subject-(\d+)$/.exec(question.id);
  if (subjectMatch) {
    const num = String(Number(subjectMatch[1]) + 1).padStart(2, '0');
    return `${topicPrefix}-${num}`;
  }

  const enadeMatch = /^enade-(\d+)$/.exec(question.id);
  if (enadeMatch) {
    const num = String(Number(enadeMatch[1]) + 1).padStart(2, '0');
    return `END-${topicPrefix}-${num}`;
  }

  const cleaned = question.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = cleaned.slice(-4).padStart(4, '0');
  const sourcePrefix = question.source === 'enade' ? 'END-' : '';
  return `${sourcePrefix}${topicPrefix}-${suffix}`;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createPrng(seedText: string): () => number {
  let state = hashSeed(seedText) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithPrng<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createRandomSeed(): string {
  const now = new Date();
  const year = now.getFullYear();
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SO-${year}-${randPart}`;
}

/**
 * Generates N distinct exam booklets (Caderno A, B, C...) with deterministic
 * question/alternative shuffling and recalculated answer keys.
 */
export function generateExamVersions(
  selectedQuestions: BankQuestionItem[],
  config: ExamConfig,
): ExamVersion[] {
  const count = Math.max(1, Math.min(10, config.versionCount));
  const normalizedSeed = config.seed.trim() || 'SO-2026';

  return Array.from({ length: count }, (_, versionIndex) => {
    const label = String.fromCharCode(65 + versionIndex);
    const versionRand = createPrng(`${normalizedSeed}::CADERNO-${label}`);

    const orderedQuestions = config.shuffleQuestions
      ? shuffleWithPrng(selectedQuestions, versionRand)
      : [...selectedQuestions];

    const questions: ExamQuestionItem[] = orderedQuestions.map((question, qIndex) => {
      const qType: QuestionType = question.type ?? (question.alternatives.length > 0 ? 'objetiva' : 'discursiva');
      if (qType === 'discursiva') {
        return {
          number: qIndex + 1,
          originalId: question.id,
          code: getQuestionCode(question),
          type: 'discursiva',
          topic: question.topic,
          source: question.source,
          prompt: question.prompt,
          alternatives: [],
          correctIndex: -1,
          correctLetter: 'DISC',
          explanation: question.explanation,
          imageUrl: question.imageUrl,
          imageAlt: question.imageAlt,
          expectedAnswer: question.expectedAnswer,
          expectedLines: question.expectedLines ?? 6,
        };
      }

      const indexedAlternatives = question.alternatives.map((text, idx) => ({
        text,
        isCorrect: idx === question.answer,
      }));

      const finalAlternatives = config.shuffleAlternatives
        ? shuffleWithPrng(indexedAlternatives, versionRand)
        : indexedAlternatives;

      const correctIndex = Math.max(
        0,
        finalAlternatives.findIndex((alt) => alt.isCorrect),
      );

      return {
        number: qIndex + 1,
        originalId: question.id,
        code: getQuestionCode(question),
        type: 'objetiva',
        topic: question.topic,
        source: question.source,
        prompt: question.prompt,
        alternatives: finalAlternatives.map((alt) => alt.text),
        correctIndex,
        correctLetter: String.fromCharCode(65 + correctIndex),
        explanation: question.explanation,
        imageUrl: question.imageUrl,
        imageAlt: question.imageAlt,
      };
    });

    return {
      index: versionIndex,
      label,
      examCode: `${normalizedSeed}-${label}`,
      questions,
    };
  });
}
