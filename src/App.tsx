import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, Cpu } from 'lucide-react';
import { QuizSection } from './components/QuizSection';
import { QuestionBank } from './components/QuestionBank';
import { MaterialsPage } from './components/MaterialsPage';
import { LANGUAGE_NAMES, useLanguage, type Language } from './i18n/LanguageContext';
import {
  ContactPage,
  ExternalToolsPage,
  HomePage,
  PageIntro,
  PedagogyPage,
} from './components/SitePages';

const AdminPage = lazy(() => import('./components/AdminPage').then(({ AdminPage: component }) => ({ default: component })));

const PAGES = [
  { id: 'inicio', label: 'Início' },
  { id: 'simulados', label: 'Simulados' },
  { id: 'banco-questoes', label: 'Banco de questões' },
  { id: 'contato', label: 'Contato' },
  { id: 'parte-pedagogica', label: 'Parte pedagógica' },
] as const;

type PageId = (typeof PAGES)[number]['id'] | 'materiais' | 'ferramentas' | 'admin';

function getPageFromHash(): PageId {
  const page = window.location.hash.slice(1);
  return [...PAGES.map(({ id }) => id), 'materiais', 'ferramentas', 'admin'].includes(page as PageId)
    ? (page as PageId)
    : 'inicio';
}

export default function App() {
  const [page, setPage] = useState<PageId>(getPageFromHash);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleNavigation = () => {
      setPage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleNavigation);
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f6] text-stone-900 print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 shadow-sm shadow-stone-900/[0.03] backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <a href="#inicio" className="flex w-fit shrink-0 items-center gap-3" aria-label={`SO Docente Hub — ${t('Início')}`}>
            <span className="rounded-xl bg-gradient-to-br from-red-900 via-red-800 to-orange-600 p-2.5 text-white shadow-sm shadow-red-900/20">
              <Cpu className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-stone-900">SO Docente Hub</span>
              <span className="block text-[11px] font-medium text-stone-500">{t('Sistemas Operacionais em prática')}</span>
            </span>
          </a>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0" aria-label={t('Navegação principal')}>
            {PAGES.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={page === id ? 'page' : undefined}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  page === id
                    ? 'bg-red-800 text-white shadow-sm shadow-red-900/15'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {t(label)}
              </a>
            ))}
          </nav>
          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-stone-600">
            <span className="sr-only">Language / Idioma / 语言</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              aria-label="Language / Idioma / 语言"
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-semibold text-stone-700 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            >
              {(['pt', 'en', 'es', 'zh'] as const).map((code) => (
                <option key={code} value={code}>{LANGUAGE_NAMES[code]}</option>
              ))}
            </select>
          </label>
          </div>
        </div>
      </header>

      <main>
        {page === 'inicio' && <HomePage />}
        {page === 'simulados' && (
          <PageIntro eyebrow={t('Pratique e avalie')} title={t('Simulados')} description={t('Monte questionários por assunto ou pratique com questões autorais em formato inspirado no ENADE.')}>
            <QuizSection />
          </PageIntro>
        )}
        {page === 'banco-questoes' && <QuestionBank />}
        {page === 'contato' && <ContactPage />}
        {page === 'parte-pedagogica' && <PedagogyPage />}
        {page === 'ferramentas' && <ExternalToolsPage />}
        {page === 'materiais' && <MaterialsPage />}
        {page === 'admin' && <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-12 text-sm text-stone-500">{t('Carregando painel...')}</div>}><AdminPage /></Suspense>}
      </main>

      <footer className="border-t border-orange-100 bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-stone-500">{t('SO Docente Hub · apoio ao ensino de Sistemas Operacionais')}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#materiais" className="font-semibold text-red-800 hover:text-orange-700">{t('Banco de materiais')}</a>
            <a href="#admin" className="font-semibold text-red-800 hover:text-orange-700">{t('Painel administrativo')}</a>
            <a href="#ferramentas" className="inline-flex items-center gap-1 font-semibold text-red-800 hover:text-orange-700">
              {t('Ferramentas externas')} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
