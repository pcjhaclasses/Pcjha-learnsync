import { openDB, type IDBPDatabase } from 'idb';
import type { Course, TimingSettings, ThemeConfig, PresentationConfig, TypographyConfig } from '../types';
import { SAMPLE_COURSE } from './sampleData';

const DB_NAME = 'PCJhaLearnSync_DB';
const DB_VERSION = 1;
const STORE_COURSES = 'courses';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_COURSES)) {
          db.createObjectStore(STORE_COURSES, { keyPath: 'id' });
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
    // Seed with initial sample course
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
    updatedAt: Date.now(),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_COURSES, id);
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
};
