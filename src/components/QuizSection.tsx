import { useMemo, useState } from 'react';
import { BookOpenCheck, Check, FileText, RotateCcw, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { TOPIC_LABELS, type QuizQuestion } from '../data/questions';

type QuizMode = 'assunto' | 'enade' | 'discursivas';
const TOPICS = Object.entries(TOPIC_LABELS);
const PRESET_COUNTS = [3, 5, 10, 15];

function pickRandomQuestions<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

type UserAnswer =
  | { type: 'objetiva'; selected: number }
  | { type: 'discursiva'; text: string };

export function QuizSection() {
  const { t } = useLanguage();
  const { questions: questionBank, isLoading, error } = useQuestionBank();
  const [mode, setMode] = useState<QuizMode>('assunto');
  const [selectedTopic, setSelectedTopic] = useState('todos');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [answers, setAnswers] = useState<UserAnswer[]>([]);

  const availableQuestions = useMemo(() => {
    const matchesTopic = (topic: string) => selectedTopic === 'todos' || topic === selectedTopic;
    if (mode === 'discursivas') {
      return questionBank.filter((question) => question.type === 'discursiva' && matchesTopic(question.topic));
    }
    if (mode === 'enade') {
      return questionBank.filter(
        (question) => question.source === 'enade' && question.type !== 'discursiva' && matchesTopic(question.topic),
      );
    }
    return questionBank.filter((question) => question.type !== 'discursiva' && matchesTopic(question.topic));
  }, [mode, questionBank, selectedTopic]);

  const effectiveCount =
    availableQuestions.length === 0 ? 0 : Math.min(Math.max(1, questionCount), availableQuestions.length);

  const startQuiz = () => {
    if (effectiveCount === 0) return;
    setQuiz(pickRandomQuestions(availableQuestions, effectiveCount));
  };

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setWrittenAnswer('');
    setAnswers([]);
  };

  const chooseMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    resetQuiz();
  };

  const isComplete = quiz !== null && currentQuestion >= quiz.length;
  const question = quiz && !isComplete ? quiz[currentQuestion] : null;
  const isDiscursive = question?.type === 'discursiva';
  const canSubmitCurrent = isDiscursive
    ? writtenAnswer.trim().length > 0
    : selectedAnswer !== null;

  const recordAnswer = () => {
    if (!quiz || !question || !canSubmitCurrent) return;
    const entry: UserAnswer = isDiscursive
      ? { type: 'discursiva', text: writtenAnswer.trim() }
      : { type: 'objetiva', selected: selectedAnswer as number };
    setAnswers((previous) => [...previous, entry]);
    setSelectedAnswer(null);
    setWrittenAnswer('');
    setCurrentQuestion((index) => index + 1);
  };

  const objectiveCount = quiz?.filter((q) => q.type !== 'discursiva').length ?? 0;
  const score = quiz?.reduce((total, item, index) => {
    const ans = answers[index];
    if (item.type === 'discursiva' || ans?.type !== 'objetiva') return total;
    return total + (ans.selected === item.answer ? 1 : 0);
  }, 0) ?? 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-stone-100 bg-stone-50/80 p-3 sm:p-4">
        <button
          onClick={() => chooseMode('assunto')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            mode === 'assunto' ? 'bg-red-800 text-white shadow-sm' : 'text-stone-600 hover:bg-white'
          }`}
        >
          <BookOpenCheck className="h-4 w-4" /> {t('Por assunto')}
        </button>
        <button
          onClick={() => chooseMode('enade')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            mode === 'enade' ? 'bg-red-800 text-white shadow-sm' : 'text-stone-600 hover:bg-white'
          }`}
        >
          <Sparkles className="h-4 w-4" /> {t('Simulado estilo ENADE')}
        </button>
        <button
          onClick={() => chooseMode('discursivas')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            mode === 'discursivas' ? 'bg-red-800 text-white shadow-sm' : 'text-stone-600 hover:bg-white'
          }`}
        >
          <FileText className="h-4 w-4" /> {t('Discursivas com espelho')}
        </button>
      </div>

      <div className="p-5 sm:p-8">
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {t('Não foi possível carregar as questões.')} {error.message}
          </p>
        ) : isLoading ? (
          <p className="py-8 text-center text-sm text-stone-500">{t('Carregando questões...')}</p>
        ) : !quiz ? (
          <div className="grid gap-8 md:grid-cols-[1fr_0.75fr] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                {t(
                  mode === 'assunto'
                    ? 'Monte sua prova'
                    : mode === 'enade'
                      ? 'Treine para avaliações'
                      : 'Prática escrita',
                )}
              </p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">
                {t(
                  mode === 'assunto'
                    ? 'Escolha um assunto para praticar'
                    : mode === 'enade'
                      ? 'Questões em formato de simulado'
                      : 'Questões discursivas com espelho de correção',
                )}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                {mode === 'assunto'
                  ? t('Faça um questionário, confira sua pontuação e revise a explicação de cada resposta.')
                  : mode === 'enade'
                    ? t('Pratique com questões autorais contextualizadas, inspiradas no formato de avaliações do ENADE.')
                    : t('Escreva sua resposta e compare ao final com o espelho esperado pelo docente.')}
              </p>
              {mode === 'enade' && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                  {t('Este simulado contém questões autorais de exemplo. Elas não são questões oficiais nem foram extraídas de provas do INEP.')}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
              <label className="mb-4 block text-xs font-bold uppercase tracking-wide text-stone-600">
                {t('Assunto')}
                <select
                  value={selectedTopic}
                  onChange={(event) => setSelectedTopic(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="todos">{t('Todos os assuntos')}</option>
                  {TOPICS.map(([topic, label]) => (
                    <option key={topic} value={topic}>{t(label)}</option>
                  ))}
                </select>
              </label>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
                  {t('Quantidade de questões')}
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, availableQuestions.length)}
                    disabled={availableQuestions.length === 0}
                    value={effectiveCount}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next)) {
                        setQuestionCount(Math.max(1, Math.round(next)));
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50"
                  />
                </label>
                {availableQuestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_COUNTS.filter((n) => n < availableQuestions.length).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                          effectiveCount === count
                            ? 'border-red-700 bg-red-800 text-white'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-red-300'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuestionCount(availableQuestions.length)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        effectiveCount === availableQuestions.length
                          ? 'border-red-700 bg-red-800 text-white'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-red-300'
                      }`}
                    >
                      {t('Todas')} ({availableQuestions.length})
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-stone-600">{t('Questões disponíveis')}</span>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-red-800">
                  {availableQuestions.length}
                </span>
              </div>
              <button
                onClick={startQuiz}
                disabled={effectiveCount === 0}
                className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-stone-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Começar questionário')}
              </button>
            </div>
          </div>
        ) : isComplete ? (
          <div>
            <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-red-900 to-orange-700 p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200">{t('Questionário concluído')}</p>
              <h2 className="mt-2 text-3xl font-black">
                {objectiveCount > 0
                  ? t('Você acertou {score} de {total}', { score, total: objectiveCount })
                  : t('Respostas registradas para autoavaliação')}
              </h2>
              <p className="mt-2 text-sm text-red-50/85">
                {objectiveCount > 0 && score === objectiveCount
                  ? t('Excelente! Você acertou todas as questões.')
                  : t('Revise as explicações abaixo e tente novamente para consolidar os conceitos.')}
              </p>
            </div>
            <div className="mt-6 space-y-4">
              {quiz.map((item, index) => {
                const userAnswer = answers[index];
                if (item.type === 'discursiva') {
                  return (
                    <article key={`${item.topic}-${index}`} className="rounded-2xl border border-stone-200 p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-800">{t('Discursiva')}</span>
                        <span className="text-xs text-stone-400">· {t(TOPIC_LABELS[item.topic])}</span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-stone-900">{t(item.prompt)}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-5 text-stone-700">
                          <p className="mb-1 font-bold uppercase tracking-wide text-stone-500">{t('Sua resposta')}</p>
                          {userAnswer?.type === 'discursiva' ? userAnswer.text : '—'}
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs leading-5 text-amber-950">
                          <p className="mb-1 font-bold uppercase tracking-wide text-amber-800">{t('Espelho de resposta')}</p>
                          {item.expectedAnswer || t('Sem espelho cadastrado.')}
                        </div>
                      </div>
                    </article>
                  );
                }

                const correct = userAnswer?.type === 'objetiva' && userAnswer.selected === item.answer;
                return (
                  <article key={`${item.topic}-${index}`} className="rounded-2xl border border-stone-200 p-5">
                    <div className="mb-2 flex items-center gap-2">
                      {correct ? <Check className="h-4 w-4 text-emerald-700" /> : <X className="h-4 w-4 text-red-700" />}
                      <span className={`text-xs font-bold ${correct ? 'text-emerald-700' : 'text-red-700'}`}>
                        {correct ? t('Acertou') : t('Resposta incorreta')}
                      </span>
                      <span className="text-xs text-stone-400">· {t(TOPIC_LABELS[item.topic])}</span>
                    </div>
                    <p className="text-sm font-semibold leading-6 text-stone-900">{t(item.prompt)}</p>
                    {item.explanation && <p className="mt-2 text-sm leading-6 text-stone-600">{t(item.explanation)}</p>}
                  </article>
                );
              })}
            </div>
            <button
              onClick={resetQuiz}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900"
            >
              <RotateCcw className="h-4 w-4" /> {t('Fazer outro questionário')}
            </button>
          </div>
        ) : question ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-900">
                {t(TOPIC_LABELS[question.topic])}
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {t('Questão {current} de {total}', { current: currentQuestion + 1, total: quiz.length })}
              </span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-700 to-orange-500 transition-all"
                style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
              />
            </div>
            <h2 className="text-lg font-bold leading-7 text-stone-900">{t(question.prompt)}</h2>
            {question.imageUrl && (
              <div className="mt-4">
                <img
                  src={question.imageUrl}
                  alt={question.imageAlt || t('Imagem da questão')}
                  className="max-h-72 rounded-2xl border border-stone-200 bg-stone-50 object-contain"
                />
              </div>
            )}

            {isDiscursive ? (
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
                  {t('Sua resposta discursiva')}
                  <textarea
                    rows={5}
                    placeholder={t('Escreva sua explicação aqui para comparar com o espelho ao final...')}
                    value={writtenAnswer}
                    onChange={(event) => setWrittenAnswer(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50/50 p-4 text-sm font-normal leading-6 text-stone-800 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-2.5">
                {question.alternatives.map((alternative, index) => (
                  <button
                    key={`${alternative}-${index}`}
                    onClick={() => setSelectedAnswer(index)}
                    aria-pressed={selectedAnswer === index}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm leading-6 transition ${
                      selectedAnswer === index
                        ? 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-100'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        selectedAnswer === index ? 'bg-red-700 text-white' : 'bg-orange-100 text-orange-900'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    {t(alternative)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={recordAnswer}
                disabled={!canSubmitCurrent}
                className="rounded-xl bg-red-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {currentQuestion === quiz.length - 1 ? t('Ver resultado') : t('Próxima questão')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
