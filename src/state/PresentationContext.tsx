import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  ActiveLayer,
  TimingSettings,
  PresentationConfig,
  Sentence,
} from '../types';
import { StorageService } from '../services/storage';
import { tokenizeText } from '../services/tokenizer';
import { useApp } from './AppContext';

export const DEFAULT_TIMING: TimingSettings = {
  useAutoTiming: false,
  wordIntervalMs: 1000,
  enablePause: false,
  pauseAfterHindiMs: 2000,
  pauseAfterPronunciationMs: 2000,
  pauseAfterEnglishMs: 3000,
  pauseAfterSentenceMs: 2000,
  repeatCount: 1,
};

export const DEFAULT_PRESENTATION_CONFIG: PresentationConfig = {
  alignment: 'center',
  textWidth: 'medium',
  customMaxWidthPx: 840,
  lineFocus: 'none',
  wordFocus: 'off',
  autoScroll: 'center',
  controlsVisibility: '3s',
  progressPosition: 'bottom',
  showPercent: true,
  showIntroCover: false,
  showCompletionScreen: true,
  showControlButtons: {
    prev: true,
    next: true,
    playPause: true,
    restart: true,
    progress: true,
    settings: true,
    fullscreen: true,
  },
};

interface PresentationContextType {
  sentenceIndex: number;
  activeLayer: ActiveLayer;
  wordIndex: number;
  isStarted: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isSectionPaused: boolean;
  sectionPauseRemainingMs: number;
  pauseLabel: string;
  isCompleted: boolean;
  currentCycleCount: number;

  timing: TimingSettings;
  setTiming: (timing: TimingSettings) => void;
  updateTimingProp: <K extends keyof TimingSettings>(key: K, value: TimingSettings[K]) => void;

  presentationConfig: PresentationConfig;
  setPresentationConfig: (config: PresentationConfig) => void;
  updatePresentationConfigProp: <K extends keyof PresentationConfig>(key: K, value: PresentationConfig[K]) => void;

  // Actions
  startPresentation: () => void;
  nextWord: () => void;
  prevWord: () => void;
  nextSentence: () => void;
  prevSentence: () => void;
  goToSentence: (index: number) => void;
  restart: () => void;
  togglePlayPause: () => void;
  play: () => void;
  pause: () => void;

  // Controls UI visibility
  areControlsVisible: boolean;
  wakeControls: () => void;
  toggleControlsManually: () => void;

