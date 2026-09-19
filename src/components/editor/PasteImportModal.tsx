import React, { useState, useEffect } from 'react';
import { X, Clipboard, CheckCircle2, AlertTriangle, Edit2 } from 'lucide-react';
import { analyzePasteContent } from '../../services/importExport';
import { useApp } from '../../state/AppContext';
import type { Sentence } from '../../types';

interface PasteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSentenceId?: string | null;
}

export const PasteImportModal: React.FC<PasteImportModalProps> = ({
  isOpen,
  onClose,
  targetSentenceId,
}) => {
  const { currentLesson, importSentences, updateSentence } = useApp();
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [editableRows, setEditableRows] = useState<Omit<Sentence, 'id'>[]>([]);

  const parseResult = analyzePasteContent(pasteText);

  // Sync editable rows when pasteText changes
  useEffect(() => {
    setEditableRows(parseResult.sentences);
  }, [pasteText]);

  if (!isOpen || !currentLesson) return null;

  const isSingleTargetMode = Boolean(targetSentenceId);

  const handleApply = () => {
    if (editableRows.length === 0) return;

    if (isSingleTargetMode && targetSentenceId) {
      const first = editableRows[0];
      updateSentence(currentLesson.id, targetSentenceId, {
        hindi: first.hindi,
        pronunciation: first.pronunciation,
        english: first.english,
      });
      onClose();
      setPasteText('');
      return;
    }

    if (
      importMode === 'replace' &&
      !confirm(
        `Are you sure you want to replace all ${currentLesson.sentences.length} existing sentences with these ${editableRows.length} sentences?`
      )
    ) {
      return;
    }

    importSentences(currentLesson.id, editableRows, importMode);
    onClose();
    setPasteText('');
  };

  const handleUpdateRow = (index: number, field: keyof Omit<Sentence, 'id'>, value: string) => {
    setEditableRows((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">
                {isSingleTargetMode ? 'Paste 3 Lines into Sentence' : 'Paste 3 Lines / Multiple Sentences'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Line 1: Hindi • Line 2: Pronunciation (Devanagari) • Line 3: English
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
            <span className="font-bold text-stone-500 font-sans block mb-1">
              {isSingleTargetMode ? 'Paste exactly 3 lines:' : 'Paste 3 lines per sentence (Blank line between groups):'}
            </span>
            मेरा विद्यालय बहुत सुंदर है।<br />
            मेरा विद्यालय बहुत सुन्दर है।<br />
            My school is very beautiful.<br />
            <span className="text-stone-400 text-[10px] italic">
              (Note: Line 2 is Hindi pronunciation in Devanagari — NOT Roman/Hinglish)
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-xs">Paste content below:</label>
            <textarea
              rows={isSingleTargetMode ? 4 : 7}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste exactly 3 lines:\nHindi sentence\nHindi pronunciation in Devanagari\nEnglish sentence`}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Incomplete Warning Banner */}
          {parseResult.warning && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{parseResult.warning}</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 block">
                  Make sure every sentence has all three lines: Hindi, Devanagari Pronunciation, and English.
                </span>
                {parseResult.incompleteGroups.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-white/60 dark:bg-stone-900/60 font-mono text-[10px]">
                    <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">Incomplete Lines Found:</span>
                    {parseResult.incompleteGroups.map((grp, gIdx) => (
                      <div key={gIdx} className="border-t border-stone-200 dark:border-stone-800 pt-1 mt-1">
                        {grp.map((l, lIdx) => (
                          <div key={lIdx}>• {l}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Mode: Append vs Replace (only in lesson import mode) */}
          {!isSingleTargetMode && (
            <div className="flex items-center gap-4 pt-1">
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
          )}

          {/* Live Parsing Preview & In-line Editable Rows */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                {editableRows.length} {editableRows.length === 1 ? 'Sentence Detected' : 'Sentences Detected'}
              </span>
              {editableRows.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to apply
                </span>
              )}
            </div>

            {editableRows.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400 text-xs">
                No complete 3-line sentence groups detected yet. Paste your lines above.
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {editableRows.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-amber-600 font-bold">
                      <span>{idx + 1}. Detected Sentence</span>
                      <span className="text-stone-400 font-sans font-normal flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Editable before import
                      </span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={s.hindi}
                        onChange={(e) => handleUpdateRow(idx, 'hindi', e.target.value)}
                        placeholder="Hindi Sentence"
                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-900 font-semibold text-stone-900 dark:text-stone-100"
                      />
                      <input
                        type="text"
                        value={s.pronunciation}
                        onChange={(e) => handleUpdateRow(idx, 'pronunciation', e.target.value)}
                        placeholder="Hindi Pronunciation (in Devanagari)"
                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-900 text-sky-700 dark:text-sky-400 font-medium"
                      />
                      <input
                        type="text"
                        value={s.english}
                        onChange={(e) => handleUpdateRow(idx, 'english', e.target.value)}
                        placeholder="English Meaning"
                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-900 text-stone-600 dark:text-stone-300"
                      />
                    </div>
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
            disabled={editableRows.length === 0}
            onClick={handleApply}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs shadow-xs transition"
          >
            {isSingleTargetMode
              ? 'Apply to Sentence'
              : `Import ${editableRows.length} ${editableRows.length === 1 ? 'Sentence' : 'Sentences'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
