import React, { useState } from 'react';
import { X, Clipboard, CheckCircle2 } from 'lucide-react';
import { parsePasteSentences } from '../../services/importExport';
import { useApp } from '../../state/AppContext';
import type { Sentence } from '../../types';

interface PasteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasteImportModal: React.FC<PasteImportModalProps> = ({ isOpen, onClose }) => {
  const { currentLesson, importSentences } = useApp();
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen || !currentLesson) return null;

  const parsedSentences: Omit<Sentence, 'id'>[] = parsePasteSentences(pasteText);

  const handleApply = () => {
    if (parsedSentences.length === 0) return;
    if (
      importMode === 'replace' &&
      !confirm(
        `Are you sure you want to replace all ${currentLesson.sentences.length} existing sentences with these ${parsedSentences.length} sentences?`
      )
    ) {
      return;
    }
    importSentences(currentLesson.id, parsedSentences, importMode);
    onClose();
    setPasteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Paste Multiple Sentences</h2>
              <p className="text-xs text-stone-500 mt-1">
                Paste 3 lines per sentence: Hindi, Pronunciation (Devanagari), English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Format Explanation */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 font-mono text-[11px] leading-relaxed text-stone-700 dark:text-stone-300">
            <span className="font-bold text-stone-500 font-sans block mb-1">Expected 3-line format:</span>
            मेरा विद्यालय बहुत सुंदर है।<br />
            मेरा विद्यालय बहुत सुन्दर है।<br />
            My school is very beautiful.<br />
            <span className="text-stone-400 text-[10px] italic">(Blank line between sentences)</span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-xs">Paste content below:</label>
            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your sentences here..."
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>

          {/* Import Mode: Append vs Replace */}
          <div className="flex items-center gap-4 pt-2">
            <span className="font-semibold text-stone-600 dark:text-stone-400">Import Action:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pasteMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>Append to existing ({currentLesson.sentences.length}) sentences</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pasteMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-red-600 dark:text-red-400 font-medium">Replace existing sentences</span>
            </label>
          </div>

          {/* Live Parsing Preview */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                Parsed Sentences Preview ({parsedSentences.length})
              </span>
              {parsedSentences.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to import
                </span>
              )}
            </div>

            {parsedSentences.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400 text-xs">
                No complete 3-line sentence groups detected yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedSentences.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-xs space-y-0.5"
                  >
                    <div className="font-mono text-[10px] text-amber-600 font-bold">
                      Sentence {idx + 1}
                    </div>
                    <div className="font-semibold text-stone-900 dark:text-stone-100">{s.hindi}</div>
                    <div className="text-sky-700 dark:text-sky-400">{s.pronunciation}</div>
                    <div className="text-stone-500 dark:text-stone-400">{s.english}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 rounded-xl font-medium text-xs transition"
          >
            Cancel
          </button>
          <button
            disabled={parsedSentences.length === 0}
            onClick={handleApply}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs shadow-xs transition"
          >
            Import {parsedSentences.length} {parsedSentences.length === 1 ? 'Sentence' : 'Sentences'}
          </button>
        </div>
      </div>
    </div>
  );
};
