import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { TOPIC_LABELS } from '../data/questions';
import type { QuestionSource, QuestionTopic, QuestionType } from '../types/question';
import { useQuestionStore } from '../store/useQuestionStore';
import { readImageAsDataUrl } from '../utils/questionImport';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function QuestionFormModal({ isOpen, onClose, onCreated }: QuestionFormModalProps) {
  const addQuestion = useQuestionStore((state) => state.addQuestion);

  const [type, setType] = useState<QuestionType>('discursiva');
  const [source, setSource] = useState<QuestionSource>('custom');
  const [topic, setTopic] = useState<QuestionTopic>('processos');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>(['', '', '', '']);
  const [answer, setAnswer] = useState(0);
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [expectedLines, setExpectedLines] = useState(6);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setPrompt('');
    setImageUrl('');
    setImageAlt('');
    setAlternatives(['', '', '', '']);
    setAnswer(0);
    setExpectedAnswer('');
    setExpectedLines(6);
    setExplanation('');
    setError('');
  };

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setImageUrl(dataUrl);
      if (!imageAlt) setImageAlt(file.name.replace(/\.[^.]+$/, ''));
      setError('');
    } catch {
      setError('Não foi possível carregar a imagem selecionada.');
    }
  };

  const updateAlternative = (index: number, value: string) => {
    setAlternatives((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addAlternative = () => {
    if (alternatives.length >= 6) return;
    setAlternatives((prev) => [...prev, '']);
  };

  const removeAlternative = (index: number) => {
    if (alternatives.length <= 2) return;
    setAlternatives((prev) => prev.filter((_, idx) => idx !== index));
    if (answer >= index && answer > 0) {
      setAnswer((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError('Informe o enunciado da questão.');
      return;
    }

    if (type === 'objetiva') {
      const cleanAlternatives = alternatives.map((item) => item.trim()).filter(Boolean);
      if (cleanAlternatives.length < 2) {
        setError('Preencha pelo menos 2 alternativas para questões objetivas.');
        return;
      }
      const safeAnswer = Math.min(answer, cleanAlternatives.length - 1);
      const created = addQuestion({
        type: 'objetiva',
        source,
        topic,
        prompt: trimmedPrompt,
        imageUrl: imageUrl.trim() || undefined,
        imageAlt: imageAlt.trim() || undefined,
        alternatives: cleanAlternatives,
        answer: safeAnswer,
        explanation: explanation.trim(),
      });
      resetForm();
      onCreated?.(created.id);
      onClose();
      return;
    }

    const trimmedExpected = expectedAnswer.trim();
    if (!trimmedExpected) {
      setError('Informe a resposta esperada para que ela apareça no espelho de correção.');
      return;
    }

    const created = addQuestion({
      type: 'discursiva',
      source,
      topic,
      prompt: trimmedPrompt,
      imageUrl: imageUrl.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      alternatives: [],
      answer: -1,
      expectedAnswer: trimmedExpected,
      expectedLines: Math.min(20, Math.max(2, Number(expectedLines) || 6)),
      explanation: explanation.trim(),
    });
    resetForm();
    onCreated?.(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Banco de questões</p>
            <h2 className="mt-0.5 text-xl font-extrabold text-stone-900">Cadastrar nova questão</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
            {([
              { id: 'objetiva', label: 'Objetiva (Múltipla escolha)' },
              { id: 'discursiva', label: 'Discursiva (Com espelho)' },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setType(option.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
                  type === option.id
                    ? 'bg-white text-red-800 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
              Assunto
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as QuestionTopic)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                {Object.entries(TOPIC_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
              Origem
              <select
                value={source}
                onChange={(event) => setSource(event.target.value as QuestionSource)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="custom">Autoral / Docente</option>
                <option value="assunto">Questionário por assunto</option>
                <option value="enade">Estilo ENADE</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
            Enunciado da questão *
            <textarea
              required
              rows={3}
              placeholder="Descreva o problema, cenário ou pergunta..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-700">
                Imagem da questão (opcional)
              </span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-red-300 hover:text-red-800">
                <ImagePlus className="h-3.5 w-3.5" />
                Enviar arquivo
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Ou cole a URL da imagem (https://...)"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Descrição da imagem (alt)"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-red-500"
              />
            </div>
            {imageUrl && (
              <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-2.5">
                <img src={imageUrl} alt={imageAlt || 'Pré-visualização'} className="max-h-40 rounded-lg object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImageAlt('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </button>
              </div>
            )}
          </div>

          {type === 'objetiva' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-600">
                  Alternativas (marque a correta)
                </span>
                {alternatives.length < 6 && (
                  <button
                    type="button"
                    onClick={addAlternative}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar alternativa
                  </button>
                )}
              </div>
              {alternatives.map((alt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-alternative"
                    checked={answer === index}
                    onChange={() => setAnswer(index)}
                    aria-label={`Marcar alternativa ${String.fromCharCode(65 + index)} como correta`}
                    className="h-4 w-4 accent-red-800"
                  />
                  <span className="w-5 text-xs font-bold text-stone-500">
                    {String.fromCharCode(65 + index)})
                  </span>
                  <input
                    type="text"
                    placeholder={`Texto da alternativa ${String.fromCharCode(65 + index)}`}
                    value={alt}
                    onChange={(event) => updateAlternative(index, event.target.value)}
                    className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-red-500"
                  />
                  {alternatives.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeAlternative(index)}
                      aria-label="Remover alternativa"
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <label className="block text-xs font-bold uppercase tracking-wide text-amber-950">
                Resposta esperada / Espelho de correção *
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva a resposta-modelo ou os critérios que aparecerão no espelho do professor..."
                  value={expectedAnswer}
                  onChange={(event) => setExpectedAnswer(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-xs font-semibold text-amber-950">
                <span>Linhas em branco na prova impressa</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={expectedLines}
                  onChange={(event) => setExpectedLines(Number(event.target.value))}
                  className="w-24 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-bold text-stone-800 outline-none focus:border-amber-500"
                />
              </label>
            </div>
          )}

          <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
            Comentário / Explicação (opcional)
            <textarea
              rows={2}
              placeholder="Observação pedagógica exibida após o simulado..."
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-stone-800 outline-none focus:border-red-500"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-900"
            >
              Salvar questão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
