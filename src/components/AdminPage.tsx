import { useEffect, useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Database, FileJson, Image as ImageIcon, ImagePlus, KeyRound, LogOut, Pencil, Plus, Search, Settings, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  activeFirebaseProjectId,
  auth,
  clearCustomFirebaseConfig,
  db,
  functions,
  googleProvider,
  isCustomFirebaseConfig,
  saveCustomFirebaseConfig,
} from '../config/firebase';
import { INITIAL_RESOURCES } from '../data/seedData';
import { TOPIC_LABELS } from '../data/questions';
import { INITIAL_QUESTION_DOCUMENTS, useQuestionBank } from '../hooks/useQuestionBank';
import { useResources } from '../hooks/useResources';
import { useLanguage } from '../i18n/LanguageContext';
import type { QuestionDocument, QuestionLanguage, QuestionTopic, QuestionTranslation, QuestionType } from '../types/question';
import type { OSModule, OSResource, ResourceCategory } from '../types/repository';
import { parseQuestionsFromJson, readImageAsDataUrl, SAMPLE_QUESTIONS_JSON } from '../utils/questionImport';
import { QuestionBank } from './QuestionBank';

type AdminSection = 'resources' | 'questions' | 'exam';
type ResourceForm = Omit<OSResource, 'id' | 'createdAt' | 'externalUrl'> & {
  externalUrl: string;
  executionTime: number;
  materials: string;
  steps: string;
};

const LANGUAGES: QuestionLanguage[] = ['pt', 'en', 'es', 'zh'];
const LANGUAGE_NAMES: Record<QuestionLanguage, string> = { pt: 'Português', en: 'English', es: 'Español', zh: '中文' };
const RESOURCE_CATEGORIES: ResourceCategory[] = ['conteudo', 'tarefa', 'gincana', 'plataforma'];
const MODULES: OSModule[] = ['arquitetura_so', 'processos_threads', 'sincronizacao', 'gerencia_memoria', 'sistemas_arquivos'];
const TOPICS: QuestionTopic[] = [
  'introducao',
  'processos',
  'memoria',
  'sincronizacao',
  'arquivos',
  'io',
  'seguranca',
  'virtualizacao',
];
const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  conteudo: 'Conteúdo Teórico',
  tarefa: 'Tarefa / Laboratório',
  gincana: 'Gincana / Dinâmica',
  plataforma: 'Simulador / Apoio',
};
const MODULE_LABELS: Record<OSModule, string> = {
  arquitetura_so: 'Introdução e Arquitetura',
  processos_threads: 'Processos e Escalonamento',
  sincronizacao: 'Sincronização e Deadlocks',
  gerencia_memoria: 'Gerenciamento de Memória',
  sistemas_arquivos: 'Sistemas de Arquivos e E/S',
};
const EMPTY_TRANSLATION: QuestionTranslation = { prompt: '', alternatives: ['', '', '', ''], explanation: '' };

const EMPTY_RESOURCE: ResourceForm = {
  title: '',
  description: '',
  category: 'conteudo',
  module: 'arquitetura_so',
  difficulty: 'Iniciante',
  tags: [],
  externalUrl: '',
  authorName: '',
  executionTime: 45,
  materials: '',
  steps: '',
};

function resourceForm(resource?: OSResource): ResourceForm {
  return resource
    ? {
        title: resource.title,
        description: resource.description,
        category: resource.category,
        module: resource.module,
        difficulty: resource.difficulty,
        tags: resource.tags,
        externalUrl: resource.externalUrl ?? '',
        authorName: resource.authorName,
        executionTime: resource.gameDetails?.executionTimeMinutes ?? 45,
        materials: resource.gameDetails?.materialsNeeded.join('\n') ?? '',
        steps: resource.gameDetails?.stepByStepRules.join('\n') ?? '',
      }
    : { ...EMPTY_RESOURCE };
}

function listFromLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        result[key] = stripUndefined(val);
      }
    }
    return result as T;
  }
  return value;
}

function withoutId<T extends { id?: string }>(value: T): Omit<T, 'id'> {
  const data = { ...value };
  delete data.id;
  return stripUndefined(data);
}

