import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const ChapterHeader: React.FC = () => {
  const { currentChapter, updateChapter } = useApp();
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!currentChapter) return null;

  return (
    <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 sm:p-5 transition-colors">
      <div className="space-y-3">
        {/* Top meta tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[10px]">
            Chapter {String(currentChapter.chapterNumber || 1).padStart(2, '0')}
          </span>
          {currentChapter.subject && (
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              {currentChapter.subject}
            </span>
          )}
          {currentChapter.className && (
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              {currentChapter.className}
            </span>
          )}
          {currentChapter.author && (
            <span className="text-stone-400 text-[11px]">By {currentChapter.author}</span>
          )}

          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="ml-auto text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
          >
            <span>{isDetailsExpanded ? 'Hide Chapter Details' : 'Edit Chapter Details'}</span>
            {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Title Inputs */}
        <div className="space-y-1.5">
          <input
            type="text"
            value={currentChapter.title}
            onChange={(e) => updateChapter(currentChapter.id, { title: e.target.value })}
            placeholder="Chapter Title in Hindi (e.g. मेरा विद्यालय)"
            className="w-full text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white bg-transparent border-b border-transparent hover:border-stone-200 dark:hover:border-stone-800 focus:border-amber-500 focus:outline-none transition py-0.5"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />

          <input
            type="text"
            value={currentChapter.subtitle || ''}
            onChange={(e) => updateChapter(currentChapter.id, { subtitle: e.target.value })}
            placeholder="Subtitle or English Translation (e.g. My School)"
            className="w-full text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 bg-transparent border-b border-transparent hover:border-stone-200 dark:hover:border-stone-800 focus:border-amber-500 focus:outline-none transition py-0.5"
          />
        </div>

        {/* Collapsible Extended Chapter Information */}
        {isDetailsExpanded && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-stone-500 text-[11px] mb-1">Subject</label>
              <input
                type="text"
                value={currentChapter.subject || ''}
                onChange={(e) => updateChapter(currentChapter.id, { subject: e.target.value })}
                placeholder="e.g. हिन्दी भाषा"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div>
              <label className="block text-stone-500 text-[11px] mb-1">Class / Grade</label>
              <input
                type="text"
                value={currentChapter.className || ''}
                onChange={(e) => updateChapter(currentChapter.id, { className: e.target.value })}
                placeholder="e.g. कक्षा ६ (Class 6)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div>
              <label className="block text-stone-500 text-[11px] mb-1">Chapter Number</label>
              <input
                type="text"
                value={currentChapter.chapterNumber || ''}
                onChange={(e) => updateChapter(currentChapter.id, { chapterNumber: e.target.value })}
                placeholder="e.g. 1"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div>
              <label className="block text-stone-500 text-[11px] mb-1">Author / Teacher</label>
              <input
                type="text"
                value={currentChapter.author || ''}
                onChange={(e) => updateChapter(currentChapter.id, { author: e.target.value })}
                placeholder="e.g. PC Jha"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-500 text-[11px] mb-1">Optional Cover Image URL</label>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={currentChapter.coverImage || ''}
                  onChange={(e) => updateChapter(currentChapter.id, { coverImage: e.target.value })}
                  placeholder="https://example.com/cover.jpg or data URL"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-stone-500 text-[11px] mb-1">Description / Objectives</label>
              <textarea
                value={currentChapter.description || ''}
                onChange={(e) => updateChapter(currentChapter.id, { description: e.target.value })}
                placeholder="Brief pedagogical summary of this chapter..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
