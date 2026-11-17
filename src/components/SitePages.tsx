import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Mail,
  Monitor,
  Users,
} from 'lucide-react';
import cpulatorImage from '../assets/cpulator.svg';
import banditImage from '../assets/bandit.svg';
import jslinuxImage from '../assets/jslinux.svg';
import { useLanguage } from '../i18n/LanguageContext';

const tools = [
  {
    title: 'CPUlator',
    image: cpulatorImage,
    purpose: 'Simulador de arquitetura e entrada/saída',
    description: 'Experimente código ARM, Nios II e MIPS em um ambiente interativo com dispositivos e depuração passo a passo.',
    url: 'https://cpulator.01xz.net/',
    alt: 'Ilustração de um processador e circuitos para representar o simulador CPUlator',
  },
  {
    title: 'OverTheWire: Bandit',
    image: banditImage,
    purpose: 'Desafios práticos de terminal Linux',
    description: 'Uma sequência de desafios progressivos para praticar comandos, arquivos, permissões e conceitos de segurança.',
    url: 'https://overthewire.org/wargames/bandit/',
    alt: 'Ilustração de uma janela de terminal com comandos Linux',
  },
  {
    title: 'JSLinux',
    image: jslinuxImage,
    purpose: 'Ambiente Linux executado no navegador',
    description: 'Explore um ambiente Linux virtualizado direto no navegador para demonstrações e primeiros experimentos.',
    url: 'https://bellard.org/jslinux/',
    alt: 'Ilustração de uma janela Linux em um navegador',
  },
];

