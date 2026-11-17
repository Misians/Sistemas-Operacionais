import { useState } from 'react';
import { Award, CheckCircle2, FileText, Layers, Printer } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { BankQuestionItem, ExamConfig, ExamVersion } from '../utils/examGenerator';
import { getQuestionCode } from '../utils/examGenerator';

interface ExamPrintSheetProps {
  versions: ExamVersion[];
  selectedQuestions: BankQuestionItem[];
  config: ExamConfig;
}

export function ExamPrintSheet({ versions, selectedQuestions, config }: ExamPrintSheetProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'key' | number>(0);

  if (versions.length === 0 || selectedQuestions.length === 0) return null;

  const isVisibleOnScreen = (target: 'key' | number) => activeTab === 'all' || activeTab === target;

  return (
    <section className="print-exam-container mt-10">
      {/* Screen-only Preview Toolbar */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            <Layers className="h-3.5 w-3.5 text-red-800" />
            {t('Pré-visualização A4')}:
          </span>
          {versions.map((version) => (
            <button
              key={version.label}
              type="button"
              onClick={() => setActiveTab(version.index)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === version.index
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {t('Caderno')} {version.label}
            </button>
          ))}
          {config.includeAnswerKey && (
            <button
              type="button"
              onClick={() => setActiveTab('key')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'key'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('Gabarito Oficial')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-stone-800 text-white'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
            }`}
          >
            {t('Ver tudo')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        >
          <Printer className="h-4 w-4" />
          {t('Imprimir / Salvar PDF')}
        </button>
      </div>

      {/* Exam Booklets (Caderno A, B, C...) */}
      {versions.map((version, vIdx) => {
        const hasNextSheet = vIdx < versions.length - 1 || config.includeAnswerKey;
        return (
          <article
            key={version.examCode}
            className={`print-sheet mx-auto mb-8 max-w-[210mm] rounded-2xl border border-stone-200 bg-white p-6 text-stone-950 shadow-sm sm:p-10 ${
              hasNextSheet ? 'print-page-break-after' : ''
            } ${isVisibleOnScreen(version.index) ? 'block' : 'hidden print:block'}`}
          >
            {/* Official Concurso-style Header */}
            <header className="border-2 border-stone-900">
              <div className="flex flex-wrap items-stretch justify-between border-b-2 border-stone-900">
                <div className="flex-1 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">
                    {config.institution || t('Instituição de Ensino')} · {config.discipline || t('Sistemas Operacionais')}
                  </p>
                  <h2 className="mt-0.5 text-lg font-extrabold uppercase tracking-tight text-stone-950 sm:text-xl">
                    {config.examTitle || t('Avaliação de Sistemas Operacionais')}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-stone-700">
                    {config.professor && (
                      <span>
                        <strong>{t('Docente')}:</strong> {config.professor}
                      </span>
                    )}
                    {config.term && (
                      <span>
                        <strong>{t('Período/Turma')}:</strong> {config.term}
                      </span>
                    )}
                    {config.duration && (
                      <span>
                        <strong>{t('Duração')}:</strong> {config.duration}
                      </span>
                    )}
                    <span>
                      <strong>{t('Questões')}:</strong> {version.questions.length}
                    </span>
                  </div>
                </div>

                {/* High-contrast Caderno Badge */}
                <div className="flex min-w-[130px] flex-col items-center justify-center border-l-2 border-stone-900 bg-stone-900 px-4 py-2 text-center text-white">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">
                    {t('Tipo de Prova')}
                  </span>
                  <span className="mt-0.5 text-xl font-black tracking-tight">
                    {t('CADERNO')} {version.label}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] text-stone-300">
                    {version.examCode}
                  </span>
                </div>
              </div>

              {/* Student Identification Grid */}
              <div className="grid grid-cols-12 divide-y divide-stone-300 text-xs sm:divide-x sm:divide-y-0">
                <div className="col-span-12 px-3 py-2 sm:col-span-6">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {t('Nome completo do(a) aluno(a)')}
                  </span>
                  <div className="mt-2 h-4 border-b border-dotted border-stone-400" />
                </div>
                <div className="col-span-6 px-3 py-2 sm:col-span-3">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {t('Matrícula / RA')}
                  </span>
                  <div className="mt-2 h-4 border-b border-dotted border-stone-400" />
                </div>
                <div className="col-span-6 px-3 py-2 sm:col-span-3">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {t('Data / Nota')}
                  </span>
                  <div className="mt-2 h-4 border-b border-dotted border-stone-400" />
                </div>
              </div>
            </header>

            {/* Instructions Box */}
            {config.instructions.trim() && (
              <div className="mt-3 rounded border border-stone-300 bg-stone-50 px-3.5 py-2 text-[11px] leading-relaxed text-stone-700">
                <strong className="mr-1.5 uppercase tracking-wider text-stone-900">
                  {t('Instruções')}:
                </strong>
                {config.instructions}
              </div>
            )}

            {/* Optional Bubble Sheet (Cartão-Resposta) */}
            {config.includeBubbleSheet && (
              <div className="mt-4 rounded border border-stone-800 p-3">
                <div className="mb-2 flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-900">
                    {t('Folha de Respostas — Preencha completamente o círculo correspondente')}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-stone-700">
                    {t('CADERNO')} {version.label} · {version.examCode}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
                  {version.questions.map((q) => (
                    <div key={q.number} className="flex items-center justify-between border-b border-stone-100 py-0.5 text-[11px]">
                      <span className="font-mono font-bold text-stone-800">
                        {String(q.number).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {q.alternatives.map((_, altIdx) => (
                          <span
                            key={altIdx}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-700 text-[9px] font-bold text-stone-800"
                          >
                            {String.fromCharCode(65 + altIdx)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions Body */}
            <div className={`mt-5 ${config.columns === 2 ? 'md:columns-2 md:gap-7 print-columns-2' : 'space-y-5'}`}>
              {version.questions.map((question) => (
                <div
                  key={`${version.examCode}-${question.originalId}`}
                  className={`print-question ${config.columns === 2 ? 'mb-5' : 'border-b border-stone-100 pb-4 last:border-b-0'}`}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-stone-900">
                      {t('Questão')} {String(question.number).padStart(2, '0')}
                    </span>
                    <span className="rounded border border-stone-300 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-700">
                      {question.code}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium leading-[1.45] text-stone-950">
                    {t(question.prompt)}
                  </p>
                  <ol className="mt-2 space-y-1 pl-1 text-[12.5px] leading-[1.4] text-stone-800">
                    {question.alternatives.map((alternative, altIdx) => (
                      <li key={`${question.originalId}-${altIdx}`} className="flex items-start gap-2">
                        <span className="shrink-0 font-bold text-stone-900">
                          ({String.fromCharCode(65 + altIdx)})
                        </span>
                        <span>{t(alternative)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-6 flex items-center justify-between border-t border-stone-300 pt-2 text-[10px] text-stone-500">
              <span>SO Docente Hub · {config.discipline || t('Sistemas Operacionais')}</span>
              <span className="font-mono">{version.examCode}</span>
            </footer>
          </article>
        );
      })}

      {/* Master Answer Key (Gabarito Oficial do Professor) */}
      {config.includeAnswerKey && (
        <article
          className={`print-sheet mx-auto mb-8 max-w-[210mm] rounded-2xl border border-stone-200 bg-white p-6 text-stone-950 shadow-sm sm:p-10 ${
            isVisibleOnScreen('key') ? 'block' : 'hidden print:block'
          }`}
        >
          <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-stone-900 pb-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-800">
                <Award className="h-3.5 w-3.5" />
                {t('Documento Exclusivo do Docente')}
              </p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-stone-950">
                {t('Gabarito Oficial Consolidado')}
              </h2>
              <p className="mt-1 text-xs text-stone-600">
                {config.examTitle || t('Avaliação de Sistemas Operacionais')} · {config.discipline}
                {config.term ? ` · ${config.term}` : ''}
              </p>
            </div>
            <div className="rounded-lg border border-stone-900 bg-stone-900 px-3.5 py-2 text-right text-white">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-300">{t('Semente / Lote')}</p>
              <p className="font-mono text-sm font-bold">{config.seed || 'SO-2026'}</p>
            </div>
          </header>

          {/* Matrix Table: Question Number x Caderno A, B, C... */}
          <div className="mt-5">
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-800">
              <FileText className="h-3.5 w-3.5 text-red-800" />
              {t('Matriz de Correção por Caderno (Letra + Código da Questão)')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-stone-800 text-xs">
                <thead>
                  <tr className="bg-stone-900 text-white">
                    <th className="w-14 border border-stone-700 px-2.5 py-2 text-center font-bold">
                      {t('Questão')}
                    </th>
                    {versions.map((version) => (
                      <th key={version.label} className="border border-stone-700 px-3 py-2 text-center font-bold">
                        {t('Caderno')} {version.label}
                        <span className="ml-1.5 font-mono text-[10px] font-normal text-stone-300">
                          ({version.examCode})
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedQuestions.map((_, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                      <td className="border border-stone-300 px-2.5 py-2 text-center font-mono font-bold text-stone-900">
                        {String(rowIdx + 1).padStart(2, '0')}
                      </td>
                      {versions.map((version) => {
                        const item = version.questions[rowIdx];
                        if (!item) return <td key={version.label} className="border border-stone-300 px-3 py-2" />;
                        return (
                          <td key={version.label} className="border border-stone-300 px-3 py-2 text-center">
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-stone-900 font-bold text-white">
                                {item.correctLetter}
                              </span>
                              <span className="font-mono text-[11px] font-semibold text-stone-600">
                                {item.code}
                              </span>
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional Commented Key by Question Code */}
          {config.includeExplanations && (
            <div className="mt-7 border-t border-stone-300 pt-5">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-stone-800">
                {t('Referência Comentada por Código de Questão')}
              </h3>
              <div className="space-y-3">
                {selectedQuestions.map((question) => {
                  const code = getQuestionCode(question);
                  const originalCorrectText = question.alternatives[question.answer] ?? '';
                  return (
                    <div key={question.id} className="print-question rounded border border-stone-200 bg-stone-50/70 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-red-900">{code}</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                          {t('Resposta')}: {t(originalCorrectText)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-medium text-stone-800">{t(question.prompt)}</p>
                      {question.explanation && (
                        <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                          <strong>{t('Comentário')}:</strong> {t(question.explanation)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
