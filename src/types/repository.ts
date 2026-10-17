// src/types/repository.ts
export type ResourceCategory = 'conteudo' | 'tarefa' | 'gincana' | 'plataforma';

export type OSModule =
  | 'arquitetura_so'
  | 'processos_threads'
  | 'sincronizacao'
  | 'gerencia_memoria'
  | 'sistemas_arquivos';

export interface GameLogistics {
  materialsNeeded: string[];
  executionTimeMinutes: number;
  stepByStepRules: string[];
}

export interface OSResource {
  id?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  module: OSModule;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  tags: string[];
  externalUrl?: string;
  gameDetails?: GameLogistics;
  authorName: string;
  createdAt: number;
}