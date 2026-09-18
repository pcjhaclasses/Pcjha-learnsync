import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useApp } from '../../state/AppContext';

interface PresentationControlsProps {
  onExit?: () => void;
}

export const PresentationControls: React.FC<PresentationControlsProps> = ({ onExit }) => {
  const {
    sentenceIndex,
    isPlaying,
    isPaused,
    isSectionPaused,
    pauseLabel,
    timing,
    presentationConfig,
    nextWord,
    prevWord,
    restart,
    togglePlayPause,
    areControlsVisible,
    setIsHelpOpen,
    setIsSettingsOpen,
  } = usePresentation();

  const { currentLesson, setView } = useApp();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setView('editor');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;

  const totalSentences = currentLesson?.sentences.length || 0;
  const showButtons = presentationConfig.showControlButtons;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto ${
        areControlsVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Section Pause Status Banner */}
        {isSectionPaused && (
          <div className="px-3 py-1 bg-amber-500 text-stone-950 font-bold text-[11px] rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
            <Pause className="w-3 h-3 fill-current" />
            <span>{pauseLabel || 'Section Pause...'}</span>
          </div>
        )}

        {/* Main Floating Controls Capsule */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-2xl bg-stone-900/90 dark:bg-stone-800/90 text-stone-100 shadow-2xl backdrop-blur-md border border-white/10 text-xs">
          {/* Previous Word Button */}
          {showButtons.prev && (
            <button
              onClick={prevWord}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Previous Word (← / Right Click)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Auto Mode Play / Pause Button */}
          {showButtons.playPause && (
            <button
              onClick={togglePlayPause}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shadow-sm ${
                isPlaying && !isPaused
                  ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={
                timing.useAutoTiming
                  ? isPlaying && !isPaused
                    ? 'Pause Auto Playback (Space / P)'
                    : 'Resume Auto Playback (Space / P)'
                  : 'Start Auto Playback'
              }
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">
                    {timing.useAutoTiming ? 'Play' : 'Auto'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Next Word Button */}
          {showButtons.next && (
            <button
              onClick={nextWord}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Next Word (→ / Space / Left Click)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Restart Button */}
          {showButtons.restart && (
            <button
              onClick={restart}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Restart from beginning (Home)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Sentence Progress Indicator */}
          {showButtons.progress && (
            <div className="px-2 font-mono font-bold text-[11px] text-stone-300">
              {String(sentenceIndex + 1).padStart(2, '0')} / {String(totalSentences).padStart(2, '0')}
            </div>
          )}

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Fullscreen Button */}
          {showButtons.fullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Settings Button */}
          {showButtons.settings && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Studio Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
            title="Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Exit Presentation */}
          <button
            onClick={handleExit}
            className="p-2 hover:bg-red-500/30 hover:text-red-300 rounded-xl transition text-stone-300"
            title="Exit Presentation (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