export function AdminPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { questionDocuments, isLoading: questionsLoading, error: questionsError } = useQuestionBank();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState<AdminSection>('resources');
  const [resource, setResource] = useState<ResourceForm | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionDocument | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionLanguage, setQuestionLanguage] = useState<QuestionLanguage>('pt');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionFilterTopic, setQuestionFilterTopic] = useState<'todos' | QuestionTopic>('todos');
  const [questionFilterType, setQuestionFilterType] = useState<'todos' | QuestionType>('todos');
  const [questionPage, setQuestionPage] = useState(1);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAppId, setFbAppId] = useState('');

  const checkIsAdmin = async (currentUser: User): Promise<boolean> => {
    const token = await currentUser.getIdTokenResult(true);
    if (token.claims.admin === true) return true;
    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      return adminDoc.exists();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(false);
      if (!currentUser) {
        setAuthLoading(false);
        return;
      }
      setAuthLoading(true);
      try {
        const adminStatus = await checkIsAdmin(currentUser);
        if (active) setIsAdmin(adminStatus);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : t('Falha ao verificar permissões.'));
      } finally {
        if (active) setAuthLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [t]);

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['os-resources'] }),
      queryClient.invalidateQueries({ queryKey: ['question-bank'] }),
    ]);
  };

  const ensureInitialContent = async () => {
    const marker = doc(db, '_metadata', 'adminSeed');
    if ((await getDoc(marker)).exists()) return;

    const [resourceSnapshot, questionSnapshot] = await Promise.all([
      getDocs(collection(db, 'resources')),
      getDocs(collection(db, 'questions')),
    ]);
    const existingResources = new Set(resourceSnapshot.docs.map((item) => item.id));
    const existingResourceTitles = new Set(
      resourceSnapshot.docs
        .map((item) => item.data().title)
        .filter((title): title is string => typeof title === 'string'),
    );
    const existingQuestions = new Set(questionSnapshot.docs.map((item) => item.id));
    const batch = writeBatch(db);

    INITIAL_RESOURCES.forEach((item) => {
      const id = item.id;
      if (!id || existingResources.has(id) || existingResourceTitles.has(item.title)) return;
      batch.set(doc(db, 'resources', id), withoutId(item));
    });
    INITIAL_QUESTION_DOCUMENTS.forEach((item) => {
      if (existingQuestions.has(item.id)) return;
      batch.set(doc(db, 'questions', item.id), withoutId(item));
    });
    batch.set(marker, { initializedAt: serverTimestamp() });
    await batch.commit();
  };

  const runAdminAction = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setMessage('');
    setErrorMessage('');
    try {
      await action();
      setMessage(success);
      await refreshData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('A operação não foi concluída.'));
    } finally {
      setBusy(false);
    }
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    await runAdminAction(async () => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    }, t('Sessão iniciada.'));
  };

  const loginWithGoogle = async () => {
    await runAdminAction(async () => {
      await signInWithPopup(auth, googleProvider);
    }, t('Sessão iniciada com Google.'));
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setErrorMessage(t('Digite seu e-mail acima para receber o link de redefinição de senha.'));
      return;
    }
    await runAdminAction(async () => {
      await sendPasswordResetEmail(auth, email.trim());
    }, t('E-mail de redefinição de senha enviado. Verifique sua caixa de entrada e spam.'));
  };

  const register = async () => {
    await runAdminAction(async () => {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(credential.user);
      setPassword('');
    }, t('Conta criada. Verifique o e-mail antes de ativar o acesso administrativo.'));
  };

  const activateBootstrap = async () => {
    await runAdminAction(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error(t('Sessão expirada. Entre novamente.'));

      // Try Cloud Function first (Blaze plan); if unavailable, fall back to Spark-plan Firestore bootstrap
      let claimedViaFunction = false;
      try {
        const bootstrap = httpsCallable(functions, 'bootstrapAdmin');
        await bootstrap();
        const token = await currentUser.getIdTokenResult(true);
        claimedViaFunction = token.claims.admin === true;
      } catch {
        // Cloud Function may not be deployed on Spark plan; fall back to Firestore bootstrap
      }

      if (!claimedViaFunction) {
        const bootstrapRef = doc(db, '_metadata', 'adminBootstrap');
        const marker = await getDoc(bootstrapRef);
        if (marker.exists() && marker.data().adminUid !== currentUser.uid) {
          throw new Error(t('Já existe um administrador inicial configurado neste projeto Firebase.'));
        }
        const batch = writeBatch(db);
        batch.set(doc(db, 'admins', currentUser.uid), {
          email: currentUser.email ?? '',
          createdAt: serverTimestamp(),
        });
        if (!marker.exists()) {
          batch.set(bootstrapRef, {
            adminUid: currentUser.uid,
            activatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      const adminStatus = await checkIsAdmin(currentUser);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        throw new Error(t('Não foi possível ativar o acesso. Verifique as regras do Firestore (firestore.rules).'));
      }
    }, t('Acesso administrativo ativado.'));
  };

  const resendVerification = async () => {
    await runAdminAction(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error(t('Sessão expirada. Entre novamente.'));
      await sendEmailVerification(currentUser);
    }, t('E-mail de verificação enviado novamente.'));
  };

  const logout = async () => {
    await runAdminAction(async () => {
      await signOut(auth);
      setIsAdmin(false);
    }, t('Sessão encerrada.'));
  };

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resource) return;
    const id = editingResourceId ?? doc(collection(db, 'resources')).id;
    const existing = resources.find((item) => item.id === id);
    const data = {
      title: resource.title.trim(),
      description: resource.description.trim(),
      category: resource.category,
      module: resource.module,
      difficulty: resource.difficulty,
      tags: resource.tags,
      externalUrl: resource.externalUrl.trim() || undefined,
      authorName: resource.authorName.trim(),
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(resource.category === 'gincana'
        ? {
            gameDetails: {
              executionTimeMinutes: Number(resource.executionTime),
              materialsNeeded: listFromLines(resource.materials),
              stepByStepRules: listFromLines(resource.steps),
            },
          }
        : {}),
    };

    await runAdminAction(async () => {
      await ensureInitialContent();
      await setDoc(doc(db, 'resources', id), stripUndefined(data));
      setResource(null);
      setEditingResourceId(null);
    }, t('Material salvo.'));
  };

  const saveQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question) return;

    const qType: QuestionType = question.type ?? 'objetiva';
    const pt = question.translations.pt;
    const ptPrompt = pt.prompt.trim();
    const ptExplanation = pt.explanation.trim();
    const ptAlts = pt.alternatives.map((item) => item.trim()).filter(Boolean);

    if (!ptPrompt) {
      setErrorMessage(t('Preencha o enunciado em português.'));
      return;
    }

    if (qType === 'objetiva') {
      if (ptAlts.length < 2) {
        setErrorMessage(t('Questões objetivas precisam de pelo menos 2 alternativas em português.'));
        return;
      }
      if (question.answer < 0 || question.answer >= ptAlts.length) {
        setErrorMessage(t('Selecione uma alternativa correta válida.'));
        return;
      }
    } else if (!question.expectedAnswer?.trim() && !pt.expectedAnswer?.trim()) {
      setErrorMessage(t('Informe a resposta esperada (espelho de correção) para a questão discursiva.'));
      return;
    }

    const expectedAnswer = (pt.expectedAnswer ?? question.expectedAnswer ?? '').trim();
    const languages: QuestionLanguage[] = ['pt', 'en', 'es', 'zh'];

    const translations = Object.fromEntries(
      languages.map((language) => {
        const current = question.translations[language];
        const currentAlts = current.alternatives.map((item) => item.trim()).filter(Boolean);
        return [
          language,
          {
            prompt: current.prompt.trim() || ptPrompt,
            explanation: current.explanation.trim() || ptExplanation,
            alternatives: qType === 'discursiva' ? [] : (currentAlts.length >= 2 ? currentAlts : ptAlts),
            ...(qType === 'discursiva' && expectedAnswer
              ? { expectedAnswer: current.expectedAnswer?.trim() || expectedAnswer }
              : {}),
          },
        ];
      }),
    ) as Record<QuestionLanguage, QuestionTranslation>;

    const id = editingQuestionId ?? doc(collection(db, 'questions')).id;
    const existing = questionDocuments.find((item) => item.id === id);
    const data = stripUndefined({
      type: qType,
      topic: question.topic,
      source: question.source,
      answer: qType === 'discursiva' ? -1 : Number(question.answer),
      imageUrl: question.imageUrl?.trim() || undefined,
      imageAlt: question.imageAlt?.trim() || undefined,
      expectedAnswer: qType === 'discursiva' ? expectedAnswer : undefined,
      expectedLines: qType === 'discursiva' ? Math.min(20, Math.max(2, Number(question.expectedLines) || 6)) : undefined,
      translations,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await runAdminAction(async () => {
      await ensureInitialContent();
      await setDoc(doc(db, 'questions', id), data);
      setQuestion(null);
      setEditingQuestionId(null);
    }, t('Questão salva.'));
  };

  const importJsonToFirestore = async () => {
    const parsed = parseQuestionsFromJson(jsonImportText);
    if (parsed.valid.length === 0) {
      setErrorMessage(parsed.errors[0] || t('Nenhuma questão válida encontrada no JSON.'));
      return;
    }

    await runAdminAction(async () => {
      await ensureInitialContent();
      const batch = writeBatch(db);
      parsed.valid.forEach((item) => {
        const ref = doc(collection(db, 'questions'));
        const translation: QuestionTranslation = {
          prompt: item.prompt,
          alternatives: item.alternatives,
          explanation: item.explanation,
          ...(item.expectedAnswer ? { expectedAnswer: item.expectedAnswer } : {}),
        };
        const docData = stripUndefined({
          type: item.type,
          topic: item.topic,
          source: item.source,
          answer: item.answer,
          imageUrl: item.imageUrl,
          imageAlt: item.imageAlt,
          expectedAnswer: item.expectedAnswer,
          expectedLines: item.expectedLines,
          translations: {
            pt: translation,
            en: translation,
            es: translation,
            zh: translation,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(ref, docData);
      });
      await batch.commit();
      setJsonImportText('');
      setShowJsonImport(false);
    }, `${parsed.valid.length} questão(ões) importada(s) para o Firestore.`);
  };

  const deleteResource = (item: OSResource) => {
    if (!item.id || !window.confirm(t('Excluir este material?'))) return;
    void runAdminAction(async () => {
      await ensureInitialContent();
      await deleteDoc(doc(db, 'resources', item.id!));
    }, t('Material removido.'));
  };

  const deleteQuestion = (item: QuestionDocument) => {
    if (!window.confirm(t('Excluir esta questão?'))) return;
    void runAdminAction(async () => {
      await ensureInitialContent();
      await deleteDoc(doc(db, 'questions', item.id));
    }, t('Questão removida.'));
  };

  const deleteQuestions = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return false;
    if (!window.confirm(t('Excluir {count} questão(ões) selecionada(s)?', { count: ids.length }))) return false;
    let deleted = false;
    await runAdminAction(async () => {
      await ensureInitialContent();
      for (let i = 0; i < ids.length; i += 450) {
        const batch = writeBatch(db);
        ids.slice(i, i + 450).forEach((id) => batch.delete(doc(db, 'questions', id)));
        await batch.commit();
      }
      deleted = true;
    }, t('{count} questão(ões) removida(s).', { count: ids.length }));
    return deleted;
  };

  const updateAdminAccess = async (enabled: boolean) => {
    const activeUser = user;
    await runAdminAction(async () => {
      const updateAccess = httpsCallable(functions, 'setAdminAccess');
      await updateAccess({ email: roleEmail.trim(), enabled });
      if (roleEmail.trim().toLowerCase() === activeUser?.email?.toLowerCase() && activeUser) {
        const token = await activeUser.getIdTokenResult(true);
        setIsAdmin(token.claims.admin === true);
      }
      setRoleEmail('');
    }, t(enabled ? 'Acesso administrativo concedido.' : 'Acesso administrativo removido.'));
  };

  if (authLoading) {
    return <AdminShell><p className="rounded-xl bg-white p-6 text-sm text-stone-600">{t('Verificando sessão...')}</p></AdminShell>;
  }

  const handleSaveCustomFirebase = (event: FormEvent) => {
    event.preventDefault();
    if (!fbApiKey.trim() || !fbAuthDomain.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      setErrorMessage(t('Preencha apiKey, authDomain, projectId e appId para conectar outro projeto Firebase.'));
      return;
    }
    saveCustomFirebaseConfig({
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
    });
  };

  if (!user) {
    return (
      <AdminShell>
        <section className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <KeyRound className="h-8 w-8 text-red-800" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-mono text-[11px] font-semibold text-stone-600">
              <Database className="h-3 w-3 text-emerald-600" />
              {activeFirebaseProjectId || 'firebase'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900">{t('Acesso administrativo')}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {t('Entre com sua conta Google ou e-mail/senha do Firebase Authentication para gerenciar questões e materiais.')}
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => void loginWithGoogle()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            {t('Entrar com Google')}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span>{t('ou use e-mail e senha')}</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={login} className="space-y-4">
            <label className="block text-sm font-semibold">{t('E-mail')}
              <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="block text-sm font-semibold">{t('Senha')}
              <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-50">{t('Entrar')}</button>
                <button type="button" disabled={busy || !email || password.length < 6} onClick={() => void register()} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-red-800 hover:bg-stone-50 disabled:opacity-50">{t('Criar conta')}</button>
              </div>
              <button type="button" disabled={busy} onClick={() => void resetPassword()} className="text-xs font-semibold text-red-800 hover:underline">
                {t('Esqueci minha senha')}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => setShowFirebaseConfig((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800"
            >
              <Settings className="h-3.5 w-3.5" />
              {isCustomFirebaseConfig ? t('Projeto Firebase personalizado ativo (alterar)') : t('Conectar outro projeto Firebase')}
            </button>

            {showFirebaseConfig && (
              <form onSubmit={handleSaveCustomFirebase} className="mt-3 space-y-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs">
                <p className="text-stone-600">{t('Cole os dados do seu app Web do Firebase Console (Configurações do Projeto):')}</p>
                <input value={fbProjectId} onChange={(e) => setFbProjectId(e.target.value)} placeholder="projectId (ex: meu-projeto-so)" className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono" />
                <input value={fbApiKey} onChange={(e) => setFbApiKey(e.target.value)} placeholder="apiKey" className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono" />
                <input value={fbAuthDomain} onChange={(e) => setFbAuthDomain(e.target.value)} placeholder="authDomain (ex: meu-projeto.firebaseapp.com)" className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono" />
                <input value={fbAppId} onChange={(e) => setFbAppId(e.target.value)} placeholder="appId" className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="submit" className="rounded-lg bg-stone-900 px-3 py-1.5 font-bold text-white">{t('Salvar e recarregar')}</button>
                  {isCustomFirebaseConfig && (
                    <button type="button" onClick={clearCustomFirebaseConfig} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-700">{t('Restaurar padrão')}</button>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
        <Feedback message={message} error={errorMessage} />
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell>
        <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <ShieldCheck className="mb-4 h-8 w-8 text-orange-700" />
          <h2 className="text-2xl font-black">{t('Ativar acesso administrativo')}</h2>
          <p className="mt-2 text-sm text-stone-600">{t('Conta conectada:')} <strong>{user.email}</strong> <span className="font-mono text-xs text-stone-400">({user.uid})</span></p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{t('Esta conta ainda não tem permissão de administrador. Clique abaixo para ativar o primeiro administrador no projeto Firebase conectado.')}</p>
          {!user.emailVerified && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t('Se criou a conta por e-mail/senha, confirme o link enviado pelo Firebase antes de continuar (contas Google já vêm verificadas).')}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => void activateBootstrap()} disabled={busy || !user.emailVerified} className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{t('Ativar primeiro administrador')}</button>
            {!user.emailVerified && <button onClick={() => void resendVerification()} disabled={busy} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700">{t('Reenviar e-mail de verificação')}</button>}
            <button onClick={() => void logout()} disabled={busy} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700">{t('Sair')}</button>
          </div>
        </section>
        <Feedback message={message} error={errorMessage} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 print:hidden">
        <div>
          <p className="text-sm text-stone-600"><ShieldCheck className="mr-2 inline h-4 w-4 text-green-700" />{t('Administrador conectado:')} <strong>{user.email}</strong></p>
          <p className="mt-0.5 font-mono text-[11px] text-stone-400">Firebase: {activeFirebaseProjectId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAdminAction(ensureInitialContent, t('Banco inicial sincronizado com o Firestore.'))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100"
          >
            <Database className="h-3.5 w-3.5 text-red-800" />
            {t('Sincronizar banco inicial')}
          </button>
          <button onClick={() => void logout()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"><LogOut className="h-4 w-4" />{t('Sair')}</button>
        </div>
      </div>
      <Feedback message={message} error={errorMessage || (resourcesError ? resourcesError.message : questionsError?.message ?? '')} />

      <section className="mb-6 flex flex-wrap gap-2 print:hidden">
        <button onClick={() => setSection('resources')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${section === 'resources' ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{t('Materiais')}</button>
        <button onClick={() => setSection('questions')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${section === 'questions' ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{t('Questões')}</button>
        <button onClick={() => setSection('exam')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${section === 'exam' ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{t('Criar prova')}</button>
      </section>

      {section === 'exam' ? (
        <QuestionBank embedded />
      ) : section === 'resources' ? (
        <section className="rounded-2xl border border-orange-100 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-black">{t('Gerenciar materiais')}</h2><p className="text-sm text-stone-500">{t('Slides, artigos, gincanas, atividades e ferramentas externas.')}</p></div>
            <button onClick={() => { setResource(resourceForm()); setEditingResourceId(null); }} className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />{t('Novo material')}</button>
          </div>
          {resourcesLoading ? <p className="py-5 text-sm text-stone-500">{t('Carregando materiais...')}</p> : (
            <div className="divide-y divide-orange-100">
              {resources.map((item, index) => (
                <div key={item.id ?? index} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-semibold">{item.title}</p><p className="text-xs text-stone-500">{t(RESOURCE_CATEGORY_LABELS[item.category])} · {t(MODULE_LABELS[item.module])}</p></div>
                  <div className="flex gap-2">
                    <button aria-label={t('Editar')} onClick={() => { setResource(resourceForm(item)); setEditingResourceId(item.id ?? null); }} disabled={!item.id} className="rounded-lg border border-orange-200 p-2 text-stone-700 disabled:opacity-40"><Pencil className="h-4 w-4" /></button>
                    <button aria-label={t('Excluir')} onClick={() => deleteResource(item)} disabled={!item.id} className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {!resources.length && <p className="py-5 text-sm text-stone-500">{t('Ainda não há materiais cadastrados.')}</p>}
            </div>
          )}
          {resource && (
            <form onSubmit={saveResource} className="mt-5 grid gap-4 rounded-xl bg-orange-50/70 p-4 sm:grid-cols-2">
              <h3 className="sm:col-span-2 text-lg font-bold">{t(editingResourceId ? 'Editar material' : 'Novo material')}</h3>
              <label className="text-sm font-semibold">{t('Título')}
                <input required value={resource.title} onChange={(event) => setResource({ ...resource, title: event.target.value })} className="admin-input" />
              </label>
              <label className="text-sm font-semibold">{t('Categoria')}
                <select value={resource.category} onChange={(event) => setResource({ ...resource, category: event.target.value as ResourceCategory })} className="admin-input">
                  {RESOURCE_CATEGORIES.map((value) => <option key={value} value={value}>{t(RESOURCE_CATEGORY_LABELS[value])}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{t('Módulo')}
                <select value={resource.module} onChange={(event) => setResource({ ...resource, module: event.target.value as OSModule })} className="admin-input">
                  {MODULES.map((value) => <option key={value} value={value}>{t(MODULE_LABELS[value])}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{t('Dificuldade')}
                <select value={resource.difficulty} onChange={(event) => setResource({ ...resource, difficulty: event.target.value as OSResource['difficulty'] })} className="admin-input">
                  {(['Iniciante', 'Intermediário', 'Avançado'] as const).map((value) => <option key={value} value={value}>{t(value)}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">{t('Descrição / resumo')}
                <textarea required rows={3} value={resource.description} onChange={(event) => setResource({ ...resource, description: event.target.value })} className="admin-input" />
              </label>
              <label className="text-sm font-semibold">{t('Tags (separadas por vírgula)')}
                <input value={resource.tags.join(', ')} onChange={(event) => setResource({ ...resource, tags: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="admin-input" />
              </label>
              <label className="text-sm font-semibold">{t('URL externa')}
                <input type="url" value={resource.externalUrl} onChange={(event) => setResource({ ...resource, externalUrl: event.target.value })} className="admin-input" />
              </label>
              <label className="text-sm font-semibold">{t('Autor / instituição')}
                <input required value={resource.authorName} onChange={(event) => setResource({ ...resource, authorName: event.target.value })} className="admin-input" />
              </label>
              {resource.category === 'gincana' && <>
                <label className="text-sm font-semibold">{t('Tempo estimado (minutos)')}
                  <input required min={1} type="number" value={resource.executionTime} onChange={(event) => setResource({ ...resource, executionTime: Number(event.target.value) })} className="admin-input" />
                </label>
                <label className="text-sm font-semibold">{t('Materiais (um por linha)')}
                  <textarea rows={3} value={resource.materials} onChange={(event) => setResource({ ...resource, materials: event.target.value })} className="admin-input" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">{t('Etapas (uma por linha)')}
                  <textarea rows={4} value={resource.steps} onChange={(event) => setResource({ ...resource, steps: event.target.value })} className="admin-input" />
                </label>
              </>}
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={busy} className="rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white">{t('Salvar')}</button>
                <button type="button" onClick={() => setResource(null)} className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-bold">{t('Cancelar')}</button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <AdminQuestionsSection
          questionDocuments={questionDocuments}
          questionsLoading={questionsLoading}
          question={question}
          setQuestion={setQuestion}
          editingQuestionId={editingQuestionId}
          setEditingQuestionId={setEditingQuestionId}
          questionLanguage={questionLanguage}
          setQuestionLanguage={setQuestionLanguage}
          questionSearch={questionSearch}
          setQuestionSearch={setQuestionSearch}
          questionFilterTopic={questionFilterTopic}
          setQuestionFilterTopic={setQuestionFilterTopic}
          questionFilterType={questionFilterType}
          setQuestionFilterType={setQuestionFilterType}
          questionPage={questionPage}
          setQuestionPage={setQuestionPage}
          showJsonImport={showJsonImport}
          setShowJsonImport={setShowJsonImport}
          jsonImportText={jsonImportText}
          setJsonImportText={setJsonImportText}
          onImportJson={importJsonToFirestore}
          onSaveQuestion={saveQuestion}
          onDeleteQuestion={deleteQuestion}
          onDeleteQuestions={deleteQuestions}
          busy={busy}
        />
      )}

      <section className="mt-6 rounded-2xl border border-orange-100 bg-white p-5 print:hidden">
        <h2 className="text-lg font-black">{t('Administradores')}</h2>
        <p className="mt-1 text-sm text-stone-600">{t('Conceda ou remova a claim administrativa de uma conta verificada.')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input type="email" value={roleEmail} onChange={(event) => setRoleEmail(event.target.value)} placeholder={t('E-mail da conta')} className="min-w-64 rounded-lg border border-orange-200 px-3 py-2 text-sm" />
          <button onClick={() => void updateAdminAccess(true)} disabled={busy || !roleEmail} className="rounded-lg bg-red-800 px-3 py-2 text-sm font-bold text-white">{t('Conceder acesso')}</button>
          <button onClick={() => void updateAdminAccess(false)} disabled={busy || !roleEmail} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-800">{t('Remover acesso')}</button>
        </div>
      </section>
    </AdminShell>
  );
}

function AdminQuestionsSection({
  questionDocuments,
  questionsLoading,
  question,
  setQuestion,
  editingQuestionId,
  setEditingQuestionId,
  questionLanguage,
  setQuestionLanguage,
  questionSearch,
  setQuestionSearch,
  questionFilterTopic,
  setQuestionFilterTopic,
  questionFilterType,
  setQuestionFilterType,
  questionPage,
  setQuestionPage,
  showJsonImport,
  setShowJsonImport,
  jsonImportText,
  setJsonImportText,
  onImportJson,
  onSaveQuestion,
  onDeleteQuestion,
  onDeleteQuestions,
  busy,
}: {
  questionDocuments: QuestionDocument[];
  questionsLoading: boolean;
  question: QuestionDocument | null;
  setQuestion: (q: QuestionDocument | null) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;
  questionLanguage: QuestionLanguage;
  setQuestionLanguage: (lang: QuestionLanguage) => void;
  questionSearch: string;
  setQuestionSearch: (v: string) => void;
  questionFilterTopic: 'todos' | QuestionTopic;
  setQuestionFilterTopic: (v: 'todos' | QuestionTopic) => void;
  questionFilterType: 'todos' | QuestionType;
  setQuestionFilterType: (v: 'todos' | QuestionType) => void;
  questionPage: number;
  setQuestionPage: (v: number) => void;
  showJsonImport: boolean;
  setShowJsonImport: (v: boolean) => void;
  jsonImportText: string;
  setJsonImportText: (v: string) => void;
  onImportJson: () => Promise<void>;
  onSaveQuestion: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteQuestion: (item: QuestionDocument) => void;
  onDeleteQuestions: (ids: string[]) => Promise<boolean>;
  busy: boolean;
}) {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pageSize = 6;
  const query = questionSearch.trim().toLowerCase();
  const filtered = questionDocuments.filter((item) => {
    const qType = item.type ?? 'objetiva';
    if (questionFilterTopic !== 'todos' && item.topic !== questionFilterTopic) return false;
    if (questionFilterType !== 'todos' && qType !== questionFilterType) return false;
    if (!query) return true;
    return item.translations.pt.prompt.toLowerCase().includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(questionPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openNewQuestion = () => {
    setShowJsonImport(false);
    setQuestion({
      id: '',
      type: 'objetiva',
      topic: 'processos',
      source: 'assunto',
      answer: 0,
      expectedLines: 6,
      translations: {
        pt: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
        en: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
        es: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
        zh: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setEditingQuestionId(null);
    setQuestionLanguage('pt');
  };

  const handleImageUpload = async (file?: File) => {
    if (!file || !question) return;
    const dataUrl = await readImageAsDataUrl(file);
    setQuestion({ ...question, imageUrl: dataUrl, imageAlt: question.imageAlt || file.name.replace(/\.[^.]+$/, '') });
  };

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-stone-900">{t('Gerenciar questões')}</h2>
          <p className="mt-0.5 text-sm text-stone-500">
            {t('Cadastre questões objetivas ou discursivas com espelho e imagem, ou importe em lote via JSON. Traduções vazias usam automaticamente o português.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setQuestion(null);
              setShowJsonImport(!showJsonImport);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:border-red-300 hover:text-red-800"
          >
            <FileJson className="h-4 w-4 text-red-700" /> {t('Importar JSON')}
          </button>
          <button
            type="button"
            onClick={openNewQuestion}
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-900"
          >
            <Plus className="h-4 w-4" /> {t('Nova questão')}
          </button>
        </div>
      </div>

      {showJsonImport && (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-stone-900">{t('Importar questões para o Firestore (JSON)')}</h3>
            <button
              type="button"
              onClick={() => setJsonImportText(SAMPLE_QUESTIONS_JSON)}
              className="text-xs font-bold text-red-800 hover:underline"
            >
              {t('Carregar exemplo JSON')}
            </button>
          </div>
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setJsonImportText(await file.text());
            }}
            className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-red-900"
          />
          <textarea
            rows={6}
            value={jsonImportText}
            onChange={(e) => setJsonImportText(e.target.value)}
            placeholder='[{"type":"discursiva","topic":"memoria","prompt":"...","expectedAnswer":"..."}]'
            className="w-full rounded-xl border border-stone-200 bg-stone-950 p-3 font-mono text-xs text-stone-100 outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !jsonImportText.trim()}
              onClick={() => void onImportJson()}
              className="rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-900 disabled:opacity-50"
            >
              {t('Importar para Firestore')}
            </button>
            <button
              type="button"
              onClick={() => setShowJsonImport(false)}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700"
            >
              {t('Cancelar')}
            </button>
          </div>
        </div>
      )}

      {question && (
        <form onSubmit={onSaveQuestion} className="space-y-5 rounded-2xl border border-red-200/70 bg-stone-50/70 p-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-lg font-extrabold text-stone-900">
              {t(editingQuestionId ? 'Editar questão' : 'Nova questão')}
            </h3>
            <button
              type="button"
              onClick={() => setQuestion(null)}
              aria-label={t('Fechar')}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-200/70 p-1 sm:max-w-md">
            {(['objetiva', 'discursiva'] as const).map((qType) => (
              <button
                key={qType}
                type="button"
                onClick={() => setQuestion({ ...question, type: qType })}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  (question.type ?? 'objetiva') === qType
                    ? 'bg-white text-red-800 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {qType === 'objetiva' ? t('Objetiva (Múltipla escolha)') : t('Discursiva (Com espelho)')}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-wide text-stone-600">
              {t('Assunto')}
              <select
                value={question.topic}
                onChange={(event) => setQuestion({ ...question, topic: event.target.value as QuestionTopic })}
                className="admin-input"
              >
                {TOPICS.map((value) => (
                  <option key={value} value={value}>{t(TOPIC_LABELS[value])}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-stone-600">
              {t('Origem')}
              <select
                value={question.source}
                onChange={(event) => setQuestion({ ...question, source: event.target.value as QuestionDocument['source'] })}
                className="admin-input"
              >
                <option value="assunto">{t('Por assunto')}</option>
                <option value="enade">{t('Simulado estilo ENADE')}</option>
                <option value="custom">{t('Autoral / Docente')}</option>
              </select>
            </label>
            {(question.type ?? 'objetiva') === 'objetiva' ? (
              <label className="text-xs font-bold uppercase tracking-wide text-stone-600">
                {t('Alternativa correta (1 a 4)')}
                <input
                  required
                  min={1}
                  max={question.translations.pt.alternatives.length || 5}
                  type="number"
                  value={question.answer + 1}
                  onChange={(event) => setQuestion({ ...question, answer: Number(event.target.value) - 1 })}
                  className="admin-input"
                />
              </label>
            ) : (
              <label className="text-xs font-bold uppercase tracking-wide text-stone-600">
                {t('Linhas na prova')}
                <input
                  min={2}
                  max={20}
                  type="number"
                  value={question.expectedLines ?? 6}
                  onChange={(event) => setQuestion({ ...question, expectedLines: Number(event.target.value) })}
                  className="admin-input"
                />
              </label>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-600">{t('Imagem da questão (opcional)')}</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-red-300 hover:text-red-800">
                <ImagePlus className="h-3.5 w-3.5" /> {t('Enviar imagem')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder={t('Ou cole a URL da imagem')}
                value={question.imageUrl?.startsWith('data:') ? '' : (question.imageUrl ?? '')}
                onChange={(e) => setQuestion({ ...question, imageUrl: e.target.value })}
                className="rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:border-red-400"
              />
              <input
                type="text"
                placeholder={t('Descrição da imagem (alt)')}
                value={question.imageAlt ?? ''}
                onChange={(e) => setQuestion({ ...question, imageAlt: e.target.value })}
                className="rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:border-red-400"
              />
            </div>
            {question.imageUrl && (
              <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <img src={question.imageUrl} alt={question.imageAlt || 'Preview'} className="max-h-32 rounded object-contain" />
                <button
                  type="button"
                  onClick={() => setQuestion({ ...question, imageUrl: undefined, imageAlt: undefined })}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  {t('Remover')}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t('Idioma da questão')}>
            {LANGUAGES.map((language) => (
              <button
                type="button"
                role="tab"
                aria-selected={questionLanguage === language}
                key={language}
                onClick={() => setQuestionLanguage(language)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  questionLanguage === language
                    ? 'bg-red-800 text-white shadow-sm'
                    : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {LANGUAGE_NAMES[language]} {language === 'pt' ? '*' : ''}
              </button>
            ))}
          </div>

          <QuestionTranslationForm
            questionType={question.type ?? 'objetiva'}
            isRequired={questionLanguage === 'pt'}
            translation={question.translations[questionLanguage]}
            expectedAnswer={question.translations[questionLanguage].expectedAnswer ?? question.expectedAnswer ?? ''}
            onExpectedAnswerChange={(val) =>
              setQuestion({
                ...question,
                ...(questionLanguage === 'pt' ? { expectedAnswer: val } : {}),
                translations: {
                  ...question.translations,
                  [questionLanguage]: { ...question.translations[questionLanguage], expectedAnswer: val },
                },
              })
            }
            onChange={(translation) =>
              setQuestion({
                ...question,
                translations: { ...question.translations, [questionLanguage]: translation },
              })
            }
          />

          <div className="flex gap-2 border-t border-stone-200 pt-4">
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-900">
              <Check className="h-4 w-4" /> {t('Salvar questão')}
            </button>
            <button type="button" onClick={() => setQuestion(null)} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-700">
              {t('Cancelar')}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={questionSearch}
            onChange={(e) => {
              setQuestionSearch(e.target.value);
              setQuestionPage(1);
            }}
            placeholder={t('Buscar questão...')}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-red-400"
          />
        </div>
        <select
          value={questionFilterTopic}
          onChange={(e) => {
            setQuestionFilterTopic(e.target.value as 'todos' | QuestionTopic);
            setQuestionPage(1);
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-red-400"
        >
          <option value="todos">{t('Todos os assuntos')}</option>
          {TOPICS.map((value) => (
            <option key={value} value={value}>{t(TOPIC_LABELS[value])}</option>
          ))}
        </select>
        <select
          value={questionFilterType}
          onChange={(e) => {
            setQuestionFilterType(e.target.value as 'todos' | QuestionType);
            setQuestionPage(1);
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-red-400"
        >
          <option value="todos">{t('Todos os tipos')}</option>
          <option value="objetiva">{t('Objetivas')}</option>
          <option value="discursiva">{t('Discursivas')}</option>
        </select>
      </div>

      {!questionsLoading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-stone-700">
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id))}
              onChange={(event) => {
                if (event.target.checked) {
                  setSelectedIds(Array.from(new Set([...selectedIds, ...filtered.map((item) => item.id)])));
                } else {
                  const filteredSet = new Set(filtered.map((item) => item.id));
                  setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
                }
              }}
              className="h-4 w-4 rounded border-stone-300 text-red-800 focus:ring-red-500"
            />
            {t('Selecionar todas')} ({filtered.length})
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-stone-600">
                {t('{count} questão(ões) selecionada(s).', { count: selectedIds.length })}
              </span>
            )}
            <button
              type="button"
              disabled={busy || selectedIds.length === 0}
              onClick={() => {
                const validIds = selectedIds.filter((id) => questionDocuments.some((q) => q.id === id));
                void onDeleteQuestions(validIds).then((ok) => {
                  if (ok) setSelectedIds([]);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t('Excluir selecionadas')}
            </button>
          </div>
        </div>
      )}

      {questionsLoading ? (
        <p className="py-5 text-sm text-stone-500">{t('Carregando questões...')}</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {paginated.map((item) => {
            const qType = item.type ?? 'objetiva';
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <input
                  type="checkbox"
                  aria-label={t('Selecionar questão')}
                  checked={isSelected}
                  onChange={() =>
                    setSelectedIds((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                    )
                  }
                  className="h-4 w-4 shrink-0 rounded border-stone-300 text-red-800 focus:ring-red-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-900">
                      {t(TOPIC_LABELS[item.topic])}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      qType === 'discursiva' ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {qType === 'discursiva' ? t('Discursiva') : t('Objetiva')}
                    </span>
                    {item.imageUrl && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                        <ImageIcon className="h-3 w-3" /> {t('Imagem')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-stone-900">{item.translations.pt.prompt}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label={t('Editar')}
                    onClick={() => {
                      setShowJsonImport(false);
                      setQuestion(item);
                      setEditingQuestionId(item.id);
                      setQuestionLanguage('pt');
                    }}
                    className="rounded-xl border border-stone-200 p-2 text-stone-700 hover:bg-stone-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={t('Excluir')}
                    onClick={() => onDeleteQuestion(item)}
                    className="rounded-xl border border-red-200 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!paginated.length && <p className="py-6 text-center text-sm text-stone-500">{t('Nenhuma questão encontrada.')}</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setQuestionPage(Math.max(1, safePage - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> {t('Anterior')}
          </button>
          <span className="text-xs font-semibold text-stone-500">
            {safePage} / {totalPages} ({filtered.length} {t('questões')})
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setQuestionPage(Math.min(totalPages, safePage + 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40"
          >
            {t('Próxima')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function QuestionTranslationForm({
  questionType,
  isRequired,
  translation,
  expectedAnswer,
  onExpectedAnswerChange,
  onChange,
}: {
  questionType: QuestionType;
  isRequired: boolean;
  translation: QuestionTranslation;
  expectedAnswer: string;
  onExpectedAnswerChange: (value: string) => void;
  onChange: (translation: QuestionTranslation) => void;
}) {
  const { t } = useLanguage();
  const updateAlternative = (index: number, value: string) => {
    const alternatives = [...translation.alternatives];
    alternatives[index] = value;
    onChange({ ...translation, alternatives });
  };

  return (
    <div className="grid gap-4">
      <label className="text-sm font-semibold text-stone-800">
        {t('Enunciado')} {isRequired ? '*' : ''}
        <textarea
          required={isRequired}
          rows={3}
          value={translation.prompt}
          onChange={(event) => onChange({ ...translation, prompt: event.target.value })}
          className="admin-input"
        />
      </label>

      {questionType === 'objetiva' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {translation.alternatives.map((alternative, index) => (
            <label key={index} className="text-sm font-semibold text-stone-800">
              {t('Alternativa')} {index + 1} {isRequired && index < 2 ? '*' : ''}
              <textarea
                required={isRequired && index < 2}
                rows={2}
                value={alternative}
                onChange={(event) => updateAlternative(index, event.target.value)}
                className="admin-input"
              />
            </label>
          ))}
        </div>
      ) : (
        <label className="text-sm font-semibold text-amber-950">
          {t('Resposta esperada / Espelho de correção')} {isRequired ? '*' : ''}
          <textarea
            required={isRequired}
            rows={4}
            value={expectedAnswer}
            onChange={(event) => onExpectedAnswerChange(event.target.value)}
            placeholder={t('Resposta que aparecerá no espelho do professor...')}
            className="admin-input"
          />
        </label>
      )}

      <label className="text-sm font-semibold text-stone-800">
        {t('Explicação / comentário (opcional)')}
        <textarea
          rows={2}
          value={translation.explanation}
          onChange={(event) => onChange({ ...translation, explanation: event.target.value })}
          className="admin-input"
        />
      </label>
    </div>
  );
}

function AdminShell({ children }: { children: import('react').ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 print:max-w-none print:p-0">
      <div className="print:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{t('Área restrita')}</p>
        <h1 className="mt-2 text-3xl font-black text-stone-900">{t('Painel administrativo')}</h1>
        <p className="mb-8 mt-2 text-sm leading-6 text-stone-600">{t('Gerencie conteúdos e questões do SO Docente Hub com acesso protegido pelo Firebase.')}</p>
      </div>
      {children}
    </div>
  );
}

function Feedback({ message, error }: { message: string; error: string }) {
  return (
    <div aria-live="polite" className="mb-5 space-y-2">
      {message && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  );
}
