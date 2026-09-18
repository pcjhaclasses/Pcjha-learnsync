// Data Models for PCJha LearnSync

export interface Sentence {
  id: string;
  hindi: string;
  pronunciation: string; // Hindi pronunciation written in Devanagari script
  english: string;
  note?: string; // Optional teacher note
}

export interface Lesson {
  id: string;
  title: string;
  sentences: Sentence[];
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  subject?: string;
  className?: string;
  chapterNumber?: string | number;
  author?: string;
  description?: string;
  coverImage?: string;
  lessons: Lesson[];
  createdAt: number;
  updatedAt: number;
}

export interface Course {
  id: string;
  title: string;
  author: string;
  description?: string;
  themeId?: string;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

// Tokenized word unit for rendering
export interface WordToken {
  id: string;
  index: number;
  text: string; // Displayed text (with preserved punctuation)
  raw: string;  // Base word without leading/trailing punctuation for analysis
}

// Presentation Layers & Modes
export type TextLayer = 'hindi' | 'pronunciation' | 'english';
export type ActiveLayer = TextLayer | null;

export type HighlightStyle = 'background' | 'textColor' | 'underline' | 'pill' | 'glow' | 'bold';
export type LineFocus = 'none' | 'activeLine' | 'activeAndPrev' | 'activeAndNext' | 'activeSentence';
export type WordFocus = 'off' | 'currentWord' | 'currentAndSurrounding';
export type TextAlignment = 'left' | 'center' | 'right';
export type TextWidth = 'narrow' | 'medium' | 'wide' | 'full' | 'custom';
export type AutoScrollMode = 'off' | 'center' | 'top' | 'smooth';
export type RepeatCount = 1 | 2 | 3 | 5 | 'unlimited';
export type ControlsVisibility = 'always' | '1s' | '2s' | '3s' | '5s' | 'never';
export type ProgressPosition = 'top' | 'bottom' | 'hidden';

// Typography Settings
export interface TypographyLayerConfig {
  fontFamily: string;
  fontSize: number; // in pixels
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number; // in em or px
}

export interface TypographyConfig {
  hindi: TypographyLayerConfig;
  pronunciation: TypographyLayerConfig;
  english: TypographyLayerConfig;
}

// Timing & Pause Settings
export interface TimingSettings {
  useAutoTiming: boolean;
  wordIntervalMs: number;
  enablePause: boolean;
  pauseAfterHindiMs: number;
  pauseAfterPronunciationMs: number;
  pauseAfterEnglishMs: number;
  pauseAfterSentenceMs: number;
  repeatCount: RepeatCount;
}

// Theme Configuration
export interface ThemeConfig {
  id: string;
  name: string;
  bg: string;
  hindiText: string;
  pronunciationText: string;
  englishText: string;
  highlightBg: string;
  highlightText: string;
  inactiveText: string;
  previousText: string;
  secondary: string;
  progressBar: string;
  divider: string;
  // Highlight customization
  highlightStyle: HighlightStyle;
  highlightOpacity: number; // 0.1 to 1.0
  highlightBorderRadius: number; // in px
  highlightPaddingX: number; // in px
  highlightPaddingY: number; // in px
}

// Presentation & Controls Configuration
export interface PresentationConfig {
  alignment: TextAlignment;
  textWidth: TextWidth;
  customMaxWidthPx: number;
  lineFocus: LineFocus;
  wordFocus: WordFocus;
  autoScroll: AutoScrollMode;
  controlsVisibility: ControlsVisibility;
  progressPosition: ProgressPosition;
  showPercent: boolean;
  showIntroCover: boolean;
  showCompletionScreen: boolean;
  showControlButtons: {
    prev: boolean;
    next: boolean;
    playPause: boolean;
    restart: boolean;
    progress: boolean;
    settings: boolean;
    fullscreen: boolean;
  };
}

// Recording Configuration
export type CanvasPreset = '16:9' | '9:16' | '1:1' | '720p' | 'custom';

export interface RecordingConfig {
  canvasPreset: CanvasPreset;
  customWidth: number;
  customHeight: number;
  backgroundType: 'theme' | 'solid' | 'image';
  customBgColor: string;
  customBgImage?: string;
  showSafeAreaGuides: boolean;
  safeAreaMarginPercent: number;
}

// Active Presentation Navigation State
export interface PresentationState {
  chapterId: string;
  lessonId: string;
  sentenceIndex: number;
  activeLayer: ActiveLayer;
  wordIndex: number;
  isStarted: boolean;      // True if user has initiated presentation past intro
  isPlaying: boolean;      // Auto playback active
  isPaused: boolean;       // Auto playback temporarily paused by user
  isSectionPaused: boolean;// Inside custom section pause duration
  currentPauseLabel?: string;
  completedCyclesForSentence: number;
  isCompleted: boolean;    // Reached the end of the lesson
}

// App View Modes
export type AppView = 'library' | 'editor' | 'presentation' | 'recording';
export type EditorSubTab = 'cards' | 'bulk';
