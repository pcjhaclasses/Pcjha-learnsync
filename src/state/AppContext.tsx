import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Course, Chapter, Lesson, Sentence, AppView, EditorSubTab } from '../types';
import {
  getAllCourses,
  saveCourse,
  StorageService,
  loadActiveSelection,
  saveActiveSelection,
} from '../services/storage';

interface AppContextType {
  courses: Course[];
  currentCourse: Course | null;
  currentChapter: Chapter | null;
  currentLesson: Lesson | null;
  activeCourseId: string;
  activeChapterId: string;
  activeLessonId: string;
  view: AppView;
  setView: (view: AppView) => void;
  editorSubTab: EditorSubTab;
  setEditorSubTab: (tab: EditorSubTab) => void;
  
  // Selection
  selectCourse: (id: string) => void;
  selectChapter: (id: string) => void;
  selectLesson: (id: string) => void;

  // Chapter CRUD
  addChapter: (title?: string) => string;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  duplicateChapter: (chapterId: string) => void;
  deleteChapter: (chapterId: string) => void;
  reorderChapters: (startIndex: number, endIndex: number) => void;

  // Lesson CRUD
  addLesson: (chapterId: string, title?: string) => string;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  duplicateLesson: (lessonId: string) => void;
  deleteLesson: (lessonId: string) => void;
  reorderLessons: (chapterId: string, startIndex: number, endIndex: number) => void;

  // Sentence CRUD
  addSentence: (lessonId: string, initial?: Partial<Sentence>) => string;
  updateSentence: (lessonId: string, sentenceId: string, updates: Partial<Sentence>) => void;
  deleteSentence: (lessonId: string, sentenceId: string) => void;
  duplicateSentence: (lessonId: string, sentenceId: string) => void;
  moveSentence: (lessonId: string, sentenceId: string, direction: 'up' | 'down') => void;
  bulkUpdateSentences: (lessonId: string, sentences: Sentence[]) => void;
  importSentences: (lessonId: string, newSentences: Omit<Sentence, 'id'>[], mode: 'append' | 'replace') => void;

