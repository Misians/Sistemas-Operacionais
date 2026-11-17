import type { QuestionSource, QuestionTopic, QuestionType } from '../types/question';
import type { NewCustomQuestion } from '../store/useQuestionStore';

export interface ParsedImportResult {
  valid: NewCustomQuestion[];
  errors: string[];
}

const TOPIC_ALIASES: Record<string, QuestionTopic> = {
  introducao: 'introducao',
  'introducao e arquitetura': 'introducao',
  'introducao e arquitetura de so': 'introducao',
  arquitetura: 'introducao',
  'arquitetura de so': 'introducao',
  arquitetura_so: 'introducao',
  syscalls: 'introducao',
  'chamadas de sistema': 'introducao',
  processos: 'processos',
  'processos e threads': 'processos',
  threads: 'processos',
  escalonamento: 'processos',
  processos_threads: 'processos',
  memoria: 'memoria',
  'gerenciamento de memoria': 'memoria',
  'gerencia de memoria': 'memoria',
  'memoria virtual': 'memoria',
  gerencia_memoria: 'memoria',
  sincronizacao: 'sincronizacao',
  'sincronizacao e deadlocks': 'sincronizacao',
  deadlock: 'sincronizacao',
  deadlocks: 'sincronizacao',
  arquivos: 'arquivos',
  'sistemas de arquivos': 'arquivos',
  'sistema de arquivos': 'arquivos',
  'sistema de gerenciamento de arquivos': 'arquivos',
  'gerenciamento de arquivos': 'arquivos',
  'gerencia de arquivos': 'arquivos',
  sistemas_arquivos: 'arquivos',
  io: 'io',
  'i/o': 'io',
  'e/s': 'io',
  es: 'io',
  'entrada e saida': 'io',
  'entrada/saida': 'io',
  'entrada e saida (e/s / i/o)': 'io',
  dispositivos: 'io',
  'gerenciamento de e/s': 'io',
  'gerenciamento de io': 'io',
  'gerenciamento de i/o': 'io',
  'dispositivos de e/s': 'io',
  seguranca: 'seguranca',
  'seguranca e protecao': 'seguranca',
  protecao: 'seguranca',
  'controle de acesso': 'seguranca',
  virtualizacao: 'virtualizacao',
  'virtualizacao e conteineres': 'virtualizacao',
  conteineres: 'virtualizacao',
  containers: 'virtualizacao',
  'maquinas virtuais': 'virtualizacao',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function resolveTopic(rawTopic: unknown): QuestionTopic {
  if (typeof rawTopic !== 'string' || !rawTopic.trim()) return 'processos';
  const normalized = normalizeText(rawTopic);
  return TOPIC_ALIASES[normalized] ?? 'processos';
}

function resolveSource(rawSource: unknown): QuestionSource {
  if (typeof rawSource !== 'string') return 'custom';
  const normalized = normalizeText(rawSource);
  if (normalized === 'enade') return 'enade';
  if (normalized === 'assunto') return 'assunto';
  return 'custom';
}

function resolveAnswerIndex(rawAnswer: unknown, alternativesCount: number): number | null {
  if (typeof rawAnswer === 'number' && Number.isInteger(rawAnswer)) {
    return rawAnswer >= 0 && rawAnswer < alternativesCount ? rawAnswer : null;
  }
  if (typeof rawAnswer === 'string') {
    const trimmed = rawAnswer.trim().toUpperCase();
    if (/^[A-Z]$/.test(trimmed)) {
      const index = trimmed.charCodeAt(0) - 65;
      return index >= 0 && index < alternativesCount ? index : null;
    }
    const parsed = Number(trimmed);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < alternativesCount) {
      return parsed;
    }
  }
  return null;
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

export function parseQuestionsFromJson(rawText: string): ParsedImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: [], errors: ['JSON inválido. Verifique a sintaxe (aspas, vírgulas e chaves).'] };
  }

  const items: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { questions?: unknown }).questions)
      ? (parsed as { questions: unknown[] }).questions
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { questoes?: unknown }).questoes)
        ? (parsed as { questoes: unknown[] }).questoes
        : [];

  if (items.length === 0) {
    return {
      valid: [],
      errors: ['Nenhuma lista de questões encontrada. Envie um array [...] ou um objeto com a chave "questions".'],
    };
  }

  const valid: NewCustomQuestion[] = [];
  const errors: string[] = [];

  items.forEach((item, index) => {
    const label = `Item ${index + 1}`;
    if (typeof item !== 'object' || item === null) {
      errors.push(`${label}: formato inválido (esperado objeto).`);
      return;
    }

    const record = item as Record<string, unknown>;
    const prompt = pickString(record.prompt, record.enunciado, record.pergunta);
    if (!prompt) {
      errors.push(`${label}: enunciado (prompt/enunciado) obrigatório.`);
      return;
    }

    const rawAlts = record.alternatives ?? record.alternativas ?? record.opcoes;
    const alternatives = Array.isArray(rawAlts)
      ? rawAlts.filter((alt): alt is string => typeof alt === 'string' && alt.trim().length > 0).map((alt) => alt.trim())
      : [];

    const expectedAnswer = pickString(
      record.expectedAnswer,
      record.respostaEsperada,
      record.espelho,
      record.resposta,
      record.gabaritoDiscursivo,
    );

    const rawType = pickString(record.type, record.tipo);
    const normalizedType = rawType ? normalizeText(rawType) : undefined;
    let type: QuestionType;

    if (normalizedType === 'discursiva' || normalizedType === 'aberta' || normalizedType === 'essay') {
      type = 'discursiva';
    } else if (normalizedType === 'objetiva' || normalizedType === 'multipla escolha' || normalizedType === 'multiple_choice') {
      type = 'objetiva';
    } else {
      type = alternatives.length >= 2 ? 'objetiva' : 'discursiva';
    }

    const imageUrl = pickString(record.imageUrl, record.imagem, record.image);
    const imageAlt = pickString(record.imageAlt, record.altImagem);
    const explanation = pickString(record.explanation, record.explicacao, record.comentario) ?? '';
    const topic = resolveTopic(record.topic ?? record.assunto ?? record.tema);
    const source = resolveSource(record.source ?? record.origem);

    if (type === 'objetiva') {
      if (alternatives.length < 2) {
        errors.push(`${label}: questão objetiva precisa de pelo menos 2 alternativas.`);
        return;
      }
      const answerIndex = resolveAnswerIndex(record.answer ?? record.gabarito ?? record.correta, alternatives.length);
      if (answerIndex === null) {
        errors.push(`${label}: índice/letra de resposta correta (answer/gabarito) inválido.`);
        return;
      }
      valid.push({
        type: 'objetiva',
        source,
        topic,
        prompt,
        alternatives,
        answer: answerIndex,
        explanation,
        imageUrl,
        imageAlt,
      });
      return;
    }

    if (!expectedAnswer) {
      errors.push(`${label}: questão discursiva precisa de "expectedAnswer" ou "espelho" para o espelho de correção.`);
      return;
    }

    const rawLines = Number(record.expectedLines ?? record.linhas);
    const expectedLines = Number.isFinite(rawLines) && rawLines >= 2 && rawLines <= 20 ? Math.round(rawLines) : 6;

    valid.push({
      type: 'discursiva',
      source,
      topic,
      prompt,
      alternatives: [],
      answer: -1,
      expectedAnswer,
      expectedLines,
      explanation,
      imageUrl,
      imageAlt,
    });
  });

  return { valid, errors };
}

