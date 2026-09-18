import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Square,
  Download,
  X,
  HelpCircle,
} from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import { WordHighlightLayer } from '../presentation/WordHighlight';
import { ScreenRecorder, type RecorderState } from '../../services/recorder';
import type { CanvasPreset } from '../../types';

export const RecordingView: React.FC = () => {
  const {
    sentenceIndex,
    nextWord,
    prevWord,
    wakeControls,
    areControlsVisible,
    setIsHelpOpen,
  } = usePresentation();

  const { theme } = useTheme();
  const { currentChapter, currentLesson, setView } = useApp();

  // Recorder state
  const [recorderState, setRecorderState] = useState<RecorderState>({
    isSupported: ScreenRecorder.isSupported(),
    isRecording: false,
    durationSeconds: 0,
    blobUrl: null,
    mimeType: null,
    errorMessage: null,
  });

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>('16:9');
  const [showSetupGuides, setShowSetupGuides] = useState(false);

  const recorderRef = useRef<ScreenRecorder | null>(null);

  useEffect(() => {
    recorderRef.current = new ScreenRecorder((update) => {
      setRecorderState((prev) => {
        const next = { ...prev, ...update };
        if (update.blobUrl) {
          setShowCompletionModal(true);
        }
        return next;
      });
    });
  }, []);

  const handleStartRecording = async () => {
    if (recorderRef.current) {
      await recorderRef.current.startRecording();
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording();
    }
  };

  const handleDownloadVideo = () => {
    if (!recorderState.blobUrl) return;
    const a = document.createElement('a');
    a.href = recorderState.blobUrl;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `PCJha-LearnSync-Recording-${currentChapter?.title || 'lesson'}-${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sentences = currentLesson?.sentences || [];
  const currentSentence = sentences[sentenceIndex];

  // Canvas aspect ratio styles
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
      {/* Recording Header Toolbar (Fades out when recording or inactivity) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 flex items-center gap-2 px-3 py-2 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md shadow-2xl text-xs ${
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

        {/* Safe Area Toggle */}
        <button
          onClick={() => setShowSetupGuides(!showSetupGuides)}
          className={`px-2 py-1 rounded-lg border text-[11px] transition ${
            showSetupGuides
              ? 'border-amber-500 bg-amber-950/40 text-amber-300'
              : 'border-stone-700 text-stone-400 hover:text-white'
          }`}
          title="Toggle framing safe area guides in setup"
        >
          Guides
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

      {/* Live Unobtrusive Recording Status Indicator */}
      {recorderState.isRecording && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-red-950/90 border border-red-800/80 shadow-2xl backdrop-blur-md animate-in fade-in"
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

      {/* Fixed Presentation Canvas */}
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

      {/* Floating Bottom Recording Trigger Button */}
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

      {/* Recording Complete Modal */}
      {showCompletionModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-700 text-red-400 flex items-center justify-center mx-auto">
              <Video className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Recording Complete</h3>
              <p className="text-xs text-stone-400">
                Duration: {formatSeconds(recorderState.durationSeconds)} • Format: WebM (High Quality)
              </p>
            </div>

            {/* Video preview playback */}
            {recorderState.blobUrl && (
              <div className="rounded-xl overflow-hidden border border-stone-800 bg-black aspect-video">
                <video src={recorderState.blobUrl} controls className="w-full h-full object-contain" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={handleDownloadVideo}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Recording</span>
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  handleStartRecording();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-medium text-xs transition"
              >
                Record Again
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