  // History / Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Array<{
    chapterId: string;
    chapterTitle: string;
    lessonId: string;
    lessonTitle: string;
    sentenceId?: string;
    matchedText: string;
    field: 'hindi' | 'pronunciation' | 'english' | 'chapter' | 'lesson';
  }>;

  // Autosave status
  isSaving: boolean;
  lastSaved: number | null;
  hasUnsavedRecovery: boolean;
  applyRecoveredDraft: () => void;
  discardRecoveredDraft: () => void;

  // Course management
  createCourse: (title: string, author?: string) => string;
  duplicateCurrentCourse: () => void;
  importFullCourse: (course: Course) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [view, setView] = useState<AppView>('editor');
  const [editorSubTab, setEditorSubTab] = useState<EditorSubTab>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Autosave & Telemetry
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasUnsavedRecovery, setHasUnsavedRecovery] = useState<boolean>(false);
  const recoveredCourseRef = useRef<Course | null>(null);

  // Undo / Redo history stacks (Course snapshots)
  const historyPastRef = useRef<Course[]>([]);
  const historyFutureRef = useRef<Course[]>([]);
  const [historyVersion, setHistoryVersion] = useState<number>(0);

  const saveTimerRef = useRef<number | null>(null);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      const all = await getAllCourses();
      setCourses(all);

      // Check draft recovery
      const draft = StorageService.checkDraftRecovery();
      if (draft && draft.course) {
        recoveredCourseRef.current = draft.course;
        setHasUnsavedRecovery(true);
      }

      const savedSelection = loadActiveSelection();
      if (savedSelection && all.some((c) => c.id === savedSelection.courseId)) {
        setActiveCourseId(savedSelection.courseId);
        const activeCourse = all.find((c) => c.id === savedSelection.courseId)!;
        if (activeCourse.chapters.some((ch) => ch.id === savedSelection.chapterId)) {
          setActiveChapterId(savedSelection.chapterId);
          const activeCh = activeCourse.chapters.find((ch) => ch.id === savedSelection.chapterId)!;
          if (activeCh.lessons.some((l) => l.id === savedSelection.lessonId)) {
            setActiveLessonId(savedSelection.lessonId);
          } else if (activeCh.lessons.length > 0) {
            setActiveLessonId(activeCh.lessons[0].id);
          }
        } else if (activeCourse.chapters.length > 0) {
          setActiveChapterId(activeCourse.chapters[0].id);
          setActiveLessonId(activeCourse.chapters[0].lessons[0]?.id || '');
        }
      } else if (all.length > 0) {
        setActiveCourseId(all[0].id);
        if (all[0].chapters.length > 0) {
          setActiveChapterId(all[0].chapters[0].id);
          setActiveLessonId(all[0].chapters[0].lessons[0]?.id || '');
        }
      }
    }
    init();
  }, []);

  // Sync active selection to localStorage
  useEffect(() => {
    if (activeCourseId) {
      saveActiveSelection({
        courseId: activeCourseId,
        chapterId: activeChapterId,
        lessonId: activeLessonId,
      });
    }
  }, [activeCourseId, activeChapterId, activeLessonId]);

  const currentCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || null;
  const currentChapter = currentCourse?.chapters.find((ch) => ch.id === activeChapterId) || currentCourse?.chapters[0] || null;
  const currentLesson = currentChapter?.lessons.find((l) => l.id === activeLessonId) || currentChapter?.lessons[0] || null;

  // Debounced Autosave to IndexedDB
  const queueSave = useCallback((updatedCourse: Course) => {
    setIsSaving(true);
    StorageService.saveDraft(updatedCourse);

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      await saveCourse(updatedCourse);
      setIsSaving(false);
      setLastSaved(Date.now());
      StorageService.clearDraftRecovery();
      saveTimerRef.current = null;
    }, 600);
  }, []);

  // Mutate Course with Undo/Redo tracking
  const updateCourseWithHistory = useCallback((updater: (prev: Course) => Course, skipHistory = false) => {
    setCourses((prevCourses) => {
      const activeIdx = prevCourses.findIndex((c) => c.id === activeCourseId);
      if (activeIdx === -1) return prevCourses;

      const oldCourse = prevCourses[activeIdx];
      const newCourse = updater(oldCourse);

      if (!skipHistory) {
        historyPastRef.current.push(JSON.parse(JSON.stringify(oldCourse)));
        if (historyPastRef.current.length > 50) {
          historyPastRef.current.shift();
        }
        historyFutureRef.current = [];
        setHistoryVersion((v) => v + 1);
      }

      const nextCourses = [...prevCourses];
      nextCourses[activeIdx] = newCourse;
      queueSave(newCourse);
      return nextCourses;
    });
  }, [activeCourseId, queueSave]);

  const undo = useCallback(() => {
    if (historyPastRef.current.length === 0 || !currentCourse) return;
    const previousState = historyPastRef.current.pop()!;
    historyFutureRef.current.push(JSON.parse(JSON.stringify(currentCourse)));
    setHistoryVersion((v) => v + 1);

    setCourses((prev) =>
      prev.map((c) => (c.id === previousState.id ? previousState : c))
    );
    queueSave(previousState);
  }, [currentCourse, queueSave]);

  const redo = useCallback(() => {
    if (historyFutureRef.current.length === 0 || !currentCourse) return;
    const nextState = historyFutureRef.current.pop()!;
    historyPastRef.current.push(JSON.parse(JSON.stringify(currentCourse)));
    setHistoryVersion((v) => v + 1);

    setCourses((prev) =>
      prev.map((c) => (c.id === nextState.id ? nextState : c))
    );
    queueSave(nextState);
  }, [currentCourse, queueSave]);

  // Global Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when inside an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Selection handlers
  const selectCourse = (id: string) => {
    setActiveCourseId(id);
    const target = courses.find((c) => c.id === id);
    if (target && target.chapters.length > 0) {
      setActiveChapterId(target.chapters[0].id);
      setActiveLessonId(target.chapters[0].lessons[0]?.id || '');
    }
  };

  const selectChapter = (id: string) => {
    setActiveChapterId(id);
    const targetChapter = currentCourse?.chapters.find((ch) => ch.id === id);
    if (targetChapter && targetChapter.lessons.length > 0) {
      setActiveLessonId(targetChapter.lessons[0].id);
    }
  };

  const selectLesson = (id: string) => {
    setActiveLessonId(id);
  };

  // Chapter CRUD
  const addChapter = (title = 'नया अध्याय (New Chapter)') => {
    const newId = `chap-${Date.now()}`;
    const newLessonId = `less-${Date.now()}`;
    const newChapter: Chapter = {
      id: newId,
      title,
      subtitle: '',
      subject: currentChapter?.subject || 'हिन्दी',
      className: currentChapter?.className || 'कक्षा ६',
      chapterNumber: (currentCourse?.chapters.length || 0) + 1,
      lessons: [
        {
          id: newLessonId,
          title: 'पाठ १: परिचय (Introduction)',
          sentences: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: [...course.chapters, newChapter],
    }));

    setActiveChapterId(newId);
    setActiveLessonId(newLessonId);
    return newId;
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, ...updates, updatedAt: Date.now() } : ch
      ),
    }));
  };

  const duplicateChapter = (chapterId: string) => {
    const ch = currentCourse?.chapters.find((c) => c.id === chapterId);
    if (!ch) return;

    const dupId = `chap-${Date.now()}`;
    const duplicated: Chapter = {
      ...JSON.parse(JSON.stringify(ch)),
      id: dupId,
      title: `${ch.title} (प्रतिलिपि / Copy)`,
      chapterNumber: (currentCourse?.chapters.length || 0) + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lessons: ch.lessons.map((l, lIdx) => ({
        ...l,
        id: `less-${Date.now()}-${lIdx}`,
        sentences: l.sentences.map((s, sIdx) => ({
          ...s,
          id: `sent-${Date.now()}-${sIdx}`,
        })),
      })),
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: [...course.chapters, duplicated],
    }));
    setActiveChapterId(dupId);
  };

  const deleteChapter = (chapterId: string) => {
    if (!currentCourse || currentCourse.chapters.length <= 1) return;
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.filter((c) => c.id !== chapterId),
    }));

    const remaining = currentCourse.chapters.filter((c) => c.id !== chapterId);
    if (remaining.length > 0) {
      setActiveChapterId(remaining[0].id);
      setActiveLessonId(remaining[0].lessons[0]?.id || '');
    }
  };

  const reorderChapters = (startIndex: number, endIndex: number) => {
    updateCourseWithHistory((course) => {
      const items = [...course.chapters];
      const [reordered] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, reordered);
      return { ...course, chapters: items };
    });
  };

  // Lesson CRUD
  const addLesson = (chapterId: string, title = 'नया पाठ (New Lesson)') => {
    const newId = `less-${Date.now()}`;
    const newLesson: Lesson = {
      id: newId,
      title,
      sentences: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === chapterId
          ? { ...ch, lessons: [...ch.lessons, newLesson], updatedAt: Date.now() }
          : ch
      ),
    }));
    setActiveLessonId(newId);
    return newId;
  };

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId ? { ...l, ...updates, updatedAt: Date.now() } : l
        ),
      })),
    }));
  };

  const duplicateLesson = (lessonId: string) => {
    if (!currentChapter) return;
    const l = currentChapter.lessons.find((item) => item.id === lessonId);
    if (!l) return;

    const dupId = `less-${Date.now()}`;
    const duplicated: Lesson = {
      ...JSON.parse(JSON.stringify(l)),
      id: dupId,
      title: `${l.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sentences: l.sentences.map((s, idx) => ({
        ...s,
        id: `sent-${Date.now()}-${idx}`,
      })),
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === currentChapter.id
          ? { ...ch, lessons: [...ch.lessons, duplicated], updatedAt: Date.now() }
          : ch
      ),
    }));
    setActiveLessonId(dupId);
  };

  const deleteLesson = (lessonId: string) => {
    if (!currentChapter || currentChapter.lessons.length <= 1) return;
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === currentChapter.id
          ? { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId), updatedAt: Date.now() }
          : ch
      ),
    }));

    const remaining = currentChapter.lessons.filter((l) => l.id !== lessonId);
    if (remaining.length > 0) {
      setActiveLessonId(remaining[0].id);
    }
  };

  const reorderLessons = (chapterId: string, startIndex: number, endIndex: number) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const items = [...ch.lessons];
        const [reordered] = items.splice(startIndex, 1);
        items.splice(endIndex, 0, reordered);
        return { ...ch, lessons: items, updatedAt: Date.now() };
      }),
    }));
  };

  // Sentence CRUD
  const addSentence = (lessonId: string, initial?: Partial<Sentence>) => {
    const newId = `sent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSentence: Sentence = {
      id: newId,
      hindi: initial?.hindi || '',
      pronunciation: initial?.pronunciation || '',
      english: initial?.english || '',
      note: initial?.note || '',
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, sentences: [...l.sentences, newSentence], updatedAt: Date.now() }
            : l
        ),
      })),
    }));
    return newId;
  };

  const updateSentence = (lessonId: string, sentenceId: string, updates: Partial<Sentence>) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId
            ? {
                ...l,
                sentences: l.sentences.map((s) => (s.id === sentenceId ? { ...s, ...updates } : s)),
                updatedAt: Date.now(),
              }
            : l
        ),
      })),
    }));
  };

  const deleteSentence = (lessonId: string, sentenceId: string) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, sentences: l.sentences.filter((s) => s.id !== sentenceId), updatedAt: Date.now() }
            : l
        ),
      })),
    }));
  };

  const duplicateSentence = (lessonId: string, sentenceId: string) => {
    if (!currentLesson) return;
    const sentIdx = currentLesson.sentences.findIndex((s) => s.id === sentenceId);
    if (sentIdx === -1) return;

    const source = currentLesson.sentences[sentIdx];
    const newId = `sent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: Sentence = {
      ...source,
      id: newId,
    };

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const sents = [...l.sentences];
          sents.splice(sentIdx + 1, 0, duplicated);
          return { ...l, sentences: sents, updatedAt: Date.now() };
        }),
      })),
    }));
  };

  const moveSentence = (lessonId: string, sentenceId: string, direction: 'up' | 'down') => {
    if (!currentLesson) return;
    const idx = currentLesson.sentences.findIndex((s) => s.id === sentenceId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentLesson.sentences.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const sents = [...l.sentences];
          const [moved] = sents.splice(idx, 1);
          sents.splice(targetIdx, 0, moved);
          return { ...l, sentences: sents, updatedAt: Date.now() };
        }),
      })),
    }));
  };

  const bulkUpdateSentences = (lessonId: string, sentences: Sentence[]) => {
    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId ? { ...l, sentences, updatedAt: Date.now() } : l
        ),
      })),
    }));
  };

  const importSentences = (
    lessonId: string,
    newSentences: Omit<Sentence, 'id'>[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: Sentence[] = newSentences.map((s, idx) => ({
      ...s,
      id: `sent-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    updateCourseWithHistory((course) => ({
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const sentences = mode === 'replace' ? formatted : [...l.sentences, ...formatted];
          return { ...l, sentences, updatedAt: Date.now() };
        }),
      })),
    }));
  };

  // Course Management
  const createCourse = (title: string, author = 'PC Jha') => {
    const newCourseId = `course-${Date.now()}`;
    const newChapId = `chap-${Date.now()}`;
    const newLessonId = `less-${Date.now()}`;

    const newCourse: Course = {
      id: newCourseId,
      title,
      author,
      description: '',
      themeId: 'classroom',
      chapters: [
        {
          id: newChapId,
          title: 'अध्याय १ (Chapter 1)',
          subject: 'हिन्दी',
          className: 'कक्षा ६',
          chapterNumber: 1,
          lessons: [
            {
              id: newLessonId,
              title: 'पाठ १: परिचय (Introduction)',
              sentences: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setCourses((prev) => [...prev, newCourse]);
    setActiveCourseId(newCourseId);
    setActiveChapterId(newChapId);
    setActiveLessonId(newLessonId);
    queueSave(newCourse);
    return newCourseId;
  };

  const duplicateCurrentCourse = () => {
    if (!currentCourse) return;
    const newId = `course-${Date.now()}`;
    const duplicated: Course = {
      ...JSON.parse(JSON.stringify(currentCourse)),
      id: newId,
      title: `${currentCourse.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCourses((prev) => [...prev, duplicated]);
    setActiveCourseId(newId);
    queueSave(duplicated);
  };

  const importFullCourse = (course: Course) => {
    setCourses((prev) => {
      const filtered = prev.filter((c) => c.id !== course.id);
      return [...filtered, course];
    });
    setActiveCourseId(course.id);
    if (course.chapters.length > 0) {
      setActiveChapterId(course.chapters[0].id);
      setActiveLessonId(course.chapters[0].lessons[0]?.id || '');
    }
    queueSave(course);
  };

  // Recover Draft Handlers
  const applyRecoveredDraft = () => {
    if (recoveredCourseRef.current) {
      const recovered = recoveredCourseRef.current;
      setCourses((prev) => {
        const filtered = prev.filter((c) => c.id !== recovered.id);
        return [...filtered, recovered];
      });
      setActiveCourseId(recovered.id);
      queueSave(recovered);
      setHasUnsavedRecovery(false);
      StorageService.clearDraftRecovery();
    }
  };

  const discardRecoveredDraft = () => {
    setHasUnsavedRecovery(false);
    StorageService.clearDraftRecovery();
  };

  // Search Implementation across chapters, lessons, and sentences
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || !currentCourse) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{
      chapterId: string;
      chapterTitle: string;
      lessonId: string;
      lessonTitle: string;
      sentenceId?: string;
      matchedText: string;
      field: 'hindi' | 'pronunciation' | 'english' | 'chapter' | 'lesson';
    }> = [];

    for (const ch of currentCourse.chapters) {
      if (ch.title.toLowerCase().includes(q)) {
        results.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          lessonId: ch.lessons[0]?.id || '',
          lessonTitle: ch.lessons[0]?.title || '',
          matchedText: ch.title,
          field: 'chapter',
        });
      }

      for (const lesson of ch.lessons) {
        if (lesson.title.toLowerCase().includes(q)) {
          results.push({
            chapterId: ch.id,
            chapterTitle: ch.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            matchedText: lesson.title,
            field: 'lesson',
          });
        }

        for (const s of lesson.sentences) {
          if (s.hindi.toLowerCase().includes(q)) {
            results.push({
              chapterId: ch.id,
              chapterTitle: ch.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              sentenceId: s.id,
              matchedText: s.hindi,
              field: 'hindi',
            });
          } else if (s.pronunciation.toLowerCase().includes(q)) {
            results.push({
              chapterId: ch.id,
              chapterTitle: ch.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              sentenceId: s.id,
              matchedText: s.pronunciation,
              field: 'pronunciation',
            });
          } else if (s.english.toLowerCase().includes(q)) {
            results.push({
              chapterId: ch.id,
              chapterTitle: ch.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              sentenceId: s.id,
              matchedText: s.english,
              field: 'english',
            });
          }
        }
      }
    }
    return results;
  }, [searchQuery, currentCourse]);

  return (
    <AppContext.Provider
      value={{
        courses,
        currentCourse,
        currentChapter,
        currentLesson,
        activeCourseId,
        activeChapterId,
        activeLessonId,
        view,
        setView,
        editorSubTab,
        setEditorSubTab,
        selectCourse,
        selectChapter,
        selectLesson,
        addChapter,
        updateChapter,
        duplicateChapter,
        deleteChapter,
        reorderChapters,
        addLesson,
        updateLesson,
        duplicateLesson,
        deleteLesson,
        reorderLessons,
        addSentence,
        updateSentence,
        deleteSentence,
        duplicateSentence,
        moveSentence,
        bulkUpdateSentences,
        importSentences,
        undo,
        redo,
        canUndo: historyVersion >= 0 && historyPastRef.current.length > 0,
        canRedo: historyVersion >= 0 && historyFutureRef.current.length > 0,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSaving,
        lastSaved,
        hasUnsavedRecovery,
        applyRecoveredDraft,
        discardRecoveredDraft,
        createCourse,
        duplicateCurrentCourse,
        importFullCourse,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
