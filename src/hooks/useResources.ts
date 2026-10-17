// src/hooks/useResources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { OSResource } from '../types/repository';
import { INITIAL_RESOURCES } from '../data/seedData';

const LOCAL_STORAGE_KEY = 'so_docente_custom_resources';

const getLocalFallback = (): OSResource[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  const custom: OSResource[] = saved ? JSON.parse(saved) : [];
  return [...custom, ...INITIAL_RESOURCES];
};

export const useResources = () => {
  return useQuery({
    queryKey: ['os-resources'],
    queryFn: async (): Promise<OSResource[]> => {
      try {
        if (!import.meta.env.VITE_FIREBASE_API_KEY) {
          return getLocalFallback();
        }
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return getLocalFallback();
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as OSResource),
        }));
      } catch (error) {
        console.warn('Operando em modo local (offline/sem chaves Firebase).', error);
        return getLocalFallback();
      }
    },
  });
};

export const useAddResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newResource: Omit<OSResource, 'id'>) => {
      try {
        if (import.meta.env.VITE_FIREBASE_API_KEY) {
          const docRef = await addDoc(collection(db, 'resources'), newResource);
          return { id: docRef.id, ...newResource };
        }
      } catch (e) {
        console.warn('Salvando no armazenamento local temporário:', e);
      }

      // Fallback local para desenvolvimento imediato
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const custom: OSResource[] = saved ? JSON.parse(saved) : [];
      const created: OSResource = { ...newResource, id: `custom-${Date.now()}` };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([created, ...custom]));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-resources'] });
    },
  });
};