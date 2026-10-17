import { useMemo, useState } from 'react';
import { BookOpenCheck, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { ENADE_QUESTIONS, SUBJECT_QUESTIONS, TOPIC_LABELS, type QuizQuestion } from '../data/questions';

type QuizMode = 'assunto' | 'enade';
const TOPICS = Object.entries(TOPIC_LABELS);

export function QuizSection() {
  const [mode, setMode] = useState<QuizMode>('assunto');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0][0]);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const availableQuestions = useMemo(() => {
    const source = mode === 'enade' ? ENADE_QUESTIONS : SUBJECT_QUESTIONS;
    return mode === 'enade' ? source : source.filter((question) => question.topic === selectedTopic);
  }, [mode, selectedTopic]);

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
  };

  const chooseMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    resetQuiz();
  };

  const recordAnswer = () => {
    if (selectedAnswer === null || !quiz) return;
    setAnswers((previous) => [...previous, selectedAnswer]);
    setSelectedAnswer(null);
    setCurrentQuestion((index) => index + 1);
  };

  const score = quiz?.reduce(
    (total, question, index) => total + (answers[index] === question.answer ? 1 : 0),
    0,
  ) ?? 0;
  const isComplete = quiz !== null && currentQuestion >= quiz.length;
  const question = quiz && !isComplete ? quiz[currentQuestion] : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-orange-100 bg-orange-50/70 p-3 sm:p-4">
        <button onClick={() => chooseMode('assunto')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          mode === 'assunto' ? 'bg-red-800 text-white shadow-sm' : 'text-stone-600 hover:bg-white'
        }`}>
          <BookOpenCheck className="h-4 w-4" /> Por assunto
        </button>
        <button onClick={() => chooseMode('enade')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          mode === 'enade' ? 'bg-red-800 text-white shadow-sm' : 'text-stone-600 hover:bg-white'
        }`}>
          <Sparkles className="h-4 w-4" /> Simulado estilo ENADE
        </button>
      </div>

      <div className="p-5 sm:p-8">
        {!quiz ? (
          <div className="grid gap-8 md:grid-cols-[1fr_0.75fr] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                {mode === 'assunto' ? 'Monte sua prova' : 'Treine para avaliações'}
              </p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">
                {mode === 'assunto' ? 'Escolha um assunto para praticar' : 'Questões em formato de simulado'}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                {mode === 'assunto'
                  ? 'Faça um questionário, confira sua pontuação e revise a explicação de cada resposta.'
                  : 'Pratique com questões autorais contextualizadas, inspiradas no formato de avaliações do ENADE.'}
              </p>
              {mode === 'enade' && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                  Este simulado contém questões autorais de exemplo. Elas não são questões oficiais nem foram extraídas de provas do INEP.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
              {mode === 'assunto' && (
                <label className="mb-4 block text-xs font-bold uppercase tracking-wide text-stone-600">
                  Assunto
                  <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm font-medium text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    {TOPICS.map(([topic, label]) => <option key={topic} value={topic}>{label}</option>)}
                  </select>
                </label>
              )}
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-stone-600">Questões disponíveis</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-800">{availableQuestions.length}</span>
              </div>
              <button onClick={() => setQuiz(availableQuestions)} disabled={availableQuestions.length === 0} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-red-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50">
                Começar questionário
              </button>
            </div>
          </div>
        ) : isComplete ? (
          <div>
            <div className="rounded-2xl bg-gradient-to-r from-red-800 to-orange-600 p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Questionário concluído</p>
              <h2 className="mt-2 text-3xl font-black">Você acertou {score} de {quiz.length}</h2>
              <p className="mt-2 text-sm text-red-50/85">
                {score === quiz.length ? 'Excelente! Você acertou todas as questões.' : 'Revise as explicações abaixo e tente novamente para consolidar os conceitos.'}
              </p>
            </div>
            <div className="mt-6 space-y-4">
              {quiz.map((item, index) => {
                const correct = answers[index] === item.answer;
                return (
                  <article key={`${item.topic}-${index}`} className="rounded-2xl border border-orange-100 p-5">
                    <div className="mb-2 flex items-center gap-2">
                      {correct ? <Check className="h-4 w-4 text-green-700" /> : <X className="h-4 w-4 text-red-700" />}
                      <span className={`text-xs font-bold ${correct ? 'text-green-700' : 'text-red-700'}`}>{correct ? 'Acertou' : 'Resposta incorreta'}</span>
                      <span className="text-xs text-stone-400">· {TOPIC_LABELS[item.topic]}</span>
                    </div>
                    <p className="text-sm font-semibold leading-6 text-stone-900">{item.prompt}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.explanation}</p>
                  </article>
                );
              })}
            </div>
            <button onClick={resetQuiz} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900">
              <RotateCcw className="h-4 w-4" /> Fazer outro questionário
            </button>
          </div>
        ) : question ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-900">{TOPIC_LABELS[question.topic]}</span>
              <span className="text-xs font-semibold text-stone-500">Questão {currentQuestion + 1} de {quiz.length}</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full rounded-full bg-gradient-to-r from-red-700 to-orange-500 transition-all" style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }} />
            </div>
            <h2 className="text-lg font-bold leading-7 text-stone-900">{question.prompt}</h2>
            <div className="mt-5 space-y-2.5">
              {question.alternatives.map((alternative, index) => (
                <button key={alternative} onClick={() => setSelectedAnswer(index)} aria-pressed={selectedAnswer === index} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm leading-6 transition ${
                  selectedAnswer === index ? 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-100' : 'border-orange-100 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50/50'
                }`}>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    selectedAnswer === index ? 'bg-red-700 text-white' : 'bg-orange-100 text-orange-900'
                  }`}>{String.fromCharCode(65 + index)}</span>
                  {alternative}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={recordAnswer} disabled={selectedAnswer === null} className="rounded-xl bg-red-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-stone-300">
                {currentQuestion === quiz.length - 1 ? 'Ver resultado' : 'Próxima questão'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
