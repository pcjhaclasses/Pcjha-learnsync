import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  StickyNote,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { countWords } from '../../services/tokenizer';

export const SentenceList: React.FC = () => {
  const {
    currentLesson,
    addSentence,
    updateSentence,
    deleteSentence,
    duplicateSentence,
    moveSentence,
  } = useApp();

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  if (!currentLesson) {
    return (
      <div className="p-8 text-center text-stone-400">
        Please select or create a lesson in the sidebar.
      </div>
    );
  }

  const sentences = currentLesson.sentences;

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 pb-20">
      {/* Top summary count & Add button */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {sentences.length} {sentences.length === 1 ? 'Sentence' : 'Sentences'} in this lesson
          </span>
        </div>
        <button
          onClick={() => addSentence(currentLesson.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sentence</span>
        </button>
      </div>

      {sentences.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
            No sentences in this lesson yet.
          </p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Click "+ Add Sentence" to add your first sentence, or use Paste Import / Bulk Editor above.
          </p>
          <button
            onClick={() => addSentence(currentLesson.id)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Add First Sentence
          </button>
        </div>
      ) : (
        sentences.map((sent, index) => {
          const isNoteOpen = expandedNotes[sent.id] || Boolean(sent.note);

          // Validation & Word Counts
          const hindiWordCount = countWords(sent.hindi);
          const pronWordCount = countWords(sent.pronunciation);
          const engWordCount = countWords(sent.english);

          const hasMissingHindi = !sent.hindi.trim();
          const hasMissingPron = !sent.pronunciation.trim();
          const hasMissingEng = !sent.english.trim();
          const hasEmpty = hasMissingHindi && hasMissingPron && hasMissingEng;

          // Word count differences notice (informational warning, non-blocking)
          const hasWordCountDifference =
            !hasMissingHindi &&
            !hasMissingPron &&
            !hasMissingEng &&
            (hindiWordCount !== pronWordCount || hindiWordCount !== engWordCount);

          return (
            <div
              key={sent.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-2xl shadow-2xs hover:border-stone-300 dark:hover:border-stone-700 transition overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 py-2.5 bg-stone-50/70 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    Sentence {String(index + 1).padStart(2, '0')}
                  </span>
                  {hasEmpty ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-medium">
                      <AlertCircle className="w-3 h-3" /> Empty Sentence
                    </span>
                  ) : hasMissingHindi || hasMissingPron || hasMissingEng ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                      <AlertCircle className="w-3 h-3" /> Incomplete layers
                    </span>
                  ) : null}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1 text-stone-400">
                  <button
                    onClick={() => toggleNote(sent.id)}
                    className={`p-1.5 rounded hover:bg-stone-200/60 dark:hover:bg-stone-700 transition ${
                      sent.note ? 'text-amber-600 dark:text-amber-400 font-medium' : 'hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                    title={sent.note ? 'Edit Teacher Note' : 'Add Teacher Note'}
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => duplicateSentence(currentLesson.id, sent.id)}
                    className="p-1.5 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded transition"
                    title="Duplicate Sentence"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === 0}
                    onClick={() => moveSentence(currentLesson.id, sent.id, 'up')}
                    className="p-1.5 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 disabled:opacity-25 rounded transition"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === sentences.length - 1}
                    onClick={() => moveSentence(currentLesson.id, sent.id, 'down')}
                    className="p-1.5 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 disabled:opacity-25 rounded transition"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSentence(currentLesson.id, sent.id)}
                    className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                    title="Delete Sentence"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Inputs: Hindi, Pronunciation, English */}
              <div className="p-4 space-y-3.5 text-xs">
                {/* 1. Hindi Sentence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      1. Hindi Sentence
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {hindiWordCount} {hindiWordCount === 1 ? 'word' : 'words'}
                    </span>
                  </div>
                  <textarea
                    value={sent.hindi}
                    onChange={(e) => updateSentence(currentLesson.id, sent.id, { hindi: e.target.value })}
                    placeholder="उदा. मेरा विद्यालय बहुत सुंदर है।"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 leading-relaxed resize-none"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  />
                </div>

                {/* 2. Hindi Pronunciation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      2. Hindi Pronunciation
                      <span className="text-[10px] font-normal text-stone-400">
                        (Written in Devanagari — NOT Roman/Hinglish)
                      </span>
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {pronWordCount} {pronWordCount === 1 ? 'word' : 'words'}
                    </span>
                  </div>
                  <textarea
                    value={sent.pronunciation}
                    onChange={(e) =>
                      updateSentence(currentLesson.id, sent.id, { pronunciation: e.target.value })
                    }
                    placeholder="उदा. मेरा विद्यालय बहुत सुन्दर है।"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 leading-relaxed resize-none"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  />
                </div>

                {/* 3. English Sentence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-500" />
                      3. English Meaning
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {engWordCount} {engWordCount === 1 ? 'word' : 'words'}
                    </span>
                  </div>
                  <textarea
                    value={sent.english}
                    onChange={(e) => updateSentence(currentLesson.id, sent.id, { english: e.target.value })}
                    placeholder="e.g. My school is very beautiful."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 leading-relaxed resize-none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                {/* Optional Teacher Note */}
                {isNoteOpen && (
                  <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800/60 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5 text-[11px]">
                        <StickyNote className="w-3 h-3 text-amber-500" />
                        Teacher Pedagogical Note (Hidden in presentation)
                      </label>
                      <button
                        onClick={() => toggleNote(sent.id)}
                        className="text-[10px] text-stone-400 hover:text-stone-600"
                      >
                        Hide
                      </button>
                    </div>
                    <textarea
                      value={sent.note || ''}
                      onChange={(e) =>
                        updateSentence(currentLesson.id, sent.id, { note: e.target.value })
                      }
                      placeholder="Notes on grammar, sandhi, pronunciation tips, or vocabulary nuances..."
                      rows={1}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800/60 text-stone-800 dark:text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>
                )}

                {/* Informational Word Count Notice */}
                {hasWordCountDifference && (
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 pt-1">
                    <Info className="w-3 h-3 text-stone-400 flex-shrink-0" />
                    <span>
                      Hindi: {hindiWordCount}w • Pronunciation: {pronWordCount}w • English: {engWordCount}w — Different word counts are normal for translations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Bottom Add button */}
      {sentences.length > 0 && (
        <button
          onClick={() => addSentence(currentLesson.id)}
          className="w-full py-3 border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl flex items-center justify-center gap-2 text-stone-600 dark:text-stone-400 hover:text-amber-600 font-semibold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sentence</span>
        </button>
      )}
    </div>
  );
};
