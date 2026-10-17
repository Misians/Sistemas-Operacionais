// src/components/CreateResourceModal.tsx
import React, { useState } from 'react';
import type { OSModule, OSResource, ResourceCategory } from '../types/repository';
import { useAddResource } from '../hooks/useResources';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateResourceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { mutateAsync: addResource, isPending } = useAddResource();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('gincana');
  const [module, setModule] = useState<OSModule>('gerencia_memoria');
  const [difficulty, setDifficulty] = useState<OSResource['difficulty']>('Intermediário');
  const [tagsInput, setTagsInput] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Campos exclusivos para Gincana
  const [executionTime, setExecutionTime] = useState(45);
  const [materials, setMaterials] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);

  if (!isOpen) return null;

  const handleArrayChange = (
    index: number,
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newResource: Omit<OSResource, 'id'> = {
      title,
      description,
      category,
      module,
      difficulty,
      tags: tags.length > 0 ? tags : ['Sistemas Operacionais'],
      externalUrl: externalUrl.trim() || undefined,
      authorName: authorName.trim() || 'Docente Colaborador',
      createdAt: Date.now(),
      ...(category === 'gincana' && {
        gameDetails: {
          executionTimeMinutes: Number(executionTime) || 40,
          materialsNeeded: materials.map((m) => m.trim()).filter(Boolean),
          stepByStepRules: steps.map((s) => s.trim()).filter(Boolean),
        },
      }),
    };

    await addResource(newResource);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cadastrar Novo Material Didático</h2>
            <p className="text-xs text-slate-500">Compartilhe dinâmicas, laboratórios, conteúdos ou simuladores</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tipo de Recurso</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="gincana">🎲 Gincana / Dinâmica em Sala</option>
                <option value="tarefa">💻 Tarefa / Laboratório Prático</option>
                <option value="plataforma">🚀 Simulador / Plataforma</option>
                <option value="conteudo">📚 Conteúdo / Slides / Artigo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Módulo da Ementa</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as OSModule)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="arquitetura_so">Introdução e Arquitetura</option>
                <option value="processos_threads">Processos e Escalonamento</option>
                <option value="sincronizacao">Sincronização e Deadlocks</option>
                <option value="gerencia_memoria">Gerenciamento de Memória</option>
                <option value="sistemas_arquivos">Sistemas de Arquivos e E/S</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Título da Atividade / Recurso *</label>
            <input
              required
              type="text"
              placeholder="Ex: Batalha de Escalonadores com Baralho"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Resumo Pedagógico *</label>
            <textarea
              required
              rows={2}
              placeholder="Qual conceito de SO este recurso ajuda a fixar?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>

          {/* Seção Dinâmica Exclusiva para Gincanas */}
          {category === 'gincana' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-amber-900">Configuração da Gincana Presencial</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-amber-900">Tempo (min):</label>
                  <input
                    type="number"
                    value={executionTime}
                    onChange={(e) => setExecutionTime(Number(e.target.value))}
                    className="w-20 border border-amber-300 rounded px-2 py-1 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Materiais Necessários</label>
                <div className="space-y-2">
                  {materials.map((mat, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: 15 cadeiras, Post-its coloridos..."
                        value={mat}
                        onChange={(e) => handleArrayChange(idx, e.target.value, materials, setMaterials)}
                        className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                      />
                      {materials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMaterials([...materials, ''])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar material
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Roteiro Passo a Passo em Sala</label>
                <div className="space-y-2">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-amber-800 pt-2">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        placeholder={`Descreva a etapa ${idx + 1} da dinâmica...`}
                        value={st}
                        onChange={(e) => handleArrayChange(idx, e.target.value, steps, setSteps)}
                        className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 px-2 pt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSteps([...steps, ''])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar etapa do roteiro
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nível</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as OSResource['difficulty'])}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                placeholder="Paginação, FIFO, C"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Professor(a) / Autor(a)</label>
              <input
                type="text"
                placeholder="Seu nome ou instituição"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Link Externo (GitHub, Simulador, Slides ou PDF)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg text-xs font-bold transition"
            >
              <Save className="w-4 h-4" />
              {isPending ? 'Salvando...' : 'Publicar no Repositório'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};