import { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Columns2,
  Dices,
  FileCheck2,
  Printer,
  RotateCcw,
  Search,
  Settings2,
  Shuffle,
  SlidersHorizontal,
} from 'lucide-react';
import { TOPIC_LABELS } from '../data/questions';
import { PageIntro } from './SitePages';
import { useLanguage } from '../i18n/LanguageContext';
import { useQuestionBank } from '../hooks/useQuestionBank';
import type { QuestionSource } from '../types/question';
import {
  createRandomSeed,
  generateExamVersions,
  getQuestionCode,
  type ExamConfig,
} from '../utils/examGenerator';
import { ExamPrintSheet } from './ExamPrintSheet';

const DEFAULT_INSTRUCTIONS =
  'Leia atentamente cada questão antes de responder. Utilize caneta esferográfica azul ou preta na folha de respostas. Não é permitido o uso de materiais não autorizados.';

export function QuestionBank() {
  const { t } = useLanguage();
  const { questions, isLoading, error } = useQuestionBank();
  const previewRef = useRef<HTMLDivElement>(null);

  const [source, setSource] = useState<'todas' | QuestionSource>('todas');
  const [topic, setTopic] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExamReady, setIsExamReady] = useState(false);
  const [showMetadataFields, setShowMetadataFields] = useState(false);

  const [config, setConfig] = useState<ExamConfig>({
    examTitle: 'Avaliação de Sistemas Operacionais',
    institution: 'SO Docente Hub',
    discipline: 'Sistemas Operacionais',
    professor: '',
    term: '',
    duration: '90 min',
    instructions: DEFAULT_INSTRUCTIONS,
    versionCount: 2,
    totalCopies: 4,
    shuffleQuestions: true,
    shuffleAlternatives: true,
    includeBubbleSheet: true,
    includeAnswerKey: true,
    includeExplanations: false,
    columns: 2,
    seed: createRandomSeed(),
  });

  const updateConfig = <K extends keyof ExamConfig>(key: K, value: ExamConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesSource = source === 'todas' || question.source === source;
      const matchesTopic = topic === 'todos' || question.topic === topic;
      if (!matchesSource || !matchesTopic) return false;
      if (!query) return true;
      const code = getQuestionCode(question).toLowerCase();
      return (
        code.includes(query) ||
        t(question.prompt).toLowerCase().includes(query) ||
        question.alternatives.some((alt) => t(alt).toLowerCase().includes(query))
      );
    });
  }, [questions, source, topic, searchQuery, t]);

  const selectedQuestions = useMemo(
    () => questions.filter((question) => selectedIds.includes(question.id)),
    [questions, selectedIds],
  );

  const examVersions = useMemo(() => {
    if (!isExamReady || selectedQuestions.length === 0) return [];
    return generateExamVersions(selectedQuestions, config);
  }, [isExamReady, selectedQuestions, config]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((selected) =>
      selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : [...selected, id],
    );
  };

  const selectVisible = () => {
    setSelectedIds((selected) => Array.from(new Set([...selected, ...filteredQuestions.map(({ id }) => id)])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setIsExamReady(false);
  };

  const handleGenerateExam = () => {
    if (selectedIds.length === 0) return;
    setIsExamReady(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <PageIntro
      eyebrow={t('Monte avaliações')}
      title={t('Banco de questões & Gerador de Provas')}
      description={t(
        'Selecione questões por código ou assunto, gere múltiplos cadernos embaralhados (A, B, C...) no estilo concurso com folha de respostas e imprima com gabarito oficial consolidado.',
      )}
    >
      <div className="grid gap-7 xl:grid-cols-[1fr_390px] print:hidden">
        {/* Left Column: Filter & Question Selection */}
        <section className="space-y-4">
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {t('Não foi possível carregar as questões.')} {error.message}
            </p>
          )}
          {isLoading && (
            <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
              {t('Carregando questões...')}
            </p>
          )}

          {/* Filter Bar */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'todas', label: t('Todas as origens') },
                { id: 'assunto', label: t('Por assunto') },
                { id: 'enade', label: t('Simulado estilo ENADE') },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSource(filter.id as typeof source)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                    source === filter.id
                      ? 'bg-red-800 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('Assunto')}
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                >
                  <option value="todos">{t('Todos os assuntos')}</option>
                  {Object.entries(TOPIC_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {t(label)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('Buscar por texto ou código')}
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('Ex: PRC-01, deadlock, paginação...')}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm font-normal text-stone-800 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Selection Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200/70 bg-orange-50/70 px-4 py-3">
            <p className="text-sm font-medium text-stone-700">
              {t('{count} questões encontradas · {selected} selecionadas', {
                count: filteredQuestions.length,
                selected: selectedIds.length,
              })}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={selectVisible}
                className="text-xs font-bold text-red-800 hover:underline"
              >
                {t('Selecionar questões exibidas')}
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-semibold text-stone-500 hover:text-red-800"
                >
                  {t('Limpar')}
                </button>
              )}
            </div>
          </div>

          {source === 'enade' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-950">
              {t('Questões autorais de exemplo, inspiradas no formato de avaliações do ENADE; não são itens oficiais do INEP.')}
            </p>
          )}

          {/* Question Cards */}
          <div className="space-y-3">
            {!isLoading &&
              !error &&
              filteredQuestions.map((question) => {
                const checked = selectedIds.includes(question.id);
                const code = getQuestionCode(question);
                return (
                  <label
                    key={question.id}
                    className={`block cursor-pointer rounded-2xl border bg-white p-5 transition ${
                      checked
                        ? 'border-red-400 shadow-sm ring-2 ring-red-100'
                        : 'border-stone-200/90 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleQuestion(question.id)}
                        className="mt-1 h-4 w-4 rounded accent-red-800"
                      />
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-stone-300 bg-stone-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                            {code}
                          </span>
                          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-900">
                            {t(TOPIC_LABELS[question.topic])}
                          </span>
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                            {question.source === 'enade' ? t('Simulado estilo ENADE') : t('Questionário por assunto')}
                          </span>
                        </div>
                        <span className="text-sm font-semibold leading-6 text-stone-900">{t(question.prompt)}</span>
                        <ul className="mt-2.5 space-y-1 text-xs leading-5 text-stone-600">
                          {question.alternatives.map((alternative, index) => {
                            const isCorrect = index === question.answer;
                            return (
                              <li key={alternative} className={isCorrect ? 'font-semibold text-emerald-800' : ''}>
                                {String.fromCharCode(65 + index)}) {t(alternative)}
                                {isCorrect && (
                                  <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                    ✓
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>
        </section>

        {/* Right Column: Sticky Exam Builder & Mini-Concurso Configurator */}
        <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-800">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-stone-900">{t('Montar Prova')}</h2>
                <p className="text-xs text-stone-500">
                  {selectedIds.length === 0
                    ? t('Selecione questões ao lado')
                    : t('{count} questão(ões) selecionada(s)', { count: selectedIds.length })}
                </p>
              </div>
            </div>
            {selectedIds.length > 0 && (
              <span className="rounded-full bg-red-800 px-2.5 py-1 font-mono text-xs font-bold text-white">
                {selectedIds.length}
              </span>
            )}
          </div>

          {/* Versions & Shuffling */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="total-copies" className="block text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {t('Qtd. total de provas')}
                </label>
                <input
                  id="total-copies"
                  type="number"
                  min={1}
                  max={100}
                  value={config.totalCopies}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    updateConfig('totalCopies', Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(100, parsed)));
                  }}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-mono text-xs font-bold text-stone-800 outline-none focus:border-red-400 focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="version-count" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  <Shuffle className="h-3 w-3 text-red-800" />
                  {t('Tipos (Cadernos)')}
                </label>
                <select
                  id="version-count"
                  value={config.versionCount}
                  onChange={(e) => updateConfig('versionCount', Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none focus:border-red-400 focus:bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t('tipo (A)') : t(`tipos (A–${String.fromCharCode(64 + n)})`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-orange-200/70 bg-orange-50/70 px-3 py-2 text-[11px] text-stone-700">
              <span className="font-bold text-red-900">{t('PDF único')}: </span>
              <span className="font-mono font-semibold">
                {Array.from({ length: Math.min(config.totalCopies, 8) }, (_, i) =>
                  String.fromCharCode(65 + (i % config.versionCount)),
                ).join(' · ')}
                {config.totalCopies > 8 ? ` · ... (${config.totalCopies}x)` : ''}
              </span>
              {config.includeAnswerKey && <span className="font-semibold text-stone-600"> + {t('Gabarito')}</span>}
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2 text-xs font-semibold text-stone-700">
              <span>{t('Embaralhar ordem das questões')}</span>
              <input
                type="checkbox"
                checked={config.shuffleQuestions}
                onChange={(e) => updateConfig('shuffleQuestions', e.target.checked)}
                className="h-4 w-4 accent-red-800"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2 text-xs font-semibold text-stone-700">
              <span>{t('Embaralhar alternativas (A–E)')}</span>
              <input
                type="checkbox"
                checked={config.shuffleAlternatives}
                onChange={(e) => updateConfig('shuffleAlternatives', e.target.checked)}
                className="h-4 w-4 accent-red-800"
              />
            </label>

            {/* Seed Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {t('Código / Semente do Lote')}
                </label>
                <input
                  type="text"
                  value={config.seed}
                  onChange={(e) => updateConfig('seed', e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-2.5 py-1.5 font-mono text-xs font-bold text-stone-800 outline-none focus:border-red-400"
                />
              </div>
              <button
                type="button"
                onClick={() => updateConfig('seed', createRandomSeed())}
                title={t('Gerar nova semente aleatória')}
                className="mt-4 inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                <Dices className="h-3.5 w-3.5" />
                {t('Sortear')}
              </button>
            </div>
          </div>

          {/* Print Layout & Answer Key Options */}
          <div className="space-y-2 border-t border-stone-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
                <Columns2 className="h-3.5 w-3.5 text-red-800" />
                {t('Layout A4')}
              </span>
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => updateConfig('columns', 1)}
                  className={`rounded-md px-2.5 py-1 transition ${
                    config.columns === 1 ? 'bg-white text-red-800 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  1 col
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig('columns', 2)}
                  className={`rounded-md px-2.5 py-1 transition ${
                    config.columns === 2 ? 'bg-white text-red-800 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  2 col
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={config.includeBubbleSheet}
                onChange={(e) => updateConfig('includeBubbleSheet', e.target.checked)}
                className="h-4 w-4 accent-red-800"
              />
              {t('Incluir folha de respostas (bolinhas)')}
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={config.includeAnswerKey}
                onChange={(e) => updateConfig('includeAnswerKey', e.target.checked)}
                className="h-4 w-4 accent-red-800"
              />
              {t('Incluir gabarito oficial consolidado')}
            </label>

            {config.includeAnswerKey && (
              <label className="flex cursor-pointer items-center gap-2.5 pl-6 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={config.includeExplanations}
                  onChange={(e) => updateConfig('includeExplanations', e.target.checked)}
                  className="h-3.5 w-3.5 accent-red-800"
                />
                {t('Anexar comentários das questões')}
              </label>
            )}
          </div>

          {/* Collapsible Exam Header Metadata */}
          <div className="border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => setShowMetadataFields((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-bold text-stone-700 hover:text-red-800"
            >
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('Cabeçalho da prova (Instituição, Turma...)')}
              </span>
              <Settings2 className="h-3.5 w-3.5 text-stone-400" />
            </button>

            {showMetadataFields && (
              <div className="mt-3 space-y-2.5 text-xs">
                <input
                  type="text"
                  value={config.examTitle}
                  onChange={(e) => updateConfig('examTitle', e.target.value)}
                  placeholder={t('Título da prova')}
                  className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.institution}
                    onChange={(e) => updateConfig('institution', e.target.value)}
                    placeholder={t('Instituição')}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                  />
                  <input
                    type="text"
                    value={config.discipline}
                    onChange={(e) => updateConfig('discipline', e.target.value)}
                    placeholder={t('Disciplina')}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.professor}
                    onChange={(e) => updateConfig('professor', e.target.value)}
                    placeholder={t('Professor(a)')}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                  />
                  <input
                    type="text"
                    value={config.term}
                    onChange={(e) => updateConfig('term', e.target.value)}
                    placeholder={t('Turma / Semestre')}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                  />
                </div>
                <input
                  type="text"
                  value={config.duration}
                  onChange={(e) => updateConfig('duration', e.target.value)}
                  placeholder={t('Duração (ex: 90 min)')}
                  className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                />
                <textarea
                  rows={2}
                  value={config.instructions}
                  onChange={(e) => updateConfig('instructions', e.target.value)}
                  placeholder={t('Instruções ao aluno')}
                  className="w-full resize-y rounded-lg border border-stone-200 px-2.5 py-1.5 outline-none focus:border-red-400"
                />
              </div>
            )}
          </div>

          {/* Primary Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleGenerateExam}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <FileCheck2 className="h-4 w-4" />
              {isExamReady ? t('Atualizar visualização A4') : t('Gerar provas e gabarito')}
            </button>

            {isExamReady && selectedQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-stone-950 shadow-sm transition hover:brightness-105"
              >
                <Printer className="h-4 w-4" />
                {t('Imprimir / Salvar PDF')}
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-stone-500 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('Limpar seleção')}
            </button>
          </div>
        </aside>
      </div>

      {/* A4 Exam & Answer Key Print/Preview Area */}
      <div ref={previewRef}>
        {isExamReady && (
          <ExamPrintSheet
            versions={examVersions}
            selectedQuestions={selectedQuestions}
            config={config}
          />
        )}
      </div>
    </PageIntro>
  );
}
