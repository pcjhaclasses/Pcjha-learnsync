import React, { useState } from 'react';
import {
  FolderPlus,
  Play,
  Copy,
  Trash2,
  FileCode,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  FileText,
  Search,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import {
  downloadFile,
  exportToCSV,
  exportStandaloneHTML,
} from '../../services/importExport';

export const LibraryView: React.FC = () => {
  const {
    currentCourse,
    selectChapter,
    selectLesson,
    setView,
    addChapter,
    duplicateChapter,
    deleteChapter,
  } = useApp();

  const { startPresentation } = usePresentation();
  const { theme, typography } = useTheme();
  const [filterQuery, setFilterQuery] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);

  const chapters = currentCourse?.chapters || [];

  const filteredChapters = chapters.filter((ch) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      (ch.subtitle && ch.subtitle.toLowerCase().includes(q)) ||
      (ch.subject && ch.subject.toLowerCase().includes(q)) ||
      ch.lessons.some((l) => l.title.toLowerCase().includes(q))
    );
  });

  const handleOpenChapter = (chapterId: string, lessonId?: string) => {
    selectChapter(chapterId);
    if (lessonId) {
      selectLesson(lessonId);
    }
    setView('editor');
  };

  const handlePresentChapter = (chapterId: string, lessonId?: string) => {
    selectChapter(chapterId);
    if (lessonId) {
      selectLesson(lessonId);
    }
    startPresentation();
    setView('presentation');
  };

  const handleCreateNewChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newChapterTitle.trim() || 'नया अध्याय (New Chapter)';
    const newId = addChapter(title);
    setNewChapterTitle('');
    setIsCreatingChapter(false);
    selectChapter(newId);
    setView('editor');
  };

  const handleExportChapterJSON = (chapterId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    if (!ch) return;
    const jsonStr = JSON.stringify(ch, null, 2);
    downloadFile(jsonStr, `PCJha-Chapter-${ch.title}.json`, 'application/json');
  };

  const handleExportChapterCSV = (chapterId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    if (!ch || ch.lessons.length === 0) return;
    const allSentences = ch.lessons.flatMap((l) => l.sentences);
    const csvStr = exportToCSV(allSentences);
    downloadFile(csvStr, `PCJha-${ch.title}-sentences.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportChapterHTML = (chapterId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    if (!ch || ch.lessons.length === 0) return;
    const lesson = ch.lessons[0];
    const htmlStr = exportStandaloneHTML(ch, lesson, theme, typography);
    downloadFile(htmlStr, `PCJha-Presentation-${ch.title}.html`, 'text/html');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Course Library & Lessons
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
              {chapters.length} Chapters
            </span>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage your Hindi educational chapters, lessons, and word-by-word presentation decks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreatingChapter(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Chapter</span>
          </button>
        </div>
      </div>

      {/* Inline Create Chapter Form Modal / Drawer */}
      {isCreatingChapter && (
        <form
          onSubmit={handleCreateNewChapter}
          className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-900 border border-amber-200/80 dark:border-amber-800/50 shadow-sm flex flex-col sm:flex-row items-center gap-3 animate-in fade-in"
        >
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
              New Chapter Title (Devanagari or English)
            </label>
            <input
              type="text"
              placeholder="e.g. अध्याय २: हमारा पर्यावरण (Our Environment)"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Create Chapter
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingChapter(false)}
              className="px-3 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter / Search within Library */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter chapters by title, subject, or lesson..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Chapter Cards Grid */}
      {filteredChapters.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
          <Layers className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">No chapters match your search</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or create a new chapter above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter, index) => {
            const totalSentences = chapter.lessons.reduce((acc, l) => acc + l.sentences.length, 0);

            return (
              <div
                key={chapter.id}
                className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top / Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-bold text-amber-600 uppercase tracking-wider text-[10px]">
                      Chapter {String(chapter.chapterNumber || index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {new Date(chapter.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {chapter.title}
                    </h3>
                    {chapter.subtitle && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{chapter.subtitle}</p>
                    )}
                  </div>

                  {chapter.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {chapter.description}
                    </p>
                  )}

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                      <Layers className="w-3 h-3 text-stone-400" />
                      {chapter.lessons.length} {chapter.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                      <FileText className="w-3 h-3 text-stone-400" />
                      {totalSentences} {totalSentences === 1 ? 'Sentence' : 'Sentences'}
                    </span>
                    {chapter.subject && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                        {chapter.subject}
                      </span>
                    )}
                  </div>

                  {/* Lessons list preview */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Lessons inside chapter:
                    </span>
                    {chapter.lessons.slice(0, 3).map((less) => (
                      <button
                        key={less.id}
                        onClick={() => handleOpenChapter(chapter.id, less.id)}
                        className="w-full text-left text-xs py-1 px-1.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800/60 flex items-center justify-between text-stone-700 dark:text-stone-300 font-medium transition"
                      >
                        <span className="truncate">{less.title}</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {less.sentences.length} sents
                        </span>
                      </button>
                    ))}
                    {chapter.lessons.length > 3 && (
                      <span className="text-[10px] text-stone-400 italic pl-1.5">
                        +{chapter.lessons.length - 3} more lessons
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-stone-50/80 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportChapterJSON(chapter.id)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded transition"
                      title="Export Chapter JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExportChapterCSV(chapter.id)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded transition"
                      title="Export Chapter Sentences as CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleExportChapterHTML(chapter.id)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded transition"
                      title="Export Standalone HTML Presentation"
                    >
                      <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    <button
                      onClick={() => duplicateChapter(chapter.id)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded transition"
                      title="Duplicate Chapter"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {chapters.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete chapter "${chapter.title}"?`)) {
                            deleteChapter(chapter.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePresentChapter(chapter.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold rounded-lg hover:bg-stone-800 transition"
                      title="Present Chapter Word by Word"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Present</span>
                    </button>
                    <button
                      onClick={() => handleOpenChapter(chapter.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition"
                    >
                      Open Editor
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
