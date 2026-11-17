// src/hooks/useResources.ts
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { OSResource } from '../types/repository';
import { INITIAL_RESOURCES } from '../data/seedData';

const getLocalFallback = (): OSResource[] => {
  return INITIAL_RESOURCES;
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
        if (snapshot.empty && !(await getDoc(doc(db, '_metadata', 'adminSeed'))).exists()) {
          return getLocalFallback();
        }
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as OSResource),
        }));
      } catch (error) {
        console.error('Unable to load teaching resources from Firestore.', error);
        throw error;
      }
    },
  });
};