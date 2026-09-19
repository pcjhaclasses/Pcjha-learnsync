import { openDB, type IDBPDatabase } from 'idb';
import type {
  Course,
  TimingSettings,
  ThemeConfig,
  PresentationConfig,
  TypographyConfig,
  AudioAsset,
  VocabularyItem,
  QuizResult,
  LibraryBook,
} from '../types';
import { SAMPLE_COURSE } from './sampleData';

const DB_NAME = 'PCJhaLearnSync_DB';
const DB_VERSION = 2;

const STORE_COURSES = 'courses';
const STORE_AUDIO = 'audioAssets';
const STORE_BOOKS = 'libraryBooks';
const STORE_VOCAB = 'vocabulary';
const STORE_QUIZ = 'quizResults';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion) {
        if (!db.objectStoreNames.contains(STORE_COURSES)) {
          db.createObjectStore(STORE_COURSES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BOOKS)) {
          db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_VOCAB)) {
          db.createObjectStore(STORE_VOCAB, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_QUIZ)) {
          db.createObjectStore(STORE_QUIZ, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Course Storage API
export async function getAllCourses(): Promise<Course[]> {
  const db = await getDB();
  const courses = await db.getAll(STORE_COURSES);
  if (courses.length === 0) {
    await saveCourse(SAMPLE_COURSE);
    return [SAMPLE_COURSE];
  }
  return courses;
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const db = await getDB();
  return db.get(STORE_COURSES, id);
}

export async function saveCourse(course: Course): Promise<void> {
  const db = await getDB();
  await db.put(STORE_COURSES, {
    ...course,
    schemaVersion: 2,
    updatedAt: Date.now(),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_COURSES, id);
}

// Audio Assets API
export async function saveAudioAsset(asset: AudioAsset): Promise<void> {
  const db = await getDB();
  await db.put(STORE_AUDIO, asset);
}

export async function getAudioAsset(id: string): Promise<AudioAsset | undefined> {
  const db = await getDB();
  return db.get(STORE_AUDIO, id);
}

export async function getAllAudioAssets(): Promise<AudioAsset[]> {
  const db = await getDB();
  return db.getAll(STORE_AUDIO);
}

export async function deleteAudioAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_AUDIO, id);
}

// Library Books API
export async function saveLibraryBook(book: LibraryBook): Promise<void> {
  const db = await getDB();
  await db.put(STORE_BOOKS, book);
}

export async function getAllLibraryBooks(): Promise<LibraryBook[]> {
  const db = await getDB();
  return db.getAll(STORE_BOOKS);
}

export async function deleteLibraryBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_BOOKS, id);
}

// Vocabulary Storage API
export async function saveVocabularyItem(item: VocabularyItem): Promise<void> {
  const db = await getDB();
  await db.put(STORE_VOCAB, item);
}

export async function getAllVocabulary(): Promise<VocabularyItem[]> {
  const db = await getDB();
  return db.getAll(STORE_VOCAB);
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_VOCAB, id);
}

// Quiz Results API
export async function saveQuizResult(result: QuizResult): Promise<void> {
  const db = await getDB();
  await db.put(STORE_QUIZ, result);
}

export async function getAllQuizResults(): Promise<QuizResult[]> {
  const db = await getDB();
  return db.getAll(STORE_QUIZ);
}

// Storage Quota Estimation API
export async function getStorageEstimate(): Promise<{
  quota: number;
  usage: number;
  usagePercent: number;
  quotaFormatted: string;
  usageFormatted: string;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 1024 * 1024 * 1024;
    const usage = estimate.usage || 0;
    const usagePercent = Math.min(100, (usage / quota) * 100);

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return {
      quota,
      usage,
      usagePercent: Number(usagePercent.toFixed(1)),
      quotaFormatted: formatBytes(quota),
      usageFormatted: formatBytes(usage),
    };
  }

  return {
    quota: 1024 * 1024 * 1024,
    usage: 0,
    usagePercent: 0,
    quotaFormatted: '1 GB',
    usageFormatted: 'Unknown',
  };
}

// LocalStorage Keys for Preferences
const KEY_ACTIVE_IDS = 'pcjha_active_selection';
const KEY_TIMING = 'pcjha_timing_settings';
const KEY_PRESENTATION = 'pcjha_presentation_config';
const KEY_TYPOGRAPHY = 'pcjha_typography_config';
const KEY_THEME = 'pcjha_theme_config';
const KEY_CUSTOM_THEMES = 'pcjha_custom_themes';
const KEY_AUTOSAVE_DRAFT = 'pcjha_autosave_draft';

export interface ActiveSelection {
  courseId: string;
  chapterId: string;
  lessonId: string;
}

export function loadActiveSelection(): ActiveSelection | null {
  try {
    const raw = localStorage.getItem(KEY_ACTIVE_IDS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSelection(selection: ActiveSelection): void {
  try {
    localStorage.setItem(KEY_ACTIVE_IDS, JSON.stringify(selection));
  } catch (err) {
    console.error('Failed to save active selection', err);
  }
}

export function loadPreference<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function savePreference<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save preference ${key}`, err);
  }
}

export const StorageService = {
  // Timing
  loadTiming: (fallback: TimingSettings) => loadPreference(KEY_TIMING, fallback),
  saveTiming: (timing: TimingSettings) => savePreference(KEY_TIMING, timing),

  // Presentation Config
  loadPresentation: (fallback: PresentationConfig) => loadPreference(KEY_PRESENTATION, fallback),
  savePresentation: (config: PresentationConfig) => savePreference(KEY_PRESENTATION, config),

  // Typography
  loadTypography: (fallback: TypographyConfig) => loadPreference(KEY_TYPOGRAPHY, fallback),
  saveTypography: (config: TypographyConfig) => savePreference(KEY_TYPOGRAPHY, config),

  // Theme
  loadTheme: (fallback: ThemeConfig) => loadPreference(KEY_THEME, fallback),
  saveTheme: (config: ThemeConfig) => savePreference(KEY_THEME, config),

  loadCustomThemes: (): ThemeConfig[] => loadPreference(KEY_CUSTOM_THEMES, []),
  saveCustomThemes: (themes: ThemeConfig[]) => savePreference(KEY_CUSTOM_THEMES, themes),

  // Draft Recovery for crash protection
  saveDraft: (course: Course) => {
    try {
      localStorage.setItem(KEY_AUTOSAVE_DRAFT, JSON.stringify({
        timestamp: Date.now(),
        course,
      }));
    } catch (e) {
      console.warn('Draft autosave overflow', e);
    }
  },

  checkDraftRecovery: (): { timestamp: number; course: Course } | null => {
    try {
      const raw = localStorage.getItem(KEY_AUTOSAVE_DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearDraftRecovery: () => {
    localStorage.removeItem(KEY_AUTOSAVE_DRAFT);
  },

  // IndexedDB Stores
  saveAudioAsset,
  getAudioAsset,
  getAllAudioAssets,
  deleteAudioAsset,
  saveLibraryBook,
  getAllBooks: getAllLibraryBooks,
  deleteLibraryBook,
  saveVocabulary: saveVocabularyItem,
  getAllVocabulary,
  deleteVocabularyItem,
  saveQuizResult,
  getAllQuizResults,
  getStorageEstimate,
};
