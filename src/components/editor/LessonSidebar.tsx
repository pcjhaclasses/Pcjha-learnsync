import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const LessonSidebar: React.FC = () => {
  const {
    currentChapter,
    activeLessonId,
    selectLesson,
    addLesson,
    updateLesson,
    duplicateLesson,
    deleteLesson,
    reorderLessons,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!currentChapter) return null;

  const lessons = currentChapter.lessons || [];

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingLessonId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      updateLesson(id, { title: editTitle.trim() });
    }
    setEditingLessonId(null);
  };

  return (
    <div className="w-64 sm:w-72 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex flex-col h-full flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Lessons ({lessons.length})
          </span>
          <button
            onClick={() => addLesson(currentChapter.id)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-2xs transition"
            title="Add Lesson"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lesson</span>
          </button>
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredLessons.map((lesson, idx) => {
          const isActive = lesson.id === activeLessonId;
          const isEditing = editingLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              className={`group rounded-xl p-2 text-xs transition border flex flex-col gap-1 ${
                isActive
                  ? 'bg-amber-50 dark:bg-stone-800 border-amber-300 dark:border-amber-600/60 shadow-xs'
                  : 'border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(lesson.id);
                      if (e.key === 'Escape') setEditingLessonId(null);
                    }}
                    autoFocus
                    className="w-full px-2 py-1 text-xs border rounded border-amber-500 dark:bg-stone-900 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveRename(lesson.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => selectLesson(lesson.id)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                    <span className={`font-medium truncate ${isActive ? 'text-amber-950 dark:text-amber-200 font-bold' : ''}`}>
                      {lesson.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 flex-shrink-0 ml-1">
                    {lesson.sentences.length} sents
                  </span>
                </div>
              )}

              {/* Action buttons shown on hover or active */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 dark:border-stone-700/50 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleStartRename(lesson.id, lesson.title)}
                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => duplicateLesson(lesson.id)}
                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {lessons.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete lesson "${lesson.title}"?`)) {
                          deleteLesson(lesson.id);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => reorderLessons(currentChapter.id, idx, idx - 1)}
                    className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === lessons.length - 1}
                    onClick={() => reorderLessons(currentChapter.id, idx, idx + 1)}
                    className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
