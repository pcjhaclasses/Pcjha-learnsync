import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Square,
  X,
  HelpCircle,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Clock,
} from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import { WordHighlightLayer } from '../presentation/WordHighlight';
import { ScreenRecorder, type RecorderState } from '../../services/recorder';
import { VideoCropModal } from './VideoCropModal';
import type { CanvasPreset, ControlsVisibility } from '../../types';

export const RecordingView: React.FC = () => {
  const {
    sentenceIndex,
    isPlaying,
    isPaused,
    togglePlayPause,
    nextWord,
    prevWord,
    restart,
    wakeControls,
    areControlsVisible,
    setIsHelpOpen,
    presentationConfig,
    updatePresentationConfigProp,
  } = usePresentation();

  const { theme } = useTheme();
  const { currentChapter, currentLesson, setView } = useApp();

  // Recorder state
  const [recorderState, setRecorderState] = useState<RecorderState>({
    isSupported: ScreenRecorder.isSupported(),
    isRecording: false,
    durationSeconds: 0,
    blobUrl: null,
    recordedBlob: null,
    mimeType: null,
    errorMessage: null,
  });

  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>('16:9');
  const [showSetupGuides, setShowSetupGuides] = useState<boolean>(false);
  const [includeMic, setIncludeMic] = useState<boolean>(true);

  const recorderRef = useRef<ScreenRecorder | null>(null);

  useEffect(() => {
    recorderRef.current = new ScreenRecorder((update) => {
      setRecorderState((prev) => {
        const next = { ...prev, ...update };
        if (update.blobUrl) {
          setShowCropModal(true);
        }
        return next;
      });
    });

    return () => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (recorderRef.current) {
      const ok = await recorderRef.current.startRecording({ includeMic });
      if (ok) {
        wakeControls();
      }
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording();
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

  const sentences = currentLesson?.sentences || [];
  const currentSentence = sentences[sentenceIndex];

  // Canvas aspect ratio styles (exact same as previous version)
  let canvasStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1200px',
    aspectRatio: '16 / 9',
  };

  if (canvasPreset === '9:16') {
    canvasStyle = {
      width: '100%',
      maxWidth: '460px',
      aspectRatio: '9 / 16',
    };
  } else if (canvasPreset === '1:1') {
    canvasStyle = {
      width: '100%',
      maxWidth: '680px',
      aspectRatio: '1 / 1',
    };
  } else if (canvasPreset === '720p') {
    canvasStyle = {
      width: '100%',
      maxWidth: '1000px',
      aspectRatio: '16 / 9',
    };
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  return (
    <div
      onMouseMove={wakeControls}
      onClick={() => nextWord()}
      onContextMenu={(e) => {
        e.preventDefault();
        prevWord();
      }}
      className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Recording Setup Header Toolbar (Visible before recording, hides during recording) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md shadow-2xl text-xs ${
          areControlsVisible && !recorderState.isRecording ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span className="font-bold text-amber-500 uppercase tracking-wider text-[11px] px-1">
          Recording Studio
        </span>

        <div className="h-4 w-px bg-stone-700 mx-1" />

        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-stone-800 rounded-lg p-0.5 text-[11px]">
          <button
            onClick={() => setCanvasPreset('16:9')}
            className={`px-2 py-1 rounded-md transition ${
              canvasPreset === '16:9' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            16:9 YouTube
          </button>
          <button
            onClick={() => setCanvasPreset('9:16')}
            className={`px-2 py-1 rounded-md transition ${
              canvasPreset === '9:16' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            9:16 Reels/Shorts
          </button>
          <button
            onClick={() => setCanvasPreset('1:1')}
            className={`px-2 py-1 rounded-md transition ${
              canvasPreset === '1:1' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            1:1 Square
          </button>
        </div>

        {/* Safe Area Guides Toggle */}
        <button
          onClick={() => setShowSetupGuides(!showSetupGuides)}
          className={`px-2 py-1 rounded-lg border text-[11px] transition ${
            showSetupGuides
              ? 'border-amber-500 bg-amber-950/40 text-amber-300'
              : 'border-stone-700 text-stone-400 hover:text-white'
          }`}
          title="Toggle framing safe area guides in setup (Never recorded)"
        >
          Guides
        </button>

        {/* Timer Visibility Toggle Button */}
        <button
          onClick={() =>
            updatePresentationConfigProp(
              'showRecordingTimer',
              !presentationConfig.showRecordingTimer
            )
          }
          className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition ${
            presentationConfig.showRecordingTimer
              ? 'border-amber-500/80 bg-amber-950/40 text-amber-300 font-semibold'
              : 'border-stone-700 text-stone-400 hover:text-white'
          }`}
          title="Toggle recording timer overlay (Default: Hide for 100% clean video)"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timer: {presentationConfig.showRecordingTimer ? 'Show' : 'Hide (Clean)'}</span>
        </button>

        {/* Control Visibility Quick Preset */}
        <div className="flex items-center gap-1 bg-stone-800 rounded-lg p-0.5 text-[11px]">
          <span className="text-stone-400 px-1 text-[10px]">Controls:</span>
          {(['1s', '2s', '3s', '5s', 'always', 'never'] as ControlsVisibility[]).map((v) => (
            <button
              key={v}
              onClick={() => updatePresentationConfigProp('controlsVisibility', v)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition ${
                presentationConfig.controlsVisibility === v
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
              title={`Auto-hide controls: ${v}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Mic Toggle */}
        <button
          onClick={() => setIncludeMic(!includeMic)}
          className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
            includeMic
              ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400'
              : 'border-stone-700 text-stone-400 hover:text-white'
          }`}
          title="Toggle microphone recording"
        >
          {includeMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          <span>Mic {includeMic ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => setIsHelpOpen(true)}
          className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-stone-700 mx-1" />

        {/* Exit Recording Mode */}
        <button
          onClick={() => setView('editor')}
          className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-stone-800"
          title="Exit Recording Mode (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Unobtrusive Recording Status Indicator (Only if explicitly enabled by user) */}
      {recorderState.isRecording && presentationConfig.showRecordingTimer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-red-950/90 border border-red-800/80 shadow-2xl backdrop-blur-md animate-in fade-in transition-opacity duration-300 ${
            areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-record-pulse" />
          <span className="font-mono text-xs font-bold text-red-100">
            REC {formatSeconds(recorderState.durationSeconds)}
          </span>
          <button
            onClick={handleStopRecording}
            className="ml-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
            title="Stop Screen Recording"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      )}

      {/* Fixed Presentation Canvas (Exact same as previous version) */}
      <div
        style={{
          ...canvasStyle,
          backgroundColor: theme.bg,
          color: theme.hindiText,
        }}
        className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-8 sm:p-12 transition-all cursor-pointer m-auto"
      >
        {/* Setup Safe Area Guides (Visible only when toggle is on and not recording) */}
        {showSetupGuides && !recorderState.isRecording && (
          <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-amber-500/60 pointer-events-none rounded-xl z-10 flex flex-col justify-between p-2">
            <span className="text-[10px] font-mono text-amber-500 bg-black/80 px-1.5 py-0.5 rounded self-start">
              Safe Area Guide (Never recorded)
            </span>
            <span className="text-[10px] font-mono text-amber-500 bg-black/80 px-1.5 py-0.5 rounded self-end">
              Safe Bounds
            </span>
          </div>
        )}

        {/* Canvas Header */}
        <div className="text-center space-y-1">
          <span
            style={{ color: theme.secondary }}
            className="text-[11px] font-bold uppercase tracking-widest block"
          >
            {currentChapter?.title || 'Chapter'}
          </span>
          {currentLesson && (
            <span style={{ color: theme.secondary }} className="text-xs opacity-80">
              {currentLesson.title}
            </span>
          )}
        </div>

        {/* Canvas Content */}
        <div className="my-auto text-center space-y-6 sm:space-y-8 px-4">
          {currentSentence ? (
            <>
              <WordHighlightLayer layer="hindi" text={currentSentence.hindi} />
              <WordHighlightLayer layer="pronunciation" text={currentSentence.pronunciation} />
              <WordHighlightLayer layer="english" text={currentSentence.english} />
            </>
          ) : (
            <div className="text-center opacity-40">No sentences in lesson.</div>
          )}
        </div>

        {/* Canvas Footer */}
        <div className="text-center space-y-1">
          <div
            style={{ color: theme.secondary }}
            className="font-mono text-xs font-bold tracking-wider"
          >
            {String(sentenceIndex + 1).padStart(2, '0')} / {String(sentences.length).padStart(2, '0')}
          </div>
          <span
            style={{ color: theme.secondary }}
            className="text-[10px] tracking-wider uppercase font-semibold opacity-30 block"
          >
            PCJha LearnSync
          </span>
        </div>
      </div>

      {/* Floating Bottom Start Recording Button (Visible before recording starts) */}
      {!recorderState.isRecording && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 ${
            areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {recorderState.isSupported ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xl hover:scale-105 transition transform"
            >
              <Video className="w-4 h-4" />
              <span>Start Browser Recording</span>
            </button>
          ) : (
            <div className="p-3 bg-stone-900/90 border border-stone-800 rounded-xl text-center text-xs text-stone-300 max-w-sm">
              <span className="font-semibold text-amber-400 block mb-1">
                Native Screen Recording Unavailable
              </span>
              <span>
                Browser screen recording is not available here. Use your device's screen recorder or OBS.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Recording & Presentation Controls Bar (Active during recording) */}
      {recorderState.isRecording && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto ${
            areControlsVisible && presentationConfig.controlsVisibility !== 'never'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-2xl bg-stone-900/90 dark:bg-stone-800/90 text-stone-100 shadow-2xl backdrop-blur-md border border-white/10 text-xs">
            {/* Stop Recording Button */}
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md hover:scale-105 transition transform"
              title="Stop Recording"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Previous Word */}
            <button
              onClick={prevWord}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Previous Word (← / Right Click)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Auto Play / Pause */}
            <button
              onClick={togglePlayPause}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shadow-sm ${
                isPlaying && !isPaused
                  ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Toggle Auto Playback (Space)"
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">Auto</span>
                </>
              )}
            </button>

            {/* Next Word */}
            <button
              onClick={nextWord}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Next Word (→ / Space / Left Click)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Restart */}
            <button
              onClick={restart}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Restart from beginning (Home)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Sentence Progress Indicator */}
            <div className="px-2 font-mono font-bold text-[11px] text-stone-300">
              {String(sentenceIndex + 1).padStart(2, '0')} / {String(sentences.length).padStart(2, '0')}
            </div>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>

            {/* Help */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 hover:bg-white/15 rounded-xl transition text-stone-200 hover:text-white"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Video Crop & MP4 Export Studio Modal (Preserved & Active) */}
      <VideoCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        blobUrl={recorderState.blobUrl}
        recordedBlob={recorderState.recordedBlob}
        mimeType={recorderState.mimeType}
        defaultTitle={`${currentChapter?.title || 'Lesson'}-${currentLesson?.title || ''}`}
        onSendToAudioStudio={() => {
          setView('audio');
        }}
        onRecordAgain={() => {
          setShowCropModal(false);
          handleStartRecording();
        }}
      />
    </div>
  );
};