export async function readImageAsDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/svg+xml' || rawDataUrl.length < 320_000) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1200;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

export const SAMPLE_QUESTIONS_JSON = JSON.stringify(
  [
    {
      type: 'objetiva',
      topic: 'processos',
      source: 'assunto',
      prompt: 'Qual algoritmo de escalonamento pode causar starvation em processos longos quando há chegada contínua de processos curtos?',
      alternatives: [
        'Round-Robin (Circular)',
        'Shortest Job First (SJF) / SRTF',
        'FIFO (First-In, First-Out)',
        'Escalonamento em lote com quantum fixo',
      ],
      answer: 1,
      explanation: 'No SJF e no SRTF, tarefas curtas têm preferência contínua, podendo adiar indefinidamente tarefas longas.',
      imageUrl: '',
    },
    {
      type: 'discursiva',
      topic: 'memoria',
      source: 'custom',
      prompt: 'Explique o fenômeno de thrashing (hiperpaginação) em sistemas com memória virtual e indique uma medida adotada pelo sistema operacional para mitigá-lo.',
      expectedAnswer: 'Thrashing ocorre quando o conjunto de trabalho (working set) dos processos ativos excede a memória física disponível, fazendo o sistema gastar mais tempo trocando páginas com o disco do que executando instruções úteis. O sistema pode mitigar o problema suspendendo temporariamente processos (controle do grau de multiprogramação) ou usando algoritmos baseados em working set / frequência de falta de página.',
      expectedLines: 6,
      explanation: 'Avaliar se o aluno relaciona excesso de page faults à queda abrupta de utilização da CPU.',
    },
  ],
  null,
  2,
);
