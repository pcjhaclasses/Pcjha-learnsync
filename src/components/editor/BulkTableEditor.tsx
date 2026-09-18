import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Sentence } from '../../types';

export const BulkTableEditor: React.FC = () => {
  const { currentLesson, bulkUpdateSentences, addSentence } = useApp();

  if (!currentLesson) return null;

  const sentences = currentLesson.sentences;

  const handleCellChange = (
    index: number,
    field: 'hindi' | 'pronunciation' | 'english',
    val: string
  ) => {
    const updated = sentences.map((s, i) => (i === index ? { ...s, [field]: val } : s));
    bulkUpdateSentences(currentLesson.id, updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = sentences.filter((_, i) => i !== index);
    bulkUpdateSentences(currentLesson.id, updated);
  };

  const handleDuplicateRow = (index: number) => {
    const target = sentences[index];
    const newRow: Sentence = {
      ...target,
      id: `sent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...sentences];
    updated.splice(index + 1, 0, newRow);
    bulkUpdateSentences(currentLesson.id, updated);
  };

  return (
    <div className="p-4 sm:p-6 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Table / Bulk Sentence Editor
          </h3>
          <p className="text-xs text-stone-500">
            Rapidly edit sentences in tabular spreadsheet format. Edits automatically synchronize.
          </p>
        </div>
        <button
          onClick={() => addSentence(currentLesson.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Row</span>
        </button>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-stone-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[260px]">1. Hindi Sentence</th>
                <th className="py-2.5 px-3 min-w-[260px]">2. Hindi Pronunciation (Devanagari)</th>
                <th className="py-2.5 px-3 min-w-[260px]">3. English Meaning</th>
                <th className="py-2.5 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {sentences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No sentences in table. Click "+ Add Row" above to start.
                  </td>
                </tr>
              ) : (
                sentences.map((sent, idx) => (
                  <tr
                    key={sent.id}
                    className="hover:bg-amber-50/30 dark:hover:bg-stone-800/30 transition group"
                  >
                    <td className="py-2 px-3 text-center font-mono font-bold text-stone-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={sent.hindi}
                        onChange={(e) => handleCellChange(idx, 'hindi', e.target.value)}
                        placeholder="उदा. मेरा विद्यालय बहुत सुंदर है।"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 bg-transparent focus:bg-white dark:focus:bg-stone-800 focus:outline-none transition"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={sent.pronunciation}
                        onChange={(e) => handleCellChange(idx, 'pronunciation', e.target.value)}
                        placeholder="उदा. मेरा विद्यालय बहुत सुन्दर है।"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-sky-500 bg-transparent focus:bg-white dark:focus:bg-stone-800 focus:outline-none transition text-sky-800 dark:text-sky-300"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={sent.english}
                        onChange={(e) => handleCellChange(idx, 'english', e.target.value)}
                        placeholder="e.g. My school is very beautiful."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 bg-transparent focus:bg-white dark:focus:bg-stone-800 focus:outline-none transition"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDuplicateRow(idx)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