  // Help Modal & Settings Modal
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const PresentationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentLesson, view } = useApp();

  const [timing, setTimingState] = useState<TimingSettings>(() =>
    StorageService.loadTiming(DEFAULT_TIMING)
  );

  const [presentationConfig, setPresentationConfigState] = useState<PresentationConfig>(() =>
    StorageService.loadPresentation(DEFAULT_PRESENTATION_CONFIG)
  );

  // Navigation state machine
  const [sentenceIndex, setSentenceIndex] = useState<number>(0);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('hindi');
  const [wordIndex, setWordIndex] = useState<number>(-1); // -1 = unhighlighted before first advance
  const [isStarted, setIsStarted] = useState<boolean>(!presentationConfig.showIntroCover);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSectionPaused, setIsSectionPaused] = useState<boolean>(false);
  const [sectionPauseRemainingMs, setSectionPauseRemainingMs] = useState<number>(0);
  const [pauseLabel, setPauseLabel] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentCycleCount, setCurrentCycleCount] = useState<number>(1);

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Controls auto-hide
  const [areControlsVisible, setAreControlsVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<number | null>(null);

  // Auto playback timer refs
  const playbackTimerRef = useRef<number | null>(null);

  const setTiming = (newTiming: TimingSettings) => {
    setTimingState(newTiming);
    StorageService.saveTiming(newTiming);
  };

  const updateTimingProp = <K extends keyof TimingSettings>(key: K, value: TimingSettings[K]) => {
    const updated = { ...timing, [key]: value };
    setTiming(updated);
  };

  const setPresentationConfig = (newConfig: PresentationConfig) => {
    setPresentationConfigState(newConfig);
    StorageService.savePresentation(newConfig);
  };

  const updatePresentationConfigProp = <K extends keyof PresentationConfig>(
    key: K,
    value: PresentationConfig[K]
  ) => {
    const updated = { ...presentationConfig, [key]: value };
    setPresentationConfig(updated);
  };

  const currentSentence: Sentence | undefined = currentLesson?.sentences[sentenceIndex];

  // Wake controls on user interaction
  const wakeControls = useCallback(() => {
    setAreControlsVisible(true);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (presentationConfig.controlsVisibility !== 'always' && presentationConfig.controlsVisibility !== 'never') {
      const msMap: Record<string, number> = {
        '1s': 1000,
        '2s': 2000,
        '3s': 3000,
        '5s': 5000,
      };
      const delay = msMap[presentationConfig.controlsVisibility] || 3000;
      hideTimerRef.current = window.setTimeout(() => {
        setAreControlsVisible(false);
      }, delay);
    } else if (presentationConfig.controlsVisibility === 'never') {
      setAreControlsVisible(false);
    }
  }, [presentationConfig.controlsVisibility]);

  const toggleControlsManually = () => {
    setAreControlsVisible((prev) => !prev);
  };

  // Reset when lesson changes
  useEffect(() => {
    setSentenceIndex(0);
    setActiveLayer('hindi');
    setWordIndex(-1);
    setIsCompleted(false);
    setCurrentCycleCount(1);
    setIsPlaying(false);
    setIsPaused(false);
    setIsSectionPaused(false);
  }, [currentLesson?.id]);

  // Restart everything to beginning
  const restart = useCallback(() => {
    if (playbackTimerRef.current !== null) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setSentenceIndex(0);
    setActiveLayer('hindi');
    setWordIndex(-1);
    setIsCompleted(false);
    setCurrentCycleCount(1);
    setIsPaused(false);
    setIsSectionPaused(false);
    setSectionPauseRemainingMs(0);
    setPauseLabel('');
    if (timing.useAutoTiming) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [timing.useAutoTiming]);

  const startPresentation = () => {
    setIsStarted(true);
    if (timing.useAutoTiming) {
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  // Manual & Auto: Next Word
  const nextWord = useCallback(() => {
    if (!currentLesson || currentLesson.sentences.length === 0) return;
    const sentence = currentLesson.sentences[sentenceIndex];
    if (!sentence) return;

    const hindiTokens = tokenizeText(sentence.hindi);
    const pronTokens = tokenizeText(sentence.pronunciation);
    const engTokens = tokenizeText(sentence.english);

    // Initial state: first click starts Hindi word 0
    if (wordIndex === -1 || activeLayer === null) {
      setActiveLayer('hindi');
      setWordIndex(0);
      return;
    }

    if (activeLayer === 'hindi') {
      if (wordIndex < hindiTokens.length - 1) {
        setWordIndex((w) => w + 1);
      } else {
        // Finished Hindi -> Move to Pronunciation
        setActiveLayer('pronunciation');
        setWordIndex(0);
      }
    } else if (activeLayer === 'pronunciation') {
      if (wordIndex < pronTokens.length - 1) {
        setWordIndex((w) => w + 1);
      } else {
        // Finished Pronunciation -> Move to English
        setActiveLayer('english');
        setWordIndex(0);
      }
    } else if (activeLayer === 'english') {
      if (wordIndex < engTokens.length - 1) {
        setWordIndex((w) => w + 1);
      } else {
        // Finished English -> Check Repeat or Next Sentence
        const shouldRepeat =
          timing.useAutoTiming &&
          (timing.repeatCount === 'unlimited' ||
            (typeof timing.repeatCount === 'number' && currentCycleCount < timing.repeatCount));

        if (shouldRepeat) {
          setCurrentCycleCount((c) => c + 1);
          setActiveLayer('hindi');
          setWordIndex(0);
        } else {
          setCurrentCycleCount(1);
          if (sentenceIndex < currentLesson.sentences.length - 1) {
            setSentenceIndex((s) => s + 1);
            setActiveLayer('hindi');
            setWordIndex(0);
          } else {
            // End of lesson reached!
            setIsCompleted(true);
            setIsPlaying(false);
          }
        }
      }
    }
  }, [currentLesson, sentenceIndex, wordIndex, activeLayer, timing, currentCycleCount]);

  // Reverse navigation across timeline
  const prevWord = useCallback(() => {
    if (!currentLesson || currentLesson.sentences.length === 0) return;
    const sentence = currentLesson.sentences[sentenceIndex];
    if (!sentence) return;

    const hindiTokens = tokenizeText(sentence.hindi);
    const pronTokens = tokenizeText(sentence.pronunciation);

    if (activeLayer === 'english') {
      if (wordIndex > 0) {
        setWordIndex((w) => w - 1);
      } else {
        // Move backward from English word 0 -> Pronunciation last word
        setActiveLayer('pronunciation');
        setWordIndex(Math.max(0, pronTokens.length - 1));
      }
    } else if (activeLayer === 'pronunciation') {
      if (wordIndex > 0) {
        setWordIndex((w) => w - 1);
      } else {
        // Move backward from Pronunciation word 0 -> Hindi last word
        setActiveLayer('hindi');
        setWordIndex(Math.max(0, hindiTokens.length - 1));
      }
    } else if (activeLayer === 'hindi') {
      if (wordIndex > 0) {
        setWordIndex((w) => w - 1);
      } else if (sentenceIndex > 0) {
        // Move backward from Hindi word 0 -> Previous sentence's English last word!
        const prevSent = currentLesson.sentences[sentenceIndex - 1];
        const prevEngTokens = tokenizeText(prevSent.english);
        setSentenceIndex((s) => s - 1);
        setActiveLayer('english');
        setWordIndex(Math.max(0, prevEngTokens.length - 1));
      }
    }
  }, [currentLesson, sentenceIndex, wordIndex, activeLayer]);

  // Jump Next / Prev Sentence
  const nextSentence = useCallback(() => {
    if (!currentLesson) return;
    if (sentenceIndex < currentLesson.sentences.length - 1) {
      setSentenceIndex((s) => s + 1);
      setActiveLayer('hindi');
      setWordIndex(0);
      setCurrentCycleCount(1);
    } else {
      setIsCompleted(true);
      setIsPlaying(false);
    }
  }, [currentLesson, sentenceIndex]);

  const prevSentence = useCallback(() => {
    if (sentenceIndex > 0) {
      setSentenceIndex((s) => s - 1);
      setActiveLayer('hindi');
      setWordIndex(0);
      setCurrentCycleCount(1);
      setIsCompleted(false);
    }
  }, [sentenceIndex]);

  const goToSentence = useCallback((index: number) => {
    setSentenceIndex(index);
    setActiveLayer('hindi');
    setWordIndex(0);
    setCurrentCycleCount(1);
    setIsCompleted(false);
  }, []);

  // Play / Pause Controls
  const play = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    if (playbackTimerRef.current !== null) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Auto Playback Tick Machine
  useEffect(() => {
    if (!timing.useAutoTiming || !isPlaying || isPaused || isCompleted || !isStarted) {
      if (playbackTimerRef.current !== null) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    if (!currentSentence) return;

    const hindiTokens = tokenizeText(currentSentence.hindi);
    const pronTokens = tokenizeText(currentSentence.pronunciation);
    const engTokens = tokenizeText(currentSentence.english);

    // If section pause is active, wait out the remaining duration
    if (isSectionPaused) {
      playbackTimerRef.current = window.setTimeout(() => {
        setIsSectionPaused(false);
        setPauseLabel('');
        // Transition to next layer/sentence after pause
        if (activeLayer === 'hindi') {
          setActiveLayer('pronunciation');
          setWordIndex(0);
        } else if (activeLayer === 'pronunciation') {
          setActiveLayer('english');
          setWordIndex(0);
        } else if (activeLayer === 'english') {
          const shouldRepeat =
            timing.repeatCount === 'unlimited' ||
            (typeof timing.repeatCount === 'number' && currentCycleCount < timing.repeatCount);

          if (shouldRepeat) {
            setCurrentCycleCount((c) => c + 1);
            setActiveLayer('hindi');
            setWordIndex(0);
          } else {
            setCurrentCycleCount(1);
            if (sentenceIndex < (currentLesson?.sentences.length || 0) - 1) {
              setSentenceIndex((s) => s + 1);
              setActiveLayer('hindi');
              setWordIndex(0);
            } else {
              setIsCompleted(true);
              setIsPlaying(false);
            }
          }
        }
      }, sectionPauseRemainingMs);

      return () => {
        if (playbackTimerRef.current !== null) {
          clearTimeout(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
      };
    }

    // Normal word tick
    const interval = Math.max(50, timing.wordIntervalMs);

    playbackTimerRef.current = window.setTimeout(() => {
      // First tick if at -1
      if (wordIndex === -1) {
        setActiveLayer('hindi');
        setWordIndex(0);
        return;
      }

      // Check if current layer is completing
      if (activeLayer === 'hindi') {
        if (wordIndex < hindiTokens.length - 1) {
          setWordIndex((w) => w + 1);
        } else if (timing.enablePause && timing.pauseAfterHindiMs > 0) {
          setIsSectionPaused(true);
          setSectionPauseRemainingMs(timing.pauseAfterHindiMs);
          setPauseLabel('Waiting after Hindi...');
        } else {
          setActiveLayer('pronunciation');
          setWordIndex(0);
        }
      } else if (activeLayer === 'pronunciation') {
        if (wordIndex < pronTokens.length - 1) {
          setWordIndex((w) => w + 1);
        } else if (timing.enablePause && timing.pauseAfterPronunciationMs > 0) {
          setIsSectionPaused(true);
          setSectionPauseRemainingMs(timing.pauseAfterPronunciationMs);
          setPauseLabel('Waiting after Pronunciation...');
        } else {
          setActiveLayer('english');
          setWordIndex(0);
        }
      } else if (activeLayer === 'english') {
        if (wordIndex < engTokens.length - 1) {
          setWordIndex((w) => w + 1);
        } else {
          const pauseMs =
            timing.enablePause && timing.pauseAfterEnglishMs > 0
              ? timing.pauseAfterEnglishMs
              : timing.enablePause && timing.pauseAfterSentenceMs > 0
              ? timing.pauseAfterSentenceMs
              : 0;

          if (pauseMs > 0) {
            setIsSectionPaused(true);
            setSectionPauseRemainingMs(pauseMs);
            setPauseLabel('Waiting after sentence...');
          } else {
            const shouldRepeat =
              timing.repeatCount === 'unlimited' ||
              (typeof timing.repeatCount === 'number' && currentCycleCount < timing.repeatCount);

            if (shouldRepeat) {
              setCurrentCycleCount((c) => c + 1);
              setActiveLayer('hindi');
              setWordIndex(0);
            } else {
              setCurrentCycleCount(1);
              if (sentenceIndex < (currentLesson?.sentences.length || 0) - 1) {
                setSentenceIndex((s) => s + 1);
                setActiveLayer('hindi');
                setWordIndex(0);
              } else {
                setIsCompleted(true);
                setIsPlaying(false);
              }
            }
          }
        }
      }
    }, interval);

    return () => {
      if (playbackTimerRef.current !== null) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [
    timing,
    isPlaying,
    isPaused,
    isCompleted,
    isStarted,
    isSectionPaused,
    sectionPauseRemainingMs,
    sentenceIndex,
    activeLayer,
    wordIndex,
    currentSentence,
    currentLesson,
    currentCycleCount,
  ]);

  // Global Keyboard Navigation (when in Presentation or Recording views)
  useEffect(() => {
    if (view !== 'presentation' && view !== 'recording') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      wakeControls();

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextWord();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevWord();
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (timing.useAutoTiming) {
            togglePlayPause();
          } else {
            nextWord();
          }
          break;
        case 'Enter':
          e.preventDefault();
          nextSentence();
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          prevSentence();
          break;
        case 'Home':
          e.preventDefault();
          restart();
          break;
        case 'End':
          e.preventDefault();
          if (currentLesson) {
            setSentenceIndex(currentLesson.sentences.length - 1);
            setActiveLayer('english');
            const engTokens = tokenizeText(currentLesson.sentences[currentLesson.sentences.length - 1].english);
            setWordIndex(Math.max(0, engTokens.length - 1));
          }
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          toggleControlsManually();
          break;
        case 'Escape':
          e.preventDefault();
          setAreControlsVisible(true);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case '?':
          e.preventDefault();
          setIsHelpOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    view,
    timing.useAutoTiming,
    nextWord,
    prevWord,
    nextSentence,
    prevSentence,
    restart,
    togglePlayPause,
    wakeControls,
    currentLesson,
  ]);

  return (
    <PresentationContext.Provider
      value={{
        sentenceIndex,
        activeLayer,
        wordIndex,
        isStarted,
        isPlaying,
        isPaused,
        isSectionPaused,
        sectionPauseRemainingMs,
        pauseLabel,
        isCompleted,
        currentCycleCount,
        timing,
        setTiming,
        updateTimingProp,
        presentationConfig,
        setPresentationConfig,
        updatePresentationConfigProp,
        startPresentation,
        nextWord,
        prevWord,
        nextSentence,
        prevSentence,
        goToSentence,
        restart,
        togglePlayPause,
        play,
        pause,
        areControlsVisible,
        wakeControls,
        toggleControlsManually,
        isHelpOpen,
        setIsHelpOpen,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </PresentationContext.Provider>
  );
};

export function usePresentation() {
  const context = useContext(PresentationContext);
  if (!context) throw new Error('usePresentation must be used within a PresentationProvider');
  return context;
}
