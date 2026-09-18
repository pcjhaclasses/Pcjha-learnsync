import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowRight, X } from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import { WordHighlightLayer } from './WordHighlight';
import { PresentationControls } from './PresentationControls';

export const PresentationView: React.FC = () => {
  const {
    sentenceIndex,
    isStarted,
    isCompleted,
    presentationConfig,
    nextWord,
    prevWord,
    restart,
    startPresentation,
    wakeControls,
  } = usePresentation();

  const { theme } = useTheme();
  const { currentChapter, currentLesson, setView } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active sentence if required
  useEffect(() => {
    if (presentationConfig.autoScroll !== 'off' && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: presentationConfig.autoScroll === 'smooth' ? 'smooth' : 'auto',
        block: presentationConfig.autoScroll === 'top' ? 'start' : 'center',
      });
    }
  }, [sentenceIndex, presentationConfig.autoScroll]);

  // Click & Right-click navigation
  const handleContentClick = () => {
    nextWord();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    prevWord();
  };

  // Determine container max-width
  let maxWidthStyle = '840px';
  if (presentationConfig.textWidth === 'narrow') maxWidthStyle = '640px';
  else if (presentationConfig.textWidth === 'medium') maxWidthStyle = '840px';
  else if (presentationConfig.textWidth === 'wide') maxWidthStyle = '1100px';
  else if (presentationConfig.textWidth === 'full') maxWidthStyle = '100%';
  else if (presentationConfig.textWidth === 'custom') {
    maxWidthStyle = `${presentationConfig.customMaxWidthPx || 840}px`;
  }

  const sentences = currentLesson?.sentences || [];
  const currentSentence = sentences[sentenceIndex];
  const progressPercent = sentences.length > 0 ? Math.round(((sentenceIndex + 1) / sentences.length) * 100) : 0;

  // 1. CHAPTER INTRO COVER SCREEN
  if (presentationConfig.showIntroCover && !isStarted && currentChapter) {
    return (
      <div
        style={{ backgroundColor: theme.bg, color: theme.hindiText }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 select-none transition-colors"
      >
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="space-y-2">
            <span
              style={{ color: theme.secondary }}
              className="text-xs font-bold uppercase tracking-widest block"
            >
              Chapter {String(currentChapter.chapterNumber || 1).padStart(2, '0')}
            </span>
            <h1
              style={{ color: theme.hindiText }}
              className="text-4xl sm:text-5xl font-black tracking-tight"
            >
              {currentChapter.title}
            </h1>
            {currentChapter.subtitle && (
              <p style={{ color: theme.secondary }} className="text-lg font-medium">
                {currentChapter.subtitle}
              </p>
            )}
          </div>

          {currentLesson && (
            <div
              style={{ borderColor: theme.divider, color: theme.pronunciationText }}
              className="inline-block px-4 py-1.5 rounded-full border text-xs font-semibold"
            >
              {currentLesson.title} • {currentLesson.sentences.length} Sentences
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={startPresentation}
              className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xl hover:scale-105 transition transform flex items-center gap-2.5 mx-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Lesson</span>
            </button>
          </div>

          <div className="pt-10">
            <span
              style={{ color: theme.secondary }}
              className="text-[11px] font-semibold tracking-wider uppercase opacity-60"
            >
              PCJha LearnSync — Hindi • Pronunciation • English
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. LESSON COMPLETION SCREEN
  if (presentationConfig.showCompletionScreen && isCompleted) {
    return (
      <div
        style={{ backgroundColor: theme.bg, color: theme.hindiText }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 select-none transition-colors"
      >
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-stone-200/40 dark:border-stone-800 shadow-2xl bg-white/40 dark:bg-stone-900/40 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Lesson Complete!</h2>
            <p style={{ color: theme.secondary }} className="text-xs">
              All {sentences.length} sentences completed successfully.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={restart}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Lesson</span>
            </button>
            <button
              onClick={() => setView('editor')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Back to Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN PRESENTATION STAGE
  return (
    <div
      onMouseMove={wakeControls}
      onClick={handleContentClick}
      onContextMenu={handleContextMenu}
      style={{ backgroundColor: theme.bg, color: theme.hindiText }}
      className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto select-none transition-colors cursor-pointer"
    >
      {/* Top Header / Chapter Meta */}
      <div className="p-6 sm:p-8 flex items-center justify-between text-xs flex-shrink-0">
        <div className="space-y-0.5">
          <span
            style={{ color: theme.secondary }}
            className="font-bold text-[11px] uppercase tracking-widest block"
          >
            {currentChapter?.title || 'Chapter'}
          </span>
          {currentLesson && (
            <span style={{ color: theme.secondary }} className="text-[12px] opacity-80">
              {currentLesson.title}
            </span>
          )}
        </div>

        {/* Optional Top Progress Bar */}
        {presentationConfig.progressPosition === 'top' && (
          <div className="flex items-center gap-3">
            <div className="w-36 h-1 rounded-full bg-stone-200/50 dark:bg-stone-800 overflow-hidden">
              <div
                style={{ width: `${progressPercent}%`, backgroundColor: theme.progressBar }}
                className="h-full transition-all duration-300"
              />
            </div>
            {presentationConfig.showPercent && (
              <span style={{ color: theme.secondary }} className="font-mono text-[11px] font-bold">
                {progressPercent}%
              </span>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setView('editor');
          }}
          style={{ color: theme.secondary }}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
          title="Exit Presentation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Presentation Stage */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 my-auto"
      >
        <div
          style={{
            maxWidth: maxWidthStyle,
            textAlign: presentationConfig.alignment,
          }}
          className="w-full px-4 space-y-6 sm:space-y-8"
        >
          {currentSentence ? (
            <>
              {/* Layer 1: Hindi Sentence */}
              <WordHighlightLayer layer="hindi" text={currentSentence.hindi} />

              {/* Layer 2: Hindi Pronunciation (Devanagari) */}
              <WordHighlightLayer layer="pronunciation" text={currentSentence.pronunciation} />

              {/* Layer 3: English Sentence */}
              <WordHighlightLayer layer="english" text={currentSentence.english} />
            </>
          ) : (
            <div className="text-center opacity-40">No sentences found in this lesson.</div>
          )}
        </div>
      </div>

      {/* Bottom Progress & Branding */}
      <div className="p-6 sm:p-8 flex flex-col items-center gap-2 flex-shrink-0 pb-20 sm:pb-24">
        {/* Bottom Progress Bar */}
        {presentationConfig.progressPosition === 'bottom' && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-48 sm:w-64 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                style={{ width: `${progressPercent}%`, backgroundColor: theme.progressBar }}
                className="h-full transition-all duration-300"
              />
            </div>
            <div
              style={{ color: theme.secondary }}
              className="font-mono text-xs font-bold tracking-wider"
            >
              {String(sentenceIndex + 1).padStart(2, '0')} / {String(sentences.length).padStart(2, '0')}
              {presentationConfig.showPercent && ` • ${progressPercent}%`}
            </div>
          </div>
        )}

        {/* Subtle Branding Tagline */}
        <span
          style={{ color: theme.secondary }}
          className="text-[10px] tracking-wider uppercase font-semibold opacity-40 select-none pointer-events-none"
        >
          PCJha LearnSync
        </span>
      </div>

      {/* Floating Presentation Controls */}
      <PresentationControls onExit={() => setView('editor')} />
    </div>
  );
};
