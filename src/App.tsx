import { useEffect, useState } from 'react';
import { ArrowRight, Cpu } from 'lucide-react';
import { QuizSection } from './components/QuizSection';
import { QuestionBank } from './components/QuestionBank';
import { MaterialsPage } from './components/MaterialsPage';
import {
  ContactPage,
  ExternalToolsPage,
  HomePage,
  PageIntro,
  PedagogyPage,
} from './components/SitePages';

const PAGES = [
  { id: 'inicio', label: 'Início' },
  { id: 'simulados', label: 'Simulados' },
  { id: 'banco-questoes', label: 'Banco de questões' },
  { id: 'contato', label: 'Contato' },
  { id: 'parte-pedagogica', label: 'Parte pedagógica' },
] as const;

type PageId = (typeof PAGES)[number]['id'] | 'materiais' | 'ferramentas';

function getPageFromHash(): PageId {
  const page = window.location.hash.slice(1);
  return [...PAGES.map(({ id }) => id), 'materiais', 'ferramentas'].includes(page as PageId)
    ? (page as PageId)
    : 'inicio';
}

export default function App() {
  const [page, setPage] = useState<PageId>(getPageFromHash);

  useEffect(() => {
    const handleNavigation = () => {
      setPage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleNavigation);
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, []);

  return (
    <div className="min-h-screen bg-orange-50/40 text-stone-900">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 shadow-sm shadow-orange-950/5 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <a href="#inicio" className="flex w-fit shrink-0 items-center gap-3" aria-label="SO Docente Hub — Início">
            <span className="rounded-xl bg-gradient-to-br from-red-800 to-orange-600 p-2.5 text-white shadow-sm">
              <Cpu className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight text-stone-900">SO Docente Hub</span>
              <span className="block text-[11px] text-stone-500">Sistemas Operacionais em prática</span>
            </span>
          </a>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0" aria-label="Navegação principal">
            {PAGES.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={page === id ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  page === id ? 'bg-red-50 text-red-800' : 'text-stone-600 hover:bg-orange-50 hover:text-red-800'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {page === 'inicio' && <HomePage />}
        {page === 'simulados' && (
          <PageIntro eyebrow="Pratique e avalie" title="Simulados" description="Monte questionários por assunto ou pratique com questões autorais em formato inspirado no ENADE.">
            <QuizSection />
          </PageIntro>
        )}
        {page === 'banco-questoes' && <QuestionBank />}
        {page === 'contato' && <ContactPage />}
        {page === 'parte-pedagogica' && <PedagogyPage />}
        {page === 'ferramentas' && <ExternalToolsPage />}
        {page === 'materiais' && <MaterialsPage />}
      </main>

      <footer className="border-t border-orange-100 bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-stone-500">SO Docente Hub · apoio ao ensino de Sistemas Operacionais</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#materiais" className="font-semibold text-red-800 hover:text-orange-700">Banco de materiais</a>
            <a href="#ferramentas" className="inline-flex items-center gap-1 font-semibold text-red-800 hover:text-orange-700">
              Ferramentas externas <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
