import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import { parseCSV } from '../../services/importExport';
import { useApp } from '../../state/AppContext';
import type { Sentence } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { currentLesson, importSentences } = useApp();
  const [csvContent, setCsvContent] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen || !currentLesson) return null;

  const parsedSentences: Omit<Sentence, 'id'>[] = parseCSV(csvContent);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (parsedSentences.length === 0) return;
    if (
      importMode === 'replace' &&
      !confirm(
        `Are you sure you want to replace all ${currentLesson.sentences.length} existing sentences with these ${parsedSentences.length} CSV sentences?`
      )
    ) {
      return;
    }
    importSentences(currentLesson.id, parsedSentences, importMode);
    onClose();
    setCsvContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Import Sentences from CSV</h2>
              <p className="text-xs text-stone-500 mt-1">
                Upload a .csv file or paste CSV text (Hindi, Hindi Pronunciation, English)
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
          {/* File Upload Trigger */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40">
            <div>
              <span className="font-semibold block text-xs">Upload .csv spreadsheet file</span>
              <span className="text-[11px] text-stone-500">Supports standard UTF-8 CSV with quotes and commas</span>
            </div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-medium cursor-pointer hover:bg-stone-800 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose CSV File</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-xs">Or paste raw CSV text:</label>
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Hindi,Hindi Pronunciation,English&#10;&quot;मेरा विद्यालय बहुत सुंदर है।&quot;,&quot;मेरा विद्यालय बहुत सुन्दर है।&quot;,&quot;My school is very beautiful.&quot;"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Import Mode */}
          <div className="flex items-center gap-4 pt-1">
            <span className="font-semibold text-stone-600 dark:text-stone-400">Import Action:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="csvMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Append to existing ({currentLesson.sentences.length}) sentences</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="csvMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-red-600 dark:text-red-400 font-medium">Replace existing sentences</span>
            </label>
          </div>

          {/* Parsed Rows Preview */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                CSV Data Preview ({parsedSentences.length} rows)
              </span>
              {parsedSentences.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                </span>
              )}
            </div>

            {parsedSentences.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400 text-xs">
                No CSV rows parsed yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {parsedSentences.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-xs grid grid-cols-3 gap-2"
                  >
                    <div className="truncate font-semibold text-stone-900 dark:text-stone-100">{s.hindi}</div>
                    <div className="truncate text-sky-700 dark:text-sky-400">{s.pronunciation}</div>
                    <div className="truncate text-stone-500 dark:text-stone-400">{s.english}</div>
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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs shadow-xs transition"
          >
            Import {parsedSentences.length} {parsedSentences.length === 1 ? 'Sentence' : 'Sentences'}
          </button>
        </div>
      </div>
    </div>
  );
};
