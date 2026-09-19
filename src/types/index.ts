// Data Models for PCJha LearnSync V2

export interface AudioTiming {
  wordId: string;
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
}

export interface AudioAsset {
  id: string;
  name: string;
  dataUrl?: string; // Base64 or object URL
  blob?: Blob;      // Raw audio blob stored in IndexedDB
  duration: number; // in seconds
  mimeType: string;
  createdAt: number;
}

export interface Sentence {
  id: string;
  hindi: string;
  pronunciation: string; // Hindi pronunciation in Devanagari script
  english: string;
  note?: string; // Optional teacher note
  audioId?: string; // ID referencing local AudioAsset
  audioTimings?: AudioTiming[]; // Synced word timings
  wordNotes?: Record<string, string>; // Word-level notes { [wordId]: note }
}

export interface Lesson {
  id: string;
  title: string;
  sentences: Sentence[];
  createdAt: number;
  updatedAt: number;
}

export interface ActivityProgress {
  chapterId: string;
  readCompleted: boolean;
  listenSeconds: number;
  practiceCount: number;
  quizScore?: number;
  quizTotal?: number;
  lastStudiedAt: number;
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
  activityProgress?: ActivityProgress;
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
  schemaVersion?: number;
  createdAt: number;
  updatedAt: number;
}

// Student Learning Platform Types
export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  exampleSentence?: string;
  chapterId?: string;
  sentenceId?: string;
  audioId?: string;
  mastered: boolean;
  addedAt: number;
  reviewCount: number;
}

export interface QuizQuestion {
  id: string;
  sentenceId?: string;
  type: 'multiple-choice' | 'mcq' | 'fillBlank' | 'match' | 'meaning' | 'pronunciation' | 'audio';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}

export interface QuizResult {
  id: string;
  chapterId: string;
  lessonId?: string;
  score: number;
  totalQuestions: number;
  completedAt: number;
  answers: Record<string, string>;
}

export interface LibraryBook {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'image' | 'text';
  dataUrl?: string;
  textContent?: string;
  createdAt: number;
  bookmarks?: number[];
}

// Tokenized word unit for rendering
export interface WordToken {
  id: string;
  index: number;
  text: string; // Displayed text (with preserved punctuation)
  raw: string;  // Base word without leading/trailing punctuation
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
  letterSpacing: number;
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
  highlightOpacity: number;
  highlightBorderRadius: number;
  highlightPaddingX: number;
  highlightPaddingY: number;
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
  showRecordingTimer?: boolean;
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
export type CanvasPreset = '16:9' | '9:16' | '1:1' | '4:5' | '720p' | 'custom';

export interface VideoCropBounds {
  x: number; // proportional 0 to 1
  y: number; // proportional 0 to 1
  width: number; // proportional 0 to 1
  height: number; // proportional 0 to 1
}

export interface RecordingConfig {
  canvasPreset: CanvasPreset;
  customWidth: number;
  customHeight: number;
  backgroundType: 'theme' | 'solid' | 'gradient' | 'image';
  customBgColor: string;
  customBgGradient?: string;
  customBgImage?: string;
  bgPosition?: 'cover' | 'contain' | 'center';
  showSafeAreaGuides: boolean;
  safeAreaMarginPercent: number;
  frameRate: number;
}

// Active Presentation Navigation State
export interface PresentationState {
  chapterId: string;
  lessonId: string;
  sentenceIndex: number;
  activeLayer: ActiveLayer;
  wordIndex: number;
  isStarted: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isSectionPaused: boolean;
  currentPauseLabel?: string;
  completedCyclesForSentence: number;
  isCompleted: boolean;
}

// App View Modes
export type AppView =
  | 'library'
  | 'editor'
  | 'presentation'
  | 'recording'
  | 'audioStudio'
  | 'audio'
  | 'importCenter'
  | 'import'
  | 'learning'
  | 'reader'
  | 'progress';

export type EditorSubTab = 'cards' | 'bulk';
