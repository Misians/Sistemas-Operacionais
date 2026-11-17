import { useMemo, useState } from 'react';
import { BookOpen, Cpu, ExternalLink, Gamepad2, Printer, Search, Terminal, X } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { useFilterStore } from '../store/useFilterStore';
import type { OSModule, OSResource, ResourceCategory } from '../types/repository';
import { PageIntro } from './SitePages';
import { useLanguage } from '../i18n/LanguageContext';

const MODULE_LABELS: Record<OSModule | 'todos', string> = {
  todos: 'Todos os módulos',
  arquitetura_so: 'Introdução e Arquitetura',
  processos_threads: 'Processos e Escalonamento',
  sincronizacao: 'Sincronização e Deadlocks',
  gerencia_memoria: 'Gerenciamento de Memória',
  sistemas_arquivos: 'Sistemas de Arquivos e E/S',
};

const CATEGORY_BADGES: Record<ResourceCategory, { label: string; color: string }> = {
  gincana: { label: 'Gincana / Dinâmica', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  tarefa: { label: 'Tarefa / Laboratório', color: 'bg-red-100 text-red-800 border-red-200' },
  plataforma: { label: 'Simulador / Apoio', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  conteudo: { label: 'Conteúdo Teórico', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export function MaterialsPage() {
  const { t } = useLanguage();
  const { data: resources = [], isLoading, error } = useResources();
  const { selectedModule, selectedCategory, searchQuery, setModule, setCategory, setSearchQuery } = useFilterStore();
  const [activeResource, setActiveResource] = useState<OSResource | null>(null);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();
    return resources.filter((resource) =>
      (selectedModule === 'todos' || resource.module === selectedModule) &&
      (selectedCategory === 'todas' || resource.category === selectedCategory) &&
      (resource.title.toLowerCase().includes(normalizedSearch) ||
        resource.description.toLowerCase().includes(normalizedSearch) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))),
    );
  }, [resources, selectedModule, selectedCategory, searchQuery]);

  return (
    <PageIntro eyebrow="Acervo docente" title="Materiais para suas aulas" description="Encontre e compartilhe dinâmicas, laboratórios, simuladores e conteúdos organizados por unidade da ementa.">
      <div className="grid gap-7 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">{t('Unidades da ementa')}</h2>
          <nav className="space-y-1" aria-label={t('Filtrar materiais por unidade')}>
            {(Object.keys(MODULE_LABELS) as Array<OSModule | 'todos'>).map((module) => (
              <button key={module} onClick={() => setModule(module)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                selectedModule === module ? 'bg-red-100 font-semibold text-red-800' : 'text-stone-600 hover:bg-orange-50'
              }`}>
                <span className="truncate">{t(MODULE_LABELS[module])}</span>
                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-stone-500">
                  {module === 'todos' ? resources.length : resources.filter((resource) => resource.module === module).length}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl border border-orange-100 bg-white p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-stone-400" />
              <input type="search" placeholder={t('Buscar por tema (ex.: paginação, fork, deadlock, inode)...')} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full rounded-xl border border-orange-100 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'todas', label: t('Todos'), icon: BookOpen },
                { id: 'gincana', label: t('Gincanas'), icon: Gamepad2 },
                { id: 'tarefa', label: t('Laboratórios'), icon: Terminal },
                { id: 'plataforma', label: t('Simuladores'), icon: Cpu },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setCategory(tab.id as ResourceCategory | 'todas')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  selectedCategory === tab.id ? 'bg-red-800 text-white' : 'bg-orange-50 text-stone-600 hover:bg-orange-100'
                }`}>
                  <tab.icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              {t('Não foi possível carregar os materiais.')} {error.message}
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl border border-orange-100 bg-white py-12 text-center text-stone-500">{t('Carregando materiais...')}</div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-white p-12 text-center">
              <p className="text-sm text-stone-600">{t('Nenhum recurso encontrado para este filtro.')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredResources.map((item, index) => (
                <article key={item.id || index} className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_BADGES[item.category].color}`}>{t(CATEGORY_BADGES[item.category].label)}</span>
                      <span className="text-xs text-stone-400">{t(item.difficulty)}</span>
                    </div>
                    <h2 className="text-base font-bold text-stone-900">{t(item.title)}</h2>
                    <p className="mb-4 mt-2 text-sm leading-6 text-stone-600">{t(item.description)}</p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => <span key={tag} className="rounded bg-orange-50 px-2 py-1 text-xs text-stone-600">#{t(tag)}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-orange-100 pt-3">
                    <span className="text-xs text-stone-400">{t(MODULE_LABELS[item.module])} · {item.authorName}</span>
                    <button onClick={() => setActiveResource(item)} className="shrink-0 text-xs font-bold text-red-700 hover:text-orange-700">{t('Abrir guia →')}</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeResource && <ResourceDialog resource={activeResource} onClose={() => setActiveResource(null)} />}
    </PageIntro>
  );
}

function ResourceDialog({ resource, onClose }: { resource: OSResource; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 print:max-h-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between print:hidden">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${CATEGORY_BADGES[resource.category].color}`}>{t(CATEGORY_BADGES[resource.category].label)}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-orange-100"><Printer className="h-4 w-4" /> {t('Imprimir ficha')}</button>
            <button onClick={onClose} aria-label={t('Fechar')} className="p-1 text-stone-400 hover:text-stone-700"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-red-700">{t(MODULE_LABELS[resource.module])}</p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">{t(resource.title)}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{t(resource.description)}</p>
        </div>
        {resource.gameDetails && (
          <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-semibold text-orange-950">{t('Tempo estimado:')} {resource.gameDetails.executionTimeMinutes} {t('minutos')}</p>
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase text-orange-950">{t('Materiais necessários')}</h3>
              <ul className="list-inside list-disc space-y-1 text-xs text-orange-950">{resource.gameDetails.materialsNeeded.map((material, index) => <li key={index}>{t(material)}</li>)}</ul>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase text-orange-950">{t('Passo a passo')}</h3>
              <ol className="list-inside list-decimal space-y-2 text-xs text-stone-800">{resource.gameDetails.stepByStepRules.map((step, index) => <li key={index} className="leading-relaxed">{t(step)}</li>)}</ol>
            </div>
          </div>
        )}
        {resource.externalUrl && (
          <a href={resource.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-800 print:hidden">
            {t('Acessar recurso externo')} <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
