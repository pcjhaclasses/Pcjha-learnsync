import React, { useState } from 'react';
import {
  BookOpen,
  Edit3,
  Play,
  Video,
  Settings,
  HelpCircle,
  Undo2,
  Redo2,
  CheckCircle2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { usePresentation } from '../../state/PresentationContext';

export const Navbar: React.FC = () => {
  const {
    view,
    setView,
    currentChapter,
    currentLesson,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaving,
    lastSaved,
    hasUnsavedRecovery,
    applyRecoveredDraft,
    discardRecoveredDraft,
    searchQuery,
    setSearchQuery,
    searchResults,
    selectChapter,
    selectLesson,
  } = useApp();

  const { setIsHelpOpen, setIsSettingsOpen, startPresentation } = usePresentation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleStartPresenting = () => {
    startPresentation();
    setView('presentation');
  };

  const handleStartRecording = () => {
    setView('recording');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Draft Recovery Alert */}
      {hasUnsavedRecovery && (
        <div className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Unsaved work recovered:</strong> We recovered uncommitted changes from your previous session.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyRecoveredDraft}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded transition"
            >
              Continue with Recovered Work
            </button>
            <button
              onClick={discardRecoveredDraft}
              className="px-2.5 py-1 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 rounded transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setView('library')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="Go to Course Library"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              PC
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-stone-900 dark:text-white tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                PCJha LearnSync
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium tracking-wide mt-1 hidden sm:block truncate">
                Hindi • Pronunciation • English — Learn Word by Word
              </p>
            </div>
          </button>

          {/* Breadcrumb Context */}
          {currentChapter && view === 'editor' && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500 pl-3 border-l border-stone-200 dark:border-stone-800 max-w-[280px] truncate">
              <span className="truncate text-stone-700 dark:text-stone-300 font-medium">{currentChapter.title}</span>
              {currentLesson && (
                <>
                  <span>/</span>
                  <span className="truncate text-stone-500">{currentLesson.title}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search Bar / Modal Toggle */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Hindi, pronunciation, English..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800/70 text-stone-800 dark:text-stone-200 placeholder-stone-400 rounded-lg border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 focus:outline-none transition"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 p-2">
              <div className="flex items-center justify-between pb-1.5 px-2 border-b border-stone-100 dark:border-stone-800 text-[11px] text-stone-400">
                <span>{searchResults.length} matches found</span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="hover:text-stone-600 dark:hover:text-stone-200"
                >
                  Close
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">No matching words or sentences found.</div>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={`${res.sentenceId || res.lessonId}-${i}`}
                    onClick={() => {
                      selectChapter(res.chapterId);
                      selectLesson(res.lessonId);
                      setView('editor');
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800 text-xs transition flex flex-col gap-0.5"
                  >
                    <div className="flex items-center gap-2 text-[10px] text-amber-600 font-semibold uppercase tracking-wider">
                      <span>{res.field} match</span>
                      <span className="text-stone-400">• {res.chapterTitle} / {res.lessonTitle}</span>
                    </div>
                    <div className="font-medium text-stone-800 dark:text-stone-200 line-clamp-1">
                      {res.matchedText}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* View Switchers & Primary Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          {view === 'editor' && (
            <div className="flex items-center bg-stone-100 dark:bg-stone-800/60 rounded-lg p-0.5 border border-stone-200/60 dark:border-stone-700/60 mr-1 hidden sm:flex">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 rounded transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 rounded transition"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* View Nav Tabs */}
          <nav className="flex items-center bg-stone-100 dark:bg-stone-800/80 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700/80 text-xs font-medium">
            <button
              onClick={() => setView('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                view === 'library'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Library</span>
            </button>

            <button
              onClick={() => setView('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                view === 'editor'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              onClick={handleStartPresenting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                view === 'presentation'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="font-semibold">Present</span>
            </button>

            <button
              onClick={handleStartRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                view === 'recording'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Record</span>
            </button>
          </nav>

          {/* Quick Settings & Help */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
            title="Settings & Themes"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
            title="Keyboard Shortcuts & Help (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Autosave Status Badge */}
          <div
            className="hidden xl:flex items-center gap-1 text-[11px] text-stone-400 pl-2 border-l border-stone-200 dark:border-stone-800"
            title={lastSaved ? `Last saved at ${new Date(lastSaved).toLocaleTimeString()}` : 'Autosave active'}
          >
            {isSaving ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-600 font-medium">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
