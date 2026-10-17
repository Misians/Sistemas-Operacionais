import { useMemo, useState } from 'react';
import { CheckSquare, Printer, RotateCcw } from 'lucide-react';
import { ENADE_QUESTIONS, SUBJECT_QUESTIONS, TOPIC_LABELS, type QuizQuestion } from '../data/questions';
import { PageIntro } from './SitePages';

type QuestionSource = 'assunto' | 'enade';

interface BankQuestion extends QuizQuestion {
  id: string;
  source: QuestionSource;
}

const QUESTION_BANK: BankQuestion[] = [
  ...SUBJECT_QUESTIONS.map((question, index) => ({ ...question, id: `assunto-${index}`, source: 'assunto' as const })),
  ...ENADE_QUESTIONS.map((question, index) => ({ ...question, id: `enade-${index}`, source: 'enade' as const })),
];

export function QuestionBank() {
  const [source, setSource] = useState<'todas' | QuestionSource>('todas');
  const [topic, setTopic] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExamReady, setIsExamReady] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);

  const filteredQuestions = useMemo(
    () => QUESTION_BANK.filter((question) =>
      (source === 'todas' || question.source === source) &&
      (topic === 'todos' || question.topic === topic),
    ),
    [source, topic],
  );
  const selectedQuestions = QUESTION_BANK.filter((question) => selectedIds.includes(question.id));

  const setFilter = (nextSource: typeof source, nextTopic: string) => {
    setSource(nextSource);
    setTopic(nextTopic);
    setIsExamReady(false);
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((selected) =>
      selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : [...selected, id],
    );
    setIsExamReady(false);
  };

  const selectVisible = () => {
    setSelectedIds((selected) => Array.from(new Set([...selected, ...filteredQuestions.map(({ id }) => id)])));
    setIsExamReady(false);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setIsExamReady(false);
  };

  return (
    <PageIntro
      eyebrow="Monte avaliações"
      title="Banco de questões"
      description="Selecione questões já disponíveis nos simulados do projeto, organize uma prova e imprima uma versão para os alunos."
    >
      <div className="grid gap-7 xl:grid-cols-[1fr_340px]">
        <section className="space-y-4 print:hidden">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todas', label: 'Todas as origens' },
              { id: 'assunto', label: 'Por assunto' },
              { id: 'enade', label: 'Simulado estilo ENADE' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilter(filter.id as typeof source, topic)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  source === filter.id ? 'bg-red-800 text-white' : 'border border-orange-100 bg-white text-stone-600 hover:bg-orange-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="block max-w-sm text-sm font-semibold text-stone-700">
            Filtrar por assunto
            <select
              value={topic}
              onChange={(event) => setFilter(source, event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos os assuntos</option>
              {Object.entries(TOPIC_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
            <p className="text-sm text-stone-600">{filteredQuestions.length} questões encontradas · {selectedIds.length} selecionadas</p>
            <button onClick={selectVisible} className="text-xs font-bold text-red-800 hover:underline">
              Selecionar questões exibidas
            </button>
          </div>

          {source === 'enade' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              Questões autorais de exemplo, inspiradas no formato de avaliações do ENADE; não são itens oficiais do INEP.
            </p>
          )}

          <div className="space-y-3">
            {filteredQuestions.map((question) => {
              const checked = selectedIds.includes(question.id);
              return (
                <label key={question.id} className={`block cursor-pointer rounded-2xl border bg-white p-5 transition ${
                  checked ? 'border-red-300 ring-2 ring-red-50' : 'border-orange-100 hover:border-orange-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleQuestion(question.id)} className="mt-1 h-4 w-4 accent-red-800" />
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-900">{TOPIC_LABELS[question.topic]}</span>
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                          {question.source === 'enade' ? 'Simulado estilo ENADE' : 'Questionário por assunto'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold leading-6 text-stone-900">{question.prompt}</span>
                      <ul className="mt-3 space-y-1 text-xs leading-5 text-stone-600">
                        {question.alternatives.map((alternative, index) => (
                          <li key={alternative}>{String.fromCharCode(65 + index)}) {alternative}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-800">
            <CheckSquare className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-stone-900">Sua prova</h2>
          <p className="mt-1 text-sm leading-5 text-stone-600">
            {selectedIds.length === 0
              ? 'Marque as questões que deseja incluir na avaliação.'
              : `${selectedIds.length} questão(ões) selecionada(s).`}
          </p>
          <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} className="mt-0.5 accent-red-800" />
            Incluir gabarito na impressão
          </label>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => setIsExamReady(true)}
            className="mt-5 w-full rounded-xl bg-red-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Gerar prova
          </button>
          {isExamReady && (
            <button onClick={() => window.print()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-red-950 hover:bg-orange-400">
              <Printer className="h-4 w-4" /> Imprimir / salvar em PDF
            </button>
          )}
          <button onClick={clearSelection} disabled={selectedIds.length === 0} className="mt-3 inline-flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-stone-500 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" /> Limpar seleção
          </button>
        </aside>
      </div>

      {isExamReady && selectedQuestions.length > 0 && (
        <section className="print-exam mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-stone-950">
          <header className="border-b-2 border-stone-900 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider">SO Docente Hub · Avaliação de Sistemas Operacionais</p>
            <h2 className="mt-2 text-2xl font-black">Prova</h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <p>Nome: ___________________________________________________</p>
              <p>Turma: _______________________ Data: ____ / ____ / ______</p>
            </div>
          </header>
          <ol className="mt-6 space-y-7">
            {selectedQuestions.map((question, index) => (
              <li key={question.id} className="break-inside-avoid">
                <p className="text-sm font-semibold leading-6">{index + 1}. {question.prompt}</p>
                <ol className="mt-2 space-y-1 pl-5 text-sm leading-6">
                  {question.alternatives.map((alternative, alternativeIndex) => (
                    <li key={alternative}>{String.fromCharCode(65 + alternativeIndex)}) {alternative}</li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
          {includeAnswerKey && (
            <section className="mt-10 break-before-page border-t-2 border-stone-900 pt-5">
              <h3 className="text-lg font-black">Gabarito do professor</h3>
              <ol className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {selectedQuestions.map((question, index) => (
                  <li key={question.id}>{index + 1}. {String.fromCharCode(65 + question.answer)}</li>
                ))}
              </ol>
            </section>
          )}
        </section>
      )}
    </PageIntro>
  );
}
