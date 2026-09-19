import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Clipboard,
  FileSpreadsheet,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { useApp } from '../../state/AppContext';
import type { Sentence } from '../../types';

type ImportTab = 'csv' | 'paste' | 'docx';

interface ParsedRow {
  hindi: string;
  pronunciation: string;
  english: string;
}

export const ImportCenterView: React.FC = () => {
  const { currentChapter, activeLessonId, importSentences, addLesson, setView } = useApp();

  const [activeTab, setActiveTab] = useState<ImportTab>('csv');
  const [importMode, setImportMode] = useState<'append' | 'replace' | 'newLesson'>('append');
  const [newLessonTitle, setNewLessonTitle] = useState<string>('आयातित पाठ (Imported Lesson)');

  // Paste state
  const [pasteText, setPasteText] = useState<string>(
    `वह रोज सुबह पढ़ता है।
वह रोज़ सुबह पढ़ता है।
He studies every morning.

वे स्कूल जा रहे हैं।
वे स्कूल जा रहे हैं।
They are going to school.`
  );

  // CSV State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
  const [colHindi, setColHindi] = useState<number>(0);
  const [colPron, setColPron] = useState<number>(1);
  const [colEng, setColEng] = useState<number>(2);

  // Extracted preview rows
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Parse Smart Paste
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: ParsedRow[] = [];

    // Check if lines have tabs or pipes
    const firstLine = lines[0] || '';
    if (firstLine.includes('\t') || firstLine.includes('|')) {
      const delimiter = firstLine.includes('\t') ? '\t' : '|';
      lines.forEach((line) => {
        const parts = line.split(delimiter).map((p) => p.trim());
        if (parts.length >= 2) {
          rows.push({
            hindi: parts[0] || '',
            pronunciation: parts[1] || parts[0] || '',
            english: parts[2] || '',
          });
        }
      });
    } else {
      // 3-line alternating format
      for (let i = 0; i < lines.length; i += 3) {
        rows.push({
          hindi: lines[i] || '',
          pronunciation: lines[i + 1] || lines[i] || '',
          english: lines[i + 2] || '',
        });
      }
    }

    setPreviewRows(rows);
    setStatusMessage({ type: 'success', text: `Parsed ${rows.length} sentences from pasted text.` });
  };

  // CSV File Handler
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) return;

      // Detect delimiter: comma, semicolon, tab
      const sample = lines[0];
      let sep = ',';
      if (sample.includes('\t')) sep = '\t';
      else if (sample.includes(';') && !sample.includes(',')) sep = ';';

      const splitLine = (l: string) => l.split(sep).map((s) => s.replace(/^["']|["']$/g, '').trim());

      const headers = splitLine(lines[0]);
      const dataRows = lines.slice(1).map(splitLine);

      setCsvHeaders(headers);
      setCsvDataRows(dataRows);

      // Auto-detect columns by header names
      headers.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (lower.includes('hindi') || lower.includes('हिंदी')) setColHindi(idx);
        else if (lower.includes('pron') || lower.includes('उच्चारण')) setColPron(idx);
        else if (lower.includes('eng') || lower.includes('अंग्रेजी')) setColEng(idx);
      });

      // Populate preview with first rows
      const parsed: ParsedRow[] = dataRows.map((r) => ({
        hindi: r[colHindi] || r[0] || '',
        pronunciation: r[colPron] || r[1] || r[0] || '',
        english: r[colEng] || r[2] || '',
      }));
      setPreviewRows(parsed);
      setStatusMessage({ type: 'success', text: `Loaded CSV with ${dataRows.length} rows.` });
    };
    reader.readAsText(file);
  };

  // Update CSV mapped columns
  const updateCsvMapping = (hIdx: number, pIdx: number, eIdx: number) => {
    setColHindi(hIdx);
    setColPron(pIdx);
    setColEng(eIdx);
    const parsed: ParsedRow[] = csvDataRows.map((r) => ({
      hindi: r[hIdx] || '',
      pronunciation: r[pIdx] || '',
      english: r[eIdx] || '',
    }));
    setPreviewRows(parsed);
  };

  // DOCX File Handler with JSZip
  const handleDocxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const docXmlFile = zip.file('word/document.xml');
      if (!docXmlFile) throw new Error('Invalid Word document: document.xml not found.');

      const xmlContent = await docXmlFile.async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const paragraphs = xmlDoc.getElementsByTagName('w:p');

      const extractedLines: string[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const texts = paragraphs[i].getElementsByTagName('w:t');
        let pText = '';
        for (let j = 0; j < texts.length; j++) {
          pText += texts[j].textContent || '';
        }
        if (pText.trim()) {
          extractedLines.push(pText.trim());
        }
      }

      // Group into 3-line educational sets
      const rows: ParsedRow[] = [];
      for (let i = 0; i < extractedLines.length; i += 3) {
        rows.push({
          hindi: extractedLines[i] || '',
          pronunciation: extractedLines[i + 1] || extractedLines[i] || '',
          english: extractedLines[i + 2] || '',
        });
      }

      setPreviewRows(rows);
      setStatusMessage({
        type: 'success',
        text: `Successfully parsed ${rows.length} sentences from Word DOCX file.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not parse .docx file.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (previewRows.length === 0) {
      alert('No sentences to import. Please parse content first.');
      return;
    }

    const sentencesToImport: Omit<Sentence, 'id'>[] = previewRows.map((r, idx) => ({
      order: idx,
      hindi: r.hindi,
      pronunciation: r.pronunciation || r.hindi,
      english: r.english,
    }));

    if (importMode === 'newLesson') {
      if (!currentChapter) return;
      const createdLessonId = addLesson(currentChapter.id, newLessonTitle);
      importSentences(createdLessonId, sentencesToImport, 'replace');
    } else {
      importSentences(activeLessonId, sentencesToImport, importMode);
    }

    alert(`Successfully imported ${sentencesToImport.length} sentences!`);
    setView('editor');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 border-b border-stone-800 bg-stone-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <div className="h-4 w-px bg-stone-800" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Universal Import Center</h1>
              <p className="text-[11px] text-stone-400">
                Import sentences via CSV, Paste, or Word DOCX
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'csv' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / TSV</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'paste' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Smart Paste</span>
          </button>
          <button
            onClick={() => setActiveTab('docx')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'docx' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word DOCX</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/40 border-red-800/80 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: CSV / TSV */}
        {activeTab === 'csv' && (
          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Upload & Map Spreadsheet (CSV / TSV)</h2>
              <p className="text-xs text-stone-400">
                Upload a delimited file and choose which columns contain Hindi, Pronunciation, and English.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition">
                <Upload className="w-4 h-4" />
                <span>Select CSV File</span>
                <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvFile} className="hidden" />
              </label>

              {csvDataRows.length > 0 && (
                <span className="text-xs text-stone-400 font-mono">
                  {csvDataRows.length} data rows loaded
                </span>
              )}
            </div>

            {/* Column Mapping Selector */}
            {csvHeaders.length > 0 && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 block mb-1">Hindi Column</label>
                  <select
                    value={colHindi}
                    onChange={(e) => updateCsvMapping(parseInt(e.target.value), colPron, colEng)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 block mb-1">
                    Pronunciation Column
                  </label>
                  <select
                    value={colPron}
                    onChange={(e) => updateCsvMapping(colHindi, parseInt(e.target.value), colEng)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 block mb-1">English Column</label>
                  <select
                    value={colEng}
                    onChange={(e) => updateCsvMapping(colHindi, colPron, parseInt(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SMART PASTE */}
        {activeTab === 'paste' && (
          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Smart Paste Parser</h2>
              <p className="text-xs text-stone-400">
                Paste lines in alternating 3-line blocks (Hindi, Pronunciation, English) or tab/pipe separated lines.
              </p>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-200 focus:outline-hidden focus:border-amber-500 leading-relaxed"
              placeholder="Paste your sentences here..."
            />

            <button
              onClick={handleParsePaste}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse Pasted Content</span>
            </button>
          </div>
        )}

        {/* TAB 3: DOCX PARSER */}
        {activeTab === 'docx' && (
          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Microsoft Word (.docx) Extraction</h2>
              <p className="text-xs text-stone-400">
                Reads XML paragraphs directly in browser via client-side zip extraction. 100% privacy-safe.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition">
              <Upload className="w-4 h-4" />
              <span>{isLoading ? 'Extracting...' : 'Select .docx File'}</span>
              <input
                type="file"
                accept=".docx"
                onChange={handleDocxFile}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* PREVIEW & IMPORT CONFIRMATION */}
        {previewRows.length > 0 && (
          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Preview Extracted Sentences ({previewRows.length})
                </h3>
                <p className="text-xs text-stone-400">Verify and choose import target</p>
              </div>

              {/* Import Target Destination */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      importMode === 'append' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Append to Lesson
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      importMode === 'replace' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Replace All
                  </button>
                  <button
                    onClick={() => setImportMode('newLesson')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      importMode === 'newLesson' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Create New Lesson
                  </button>
                </div>

                {importMode === 'newLesson' && (
                  <input
                    type="text"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Lesson Title"
                    className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                  />
                )}

                <button
                  onClick={handleExecuteImport}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Import</span>
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-500 sticky top-0 border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4 font-hindi">1. Hindi</th>
                    <th className="py-2.5 px-4 font-hindi">2. Pronunciation (Devanagari)</th>
                    <th className="py-2.5 px-4">3. English</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {previewRows.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-800/40">
                      <td className="py-2.5 px-4 font-mono text-stone-500">{i + 1}</td>
                      <td className="py-2.5 px-4 font-hindi font-medium text-white">{r.hindi}</td>
                      <td className="py-2.5 px-4 font-hindi text-amber-300">{r.pronunciation}</td>
                      <td className="py-2.5 px-4 text-stone-300">{r.english}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
