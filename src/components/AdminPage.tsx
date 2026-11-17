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
import { Check, Database, KeyRound, LogOut, Pencil, Plus, Settings, ShieldCheck, Trash2 } from 'lucide-react';
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
import type { QuestionDocument, QuestionLanguage, QuestionTopic, QuestionTranslation } from '../types/question';
import type { OSModule, OSResource, ResourceCategory } from '../types/repository';

type AdminSection = 'resources' | 'questions';
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
const TOPICS: QuestionTopic[] = ['processos', 'memoria', 'sincronizacao', 'arquivos'];
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
const EMPTY_TRANSLATIONS: Record<QuestionLanguage, QuestionTranslation> = {
  pt: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
  en: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
  es: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
  zh: { ...EMPTY_TRANSLATION, alternatives: [...EMPTY_TRANSLATION.alternatives] },
};

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

function withoutId<T extends { id?: string }>(value: T): Omit<T, 'id'> {
  const data = { ...value };
  delete data.id;
  return data;
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
      await setDoc(doc(db, 'resources', id), data);
      setResource(null);
      setEditingResourceId(null);
    }, t('Material salvo.'));
  };

  const saveQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question) return;
    const languages: QuestionLanguage[] = ['pt', 'en', 'es', 'zh'];
    const alternativeCounts = languages.map((language) =>
      question.translations[language].alternatives.map((item) => item.trim()).filter(Boolean).length,
    );
    if (languages.some((language) =>
      !question.translations[language].prompt.trim() ||
      !question.translations[language].explanation.trim() ||
      alternativeCounts[languages.indexOf(language)] < 2,
    )) {
      setErrorMessage(t('Preencha enunciado, pelo menos duas alternativas e explicação nos quatro idiomas.'));
      return;
    }
    if (new Set(alternativeCounts).size !== 1 || question.answer < 0 || question.answer >= alternativeCounts[0]) {
      setErrorMessage(t('As quatro traduções devem ter o mesmo número de alternativas e a resposta correta deve existir.'));
      return;
    }

    const id = editingQuestionId ?? doc(collection(db, 'questions')).id;
    const existing = questionDocuments.find((item) => item.id === id);
    const data = {
      topic: question.topic,
      source: question.source,
      answer: Number(question.answer),
      translations: Object.fromEntries(languages.map((language) => [
        language,
        {
          prompt: question.translations[language].prompt.trim(),
          explanation: question.translations[language].explanation.trim(),
          alternatives: question.translations[language].alternatives.map((item) => item.trim()).filter(Boolean),
        },
      ])) as Record<QuestionLanguage, QuestionTranslation>,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await runAdminAction(async () => {
      await ensureInitialContent();
      await setDoc(doc(db, 'questions', id), data);
      setQuestion(null);
      setEditingQuestionId(null);
    }, t('Questão salva.'));
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
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

      <section className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setSection('resources')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${section === 'resources' ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{t('Materiais')}</button>
        <button onClick={() => setSection('questions')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${section === 'questions' ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{t('Questões')}</button>
      </section>

      {section === 'resources' ? (
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
        <section className="rounded-2xl border border-orange-100 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-black">{t('Gerenciar questões')}</h2><p className="text-sm text-stone-500">{t('Cada questão exige enunciado, alternativas e explicação em português, inglês, espanhol e mandarim.')}</p></div>
            <button onClick={() => { setQuestion({ id: '', topic: 'processos', source: 'assunto', answer: 0, translations: { ...EMPTY_TRANSLATIONS }, createdAt: Date.now(), updatedAt: Date.now() }); setEditingQuestionId(null); setQuestionLanguage('pt'); }} className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />{t('Nova questão')}</button>
          </div>
          {questionsLoading ? <p className="py-5 text-sm text-stone-500">{t('Carregando questões...')}</p> : (
            <div className="divide-y divide-orange-100">
              {questionDocuments.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-semibold">{item.translations.pt.prompt}</p><p className="text-xs text-stone-500">{t(TOPIC_LABELS[item.topic])} · {t(item.source === 'enade' ? 'Simulado estilo ENADE' : 'Por assunto')}</p></div>
                  <div className="flex gap-2">
                    <button aria-label={t('Editar')} onClick={() => { setQuestion(item); setEditingQuestionId(item.id); setQuestionLanguage('pt'); }} className="rounded-lg border border-orange-200 p-2 text-stone-700"><Pencil className="h-4 w-4" /></button>
                    <button aria-label={t('Excluir')} onClick={() => deleteQuestion(item)} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {!questionDocuments.length && <p className="py-5 text-sm text-stone-500">{t('Ainda não há questões cadastradas.')}</p>}
            </div>
          )}
          {question && (
            <form onSubmit={saveQuestion} className="mt-5 space-y-4 rounded-xl bg-orange-50/70 p-4">
              <h3 className="text-lg font-bold">{t(editingQuestionId ? 'Editar questão' : 'Nova questão')}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-semibold">{t('Assunto')}
                  <select value={question.topic} onChange={(event) => setQuestion({ ...question, topic: event.target.value as QuestionTopic })} className="admin-input">{TOPICS.map((value) => <option key={value} value={value}>{t(TOPIC_LABELS[value])}</option>)}</select>
                </label>
                <label className="text-sm font-semibold">{t('Origem')}
                  <select value={question.source} onChange={(event) => setQuestion({ ...question, source: event.target.value as QuestionDocument['source'] })} className="admin-input">
                    <option value="assunto">{t('Por assunto')}</option><option value="enade">{t('Simulado estilo ENADE')}</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">{t('Resposta correta (número da alternativa)')}
                  <input required min={1} type="number" value={question.answer + 1} onChange={(event) => setQuestion({ ...question, answer: Number(event.target.value) - 1 })} className="admin-input" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('Idioma da questão')}>
                {LANGUAGES.map((language) => <button type="button" role="tab" aria-selected={questionLanguage === language} key={language} onClick={() => setQuestionLanguage(language)} className={`rounded-lg px-3 py-2 text-sm font-bold ${questionLanguage === language ? 'bg-red-800 text-white' : 'bg-white text-stone-700'}`}>{LANGUAGE_NAMES[language]}</button>)}
              </div>
              <QuestionTranslationForm
                translation={question.translations[questionLanguage]}
                onChange={(translation) => setQuestion({ ...question, translations: { ...question.translations, [questionLanguage]: translation } })}
              />
              <div className="flex gap-2">
                <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" />{t('Salvar questão')}</button>
                <button type="button" onClick={() => setQuestion(null)} className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-bold">{t('Cancelar')}</button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-orange-100 bg-white p-5">
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

function QuestionTranslationForm({
  translation,
  onChange,
}: {
  translation: QuestionTranslation;
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
      <label className="text-sm font-semibold">{t('Enunciado')}
        <textarea required rows={3} value={translation.prompt} onChange={(event) => onChange({ ...translation, prompt: event.target.value })} className="admin-input" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {translation.alternatives.map((alternative, index) => (
          <label key={index} className="text-sm font-semibold">{t('Alternativa')} {index + 1}
            <textarea required rows={2} value={alternative} onChange={(event) => updateAlternative(index, event.target.value)} className="admin-input" />
          </label>
        ))}
      </div>
      <label className="text-sm font-semibold">{t('Explicação')}
        <textarea required rows={3} value={translation.explanation} onChange={(event) => onChange({ ...translation, explanation: event.target.value })} className="admin-input" />
      </label>
    </div>
  );
}

function AdminShell({ children }: { children: import('react').ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{t('Área restrita')}</p>
      <h1 className="mt-2 text-3xl font-black text-stone-900">{t('Painel administrativo')}</h1>
      <p className="mb-8 mt-2 text-sm leading-6 text-stone-600">{t('Gerencie conteúdos e questões do SO Docente Hub com acesso protegido pelo Firebase.')}</p>
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