export function HomePage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid gap-10 rounded-[2rem] bg-gradient-to-br from-red-950 via-red-900 to-orange-700 px-6 py-10 text-white shadow-xl shadow-red-950/10 sm:px-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full border border-orange-200/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100">
            {t('Projeto de apoio ao ensino')}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {t('Sistemas Operacionais ensinados com participação e propósito.')}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-orange-50/90">
            {t('O SO Docente Hub é uma base para ajudar professores a planejar aulas de Sistemas Operacionais usando estratégias gamificadas, atividades práticas e recursos de apoio.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#parte-pedagogica" className="inline-flex items-center gap-2 rounded-xl bg-orange-300 px-5 py-3 text-sm font-bold text-red-950 transition hover:bg-orange-200">
              {t('Conheça a proposta')} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#simulados" className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              {t('Experimentar simulados')}
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-300/20 p-3 text-orange-200"><Lightbulb className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-bold">{t('Da teoria à experiência')}</p>
              <p className="mt-1 text-xs text-orange-100/80">{t('Uma proposta centrada em aprender fazendo.')}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              ['Planejar', 'Escolha conceitos e resultados de aprendizagem.'],
              ['Gamificar', 'Transforme conceitos em desafios significativos.'],
              ['Refletir', 'Conecte a atividade à teoria e avalie o aprendizado.'],
            ].map(([title, description], index) => (
              <div key={title} className="flex gap-3 rounded-xl bg-white/10 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-300/20 text-xs font-black text-orange-200">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold">{t(title)}</p>
                  <p className="mt-0.5 text-xs leading-5 text-orange-50/75">{t(description)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 py-14 sm:grid-cols-2">
        <article className="rounded-2xl border border-orange-100 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 text-red-700"><Users className="h-5 w-5" /></div>
          <h2 className="text-xl font-black text-stone-900">{t('Idealizadores')}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {t('O projeto foi idealizado para apoiar a comunidade docente no planejamento de aulas mais envolventes de Sistemas Operacionais. A proposta valoriza a colaboração entre professores e estudantes na criação, adaptação e troca de atividades.')}
          </p>
        </article>
        <article className="rounded-2xl border border-orange-100 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-orange-50 p-3 text-orange-700"><GraduationCap className="h-5 w-5" /></div>
          <h2 className="text-xl font-black text-stone-900">{t('Como levar para a sala')}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {t('Defina primeiro o objetivo da aula, selecione uma dinâmica alinhada ao conteúdo, organize equipes e materiais, e finalize com uma conversa que relacione a experiência aos conceitos estudados. Adapte tempo e complexidade à turma.')}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-orange-200 bg-orange-50/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="h-fit rounded-2xl bg-white p-3 text-red-800 shadow-sm"><BookOpen className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{t('Referência principal')}</p>
              <h2 className="mt-1 text-xl font-black text-stone-900">{t('Bibliografia de Carlos A. Maziero')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                {t('O projeto acompanha a literatura de Maziero, especialmente')}{' '}
                <em>{t('Sistemas Operacionais: Conceitos e Mecanismos')}</em>
                {t(', como base conceitual para organizar os temas e apoiar a construção das atividades.')}
              </p>
            </div>
          </div>
          <a href="#parte-pedagogica" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900">
            {t('Ver parte pedagógica')} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <QuickLink href="#simulados" icon={<GraduationCap className="h-5 w-5" />} title={t('Simulados')} description={t('Pratique por assunto ou em formato inspirado no ENADE.')} />
        <QuickLink href="#ferramentas" icon={<Monitor className="h-5 w-5" />} title={t('Ferramentas externas')} description={t('Conheça plataformas para complementar as aulas.')} />
      </section>
    </div>
  );
}

function QuickLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <a href={href} className="group rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-xl bg-red-50 p-2.5 text-red-800 transition group-hover:bg-red-800 group-hover:text-white">{icon}</div>
      <h3 className="font-bold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-stone-600">{description}</p>
    </a>
  );
}

export function PedagogyPage() {
  const { t } = useLanguage();
  return (
    <PageIntro eyebrow="Planejamento docente" title="Parte pedagógica" description="Estratégias simples para transformar os conceitos de Sistemas Operacionais em experiências de aprendizagem ativa." >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { title: 'Antes da aula', text: 'Defina o conceito central, os conhecimentos prévios necessários, os objetivos de aprendizagem e como observar se foram alcançados.' },
          { title: 'Durante a atividade', text: 'Apresente regras e tempo, forme equipes com papéis claros e incentive os estudantes a testar hipóteses e explicar suas decisões.' },
          { title: 'Depois do desafio', text: 'Conduza uma discussão de fechamento: relacione as ações do jogo aos mecanismos do sistema e proponha uma questão de transferência.' },
        ].map(({ title, text }) => (
          <article key={title} className="rounded-2xl border border-orange-100 bg-white p-6">
            <div className="mb-4 rounded-xl bg-orange-50 p-3 text-orange-800 w-fit"><Lightbulb className="h-5 w-5" /></div>
            <h2 className="text-lg font-bold text-stone-900">{t(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{t(text)}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-3xl bg-gradient-to-br from-red-950 to-red-800 p-6 text-white sm:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="rounded-2xl bg-white/10 p-3 text-orange-200"><BookOpen className="h-7 w-7" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">{t('Referencial teórico')}</p>
            <h2 className="mt-2 text-2xl font-black">{t('A literatura de Maziero como fio condutor')}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-red-50/85">
              {t('A proposta segue a bibliografia de Carlos A. Maziero, com destaque para')}{' '}
              <em>{t('Sistemas Operacionais: Conceitos e Mecanismos')}</em>
              {t('. Os recursos didáticos devem complementar o estudo dos fundamentos — processos, memória, concorrência, arquivos e entrada/saída — e não substituir a compreensão conceitual.')}
            </p>
            <div className="mt-5 rounded-xl border border-white/15 bg-white/10 p-4">
              <p className="text-sm font-bold">{t('Como aplicar a referência')}</p>
              <p className="mt-1 text-sm leading-6 text-red-50/80">
                {t('Apresente o conceito com apoio da bibliografia, use a dinâmica para explorá-lo em contexto e retome os termos técnicos na discussão e na avaliação.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#materiais" className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-3 text-sm font-bold text-white hover:bg-red-900">{t('Explorar materiais')} <ArrowRight className="h-4 w-4" /></a>
        <a href="#ferramentas" className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-red-800 hover:bg-orange-50">{t('Ferramentas externas')} <Monitor className="h-4 w-4" /></a>
      </div>
    </PageIntro>
  );
}

export function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const copyMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = `${t('Contato para o SO Docente Hub')}\n\n${t('Nome:')} ${name}\n${t('E-mail:')} ${email}\n\n${t('Mensagem:')}\n${message}`;
    try {
      await navigator.clipboard.writeText(content);
      setStatus(t('Mensagem copiada. Cole-a no canal de contato do projeto.'));
    } catch (error) {
      console.error(t('Não foi possível copiar a mensagem para a área de transferência.'), error);
      setStatus(t('Não foi possível copiar automaticamente. Selecione e copie os dados preenchidos.'));
    }
  };

  return (
    <PageIntro eyebrow="Fale com o projeto" title="Contato" description="Envie sugestões de atividades, compartilhe experiências de sala de aula ou ajude a aprimorar o acervo.">
      <form onSubmit={copyMessage} className="max-w-2xl rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-3 text-red-700"><Mail className="h-5 w-5" /></div>
          <p className="text-sm leading-6 text-stone-600">{t('Preencha a mensagem e copie o conteúdo para enviar pelo canal de contato da equipe.')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-stone-700">{t('Nome')}
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-orange-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </label>
          <label className="text-sm font-semibold text-stone-700">{t('E-mail para retorno')}
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-orange-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </label>
        </div>
        <label className="mt-4 block text-sm font-semibold text-stone-700">{t('Mensagem')}
          <textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-orange-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-3 text-sm font-bold text-white hover:bg-red-900">
            <Mail className="h-4 w-4" /> {t('Copiar mensagem')}
          </button>
          {status && <p role="status" className="text-sm text-stone-600">{status}</p>}
        </div>
      </form>
    </PageIntro>
  );
}

export function ExternalToolsPage() {
  const { t } = useLanguage();
  return (
    <PageIntro eyebrow="Recursos complementares" title="Ferramentas externas" description="Plataformas para explorar arquitetura, terminal e sistemas em atividades práticas. Verifique os requisitos e adapte o uso ao contexto da turma.">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article key={tool.title} className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <img src={tool.image} alt={t(tool.alt)} className="h-48 w-full object-cover" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">{t(tool.purpose)}</p>
              <h2 className="mt-2 text-xl font-black text-stone-900">{tool.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-stone-600">{t(tool.description)}</p>
              <a href={tool.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900">
                {t('Conhecer ferramenta')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </PageIntro>
  );
}

export function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 print:max-w-none print:p-0">
      <header className="mb-8 max-w-3xl print:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-800">{t(eyebrow)}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950 sm:text-4xl">{t(title)}</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">{t(description)}</p>
      </header>
      {children}
    </div>
  );
}
