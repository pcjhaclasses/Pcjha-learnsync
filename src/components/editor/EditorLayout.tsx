import React, { useState } from 'react';
import {
  Layers,
  Table,
  ClipboardPaste,
  FileSpreadsheet,
  FileCode,
  Eye,
  Edit3,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useTheme } from '../../state/ThemeContext';
import { ChapterHeader } from './ChapterHeader';
import { LessonSidebar } from './LessonSidebar';
import { SentenceList } from './SentenceList';
import { BulkTableEditor } from './BulkTableEditor';
import { PasteImportModal } from './PasteImportModal';
import { CsvImportModal } from './CsvImportModal';
import { LivePreview } from './LivePreview';
import { exportStandaloneHTML, downloadFile } from '../../services/importExport';

export const EditorLayout: React.FC = () => {
  const { currentChapter, currentLesson, editorSubTab, setEditorSubTab } = useApp();
  const { theme, typography } = useTheme();

  // Mobile view switch between Editor and Preview
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleExportHTML = () => {
    if (!currentChapter || !currentLesson) return;
    const html = exportStandaloneHTML(currentChapter, currentLesson, theme, typography);
    downloadFile(html, `PCJha-Presentation-${currentChapter.title}-${currentLesson.title}.html`, 'text/html');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mobile Top Tab Switcher */}
      <div className="lg:hidden flex items-center border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2 text-xs font-semibold">
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mx-auto">
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              mobileTab === 'editor'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              mobileTab === 'preview'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Main Two-Panel Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Editor & Content Management */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-full border-r border-stone-200 dark:border-stone-800 ${
            mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Chapter Header */}
          <ChapterHeader />

          {/* Subheader Toolbar: Sub-tabs + Import/Export Actions */}
          <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/40 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
            {/* View Subtabs */}
            <div className="flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-xl font-medium">
              <button
                onClick={() => setEditorSubTab('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  editorSubTab === 'cards'
                    ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Card Editor</span>
              </button>
              <button
                onClick={() => setEditorSubTab('bulk')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  editorSubTab === 'bulk'
                    ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table / Bulk Edit</span>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition"
                title="Paste 3 lines per sentence"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Paste Import</span>
              </button>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition"
                title="Upload or paste CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV Import</span>
              </button>
              <button
                onClick={handleExportHTML}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 transition"
                title="Export Standalone HTML presentation"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Export HTML</span>
              </button>
            </div>
          </div>

          {/* Editor Body: Sidebar + Main List/Table */}
          <div className="flex-1 flex overflow-hidden">
            {/* Lesson Sidebar */}
            <LessonSidebar />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-stone-50/40 dark:bg-stone-950/40">
              {editorSubTab === 'cards' ? <SentenceList /> : <BulkTableEditor />}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview (Desktop Always Visible, Mobile via Tab) */}
        <div
          className={`w-full lg:w-[460px] xl:w-[540px] 2xl:w-[600px] h-full flex-shrink-0 ${
            mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <LivePreview />
        </div>
      </div>

      {/* Modals */}
      <PasteImportModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} />
      <CsvImportModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
    </div>
  );
};
