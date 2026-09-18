import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import { WordHighlightLayer } from '../presentation/WordHighlight';

export const LivePreview: React.FC = () => {
  const {
    sentenceIndex,
    nextWord,
    prevWord,
    goToSentence,
    restart,
    togglePlayPause,
    isPlaying,
    isPaused,
    timing,
    presentationConfig,
  } = usePresentation();

  const { theme, typography } = useTheme();
  const { currentLesson, setView } = useApp();

  const [previewMode, setPreviewMode] = useState<'interactive' | 'static'>('interactive');

  const sentences = currentLesson?.sentences || [];
  const currentSentence = sentences[sentenceIndex] || sentences[0];

  return (
    <div className="flex flex-col h-full bg-stone-100/70 dark:bg-stone-950/70 border-l border-stone-200 dark:border-stone-800">
      {/* Live Preview Header Toolbar */}
      <div className="px-4 py-2.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Live Preview</span>
          </div>

          {/* Mode Switch: Static vs Interactive */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 text-[11px] font-medium ml-2">
            <button
              onClick={() => setPreviewMode('interactive')}
              className={`px-2 py-1 rounded-md transition ${
                previewMode === 'interactive'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Interactive
            </button>
            <button
              onClick={() => setPreviewMode('static')}
              className={`px-2 py-1 rounded-md transition ${
                previewMode === 'static'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Static
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Open Fullscreen Presentation */}
          <button
            onClick={() => setView('presentation')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 transition"
            title="Launch Full Presentation"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Present</span>
          </button>
        </div>
      </div>

      {/* Preview Stage Container */}
      <div
        style={{ backgroundColor: theme.bg, color: theme.hindiText }}
        className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto select-none transition-colors"
      >
        {/* Top Info inside stage */}
        <div className="flex items-center justify-between text-xs opacity-60">
          <span className="font-mono text-[11px]">
            Sentence {String(sentenceIndex + 1).padStart(2, '0')} of {sentences.length}
          </span>
          <span className="text-[11px] uppercase tracking-wider font-semibold">
            {theme.name} Theme
          </span>
        </div>

        {/* Center Stage Text */}
        <div
          onClick={() => {
            if (previewMode === 'interactive') nextWord();
          }}
          onContextMenu={(e) => {
            if (previewMode === 'interactive') {
              e.preventDefault();
              prevWord();
            }
          }}
          className={`my-auto max-w-xl mx-auto w-full space-y-4 py-8 ${
            previewMode === 'interactive' ? 'cursor-pointer' : ''
          }`}
          style={{ textAlign: presentationConfig.alignment }}
        >
          {currentSentence ? (
            previewMode === 'interactive' ? (
              <>
                <WordHighlightLayer layer="hindi" text={currentSentence.hindi} />
                <WordHighlightLayer layer="pronunciation" text={currentSentence.pronunciation} />
                <WordHighlightLayer layer="english" text={currentSentence.english} />
              </>
            ) : (
              // Static Preview: All three layers displayed normally
              <div className="space-y-4">
                <div
                  style={{
                    fontFamily: typography.hindi.fontFamily,
                    fontSize: `${Math.min(36, typography.hindi.fontSize)}px`,
                    fontWeight: typography.hindi.fontWeight,
                    lineHeight: typography.hindi.lineHeight,
                    color: theme.hindiText,
                  }}
                >
                  {currentSentence.hindi}
                </div>
                <div
                  style={{
                    fontFamily: typography.pronunciation.fontFamily,
                    fontSize: `${Math.min(30, typography.pronunciation.fontSize)}px`,
                    fontWeight: typography.pronunciation.fontWeight,
                    lineHeight: typography.pronunciation.lineHeight,
                    color: theme.pronunciationText,
                  }}
                >
                  {currentSentence.pronunciation}
                </div>
                <div
                  style={{
                    fontFamily: typography.english.fontFamily,
                    fontSize: `${Math.min(24, typography.english.fontSize)}px`,
                    fontWeight: typography.english.fontWeight,
                    lineHeight: typography.english.lineHeight,
                    color: theme.englishText,
                  }}
                >
                  {currentSentence.english}
                </div>
              </div>
            )
          ) : (
            <div className="text-center opacity-40 text-xs">No sentences to preview.</div>
          )}
        </div>

        {/* Bottom Interactive Mini-Controls */}
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-black/5 dark:border-white/5">
          {previewMode === 'interactive' ? (
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-xl text-xs">
              <button
                onClick={prevWord}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                title="Previous Word"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded font-semibold flex items-center gap-1"
                title={timing.useAutoTiming ? 'Play / Pause' : 'Enable Auto Timing in Settings'}
              >
                {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button
                onClick={nextWord}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                title="Next Word"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-stone-300 dark:bg-stone-600 mx-1" />
              <button
                onClick={restart}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <button
                disabled={sentenceIndex === 0}
                onClick={() => goToSentence(sentenceIndex - 1)}
                className="p-1 rounded hover:bg-black/10 disabled:opacity-20"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px]">
                {sentenceIndex + 1} / {sentences.length}
              </span>
              <button
                disabled={sentenceIndex === sentences.length - 1}
                onClick={() => goToSentence(sentenceIndex + 1)}
                className="p-1 rounded hover:bg-black/10 disabled:opacity-20"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="text-[10px] opacity-50 text-center">
            {previewMode === 'interactive'
              ? 'Click anywhere on the preview box to advance word by word'
              : 'Static Preview displays full sentences without active highlighting'}
          </div>
        </div>
      </div>
    </div>
  );
};
