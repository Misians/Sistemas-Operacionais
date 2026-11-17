// src/config/firebase.ts
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const STORAGE_KEY = 'so_docente_firebase_config';

const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8jKmu_IA4Wh2YjRf0xtevHr8PfTXSmE8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'guia-de-ensino-em-so.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'guia-de-ensino-em-so',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'guia-de-ensino-em-so.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '940896462575',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:940896462575:web:9c6663e6479de9d682dd1a',
};

function loadFirebaseConfig(): { config: FirebaseOptions; isCustom: boolean } {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FirebaseOptions>;
        if (parsed.apiKey && parsed.authDomain && parsed.projectId && parsed.appId) {
          return {
            config: {
              apiKey: parsed.apiKey,
              authDomain: parsed.authDomain,
              projectId: parsed.projectId,
              storageBucket: parsed.storageBucket || `${parsed.projectId}.firebasestorage.app`,
              messagingSenderId: parsed.messagingSenderId || '',
              appId: parsed.appId,
            },
            isCustom: true,
          };
        }
      }
    } catch {
      // Ignore malformed local storage config and fall back to default
    }
  }
  return { config: DEFAULT_FIREBASE_CONFIG, isCustom: false };
}

const { config: firebaseConfig, isCustom: isCustomFirebaseConfig } = loadFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-key' && firebaseConfig.projectId,
);

export const activeFirebaseProjectId = firebaseConfig.projectId ?? '';
export { isCustomFirebaseConfig };

export function saveCustomFirebaseConfig(next: FirebaseOptions) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.location.reload();
}

export function clearCustomFirebaseConfig() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const functions = getFunctions(app);
