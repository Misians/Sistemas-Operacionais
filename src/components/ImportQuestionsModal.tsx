import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertCircle, CheckCircle2, Download, FileJson, Upload, X } from 'lucide-react';
import { useQuestionStore } from '../store/useQuestionStore';
import { parseQuestionsFromJson, SAMPLE_QUESTIONS_JSON } from '../utils/questionImport';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: (count: number) => void;
}

export function ImportQuestionsModal({ isOpen, onClose, onImported }: ImportQuestionsModalProps) {
  const addQuestions = useQuestionStore((state) => state.addQuestions);
  const [rawJson, setRawJson] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const parsed = useMemo(() => {
    if (!rawJson.trim()) return null;
    return parseQuestionsFromJson(rawJson);
  }, [rawJson]);

  if (!isOpen) return null;

  const loadFile = async (file: File) => {
    const text = await file.text();
    setRawJson(text);
    setFileName(file.name);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await loadFile(file);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await loadFile(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_QUESTIONS_JSON], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-questoes-so.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!parsed || parsed.valid.length === 0) return;
    const added = addQuestions(parsed.valid);
    setRawJson('');
    setFileName('');
    onImported?.(added.length);
    onClose();
  };

  const objectiveCount = parsed?.valid.filter((q) => q.type === 'objetiva').length ?? 0;
  const discursiveCount = parsed?.valid.filter((q) => q.type === 'discursiva').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Importação em lote</p>
            <h2 className="mt-0.5 text-xl font-extrabold text-stone-900">Importar questões via JSON</h2>
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

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
            <span>Aceita questões objetivas, discursivas (com espelho) e URLs/base64 de imagens.</span>
            <button
              type="button"
              onClick={downloadSample}
              className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-900"
            >
              <Download className="h-3.5 w-3.5" /> Baixar modelo JSON
            </button>
          </div>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? 'border-red-500 bg-red-50/60'
                : 'border-stone-300 bg-stone-50/50 hover:border-red-400 hover:bg-stone-50'
            }`}
          >
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-800">
              {fileName ? <FileJson className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            <p className="text-sm font-bold text-stone-800">
              {fileName ? `Arquivo carregado: ${fileName}` : 'Clique ou arraste um arquivo .json aqui'}
            </p>
            <p className="mt-1 text-xs text-stone-500">Você também pode colar o conteúdo JSON diretamente abaixo.</p>
            <input type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wide text-stone-600">
            Conteúdo JSON
            <textarea
              rows={7}
              placeholder='[{"type":"discursiva","topic":"memoria","prompt":"...","expectedAnswer":"..."}]'
              value={rawJson}
              onChange={(event) => setRawJson(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-950 p-3 font-mono text-xs leading-5 text-stone-100 outline-none focus:border-red-500"
            />
          </label>

          {parsed && (
            <div className="space-y-2.5">
              {parsed.valid.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-bold">
                      {parsed.valid.length} questão(ões) pronta(s) para importar
                    </p>
                    <p className="mt-0.5 text-emerald-800">
                      {objectiveCount} objetiva(s) · {discursiveCount} discursiva(s)
                    </p>
                  </div>
                </div>
              )}
              {parsed.errors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                    <span>Avisos encontrados ({parsed.errors.length})</span>
                  </div>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-900">
                    {parsed.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
              type="button"
              disabled={!parsed || parsed.valid.length === 0}
              onClick={handleImport}
              className="rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Importar {parsed?.valid.length ? `(${parsed.valid.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
