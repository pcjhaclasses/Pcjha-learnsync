import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Headphones,
  BrainCircuit,
  GraduationCap,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { StorageService } from '../../services/storage';
import { tokenizeText } from '../../services/tokenizer';
import type { Sentence, QuizQuestion, QuizResult } from '../../types';

type LearningTab = 'reader' | 'listen' | 'vocab' | 'quiz';

export const LearningView: React.FC = () => {
  const { currentChapter, currentLesson, setView } = useApp();

  const [activeTab, setActiveTab] = useState<LearningTab>('reader');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);

  // Listen Mode State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listenSpeechRate, setListenSpeechRate] = useState<number>(0.9);
  const [activeWordTokenIndex, setActiveWordTokenIndex] = useState<number>(-1);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Vocabulary Flashcards State
  const [vocabIndex, setVocabIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const sentences = currentLesson?.sentences || [];
  const currentSentence: Sentence | undefined = sentences[activeSentenceIndex];

  // Stop speech when unmounting or switching tabs
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  // Extract vocabulary words from lesson sentences
  const vocabList = useMemo(() => {
    const list: Array<{ id: string; word: string; pron: string; meaning: string; example: string }> = [];
    sentences.forEach((s) => {
      const hTokens = tokenizeText(s.hindi);
      const pTokens = tokenizeText(s.pronunciation);
      const eTokens = tokenizeText(s.english);

      hTokens.forEach((ht, i) => {
        if (ht.text.length > 1 && !list.some((item) => item.word === ht.text)) {
          list.push({
            id: `${s.id}-${i}`,
            word: ht.text,
            pron: pTokens[i]?.text || ht.text,
            meaning: eTokens[i]?.text || s.english,
            example: s.hindi,
          });
        }
      });
    });
    return list;
  }, [sentences]);

  // Generate Interactive Quiz Questions from sentences
  const generateQuiz = () => {
    if (sentences.length < 2) return;

    const questions: QuizQuestion[] = [];

    sentences.forEach((s, sIdx) => {
      // Question Type A: Hindi to English
      const otherSentences = sentences.filter((_, idx) => idx !== sIdx);
      const wrongOptions = otherSentences
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((o) => o.english);

      const allOptions = [s.english, ...wrongOptions].sort(() => 0.5 - Math.random());
      const correctIdx = allOptions.indexOf(s.english);

      questions.push({
        id: `q-${s.id}-a`,
        sentenceId: s.id,
        type: 'multiple-choice',
        question: `What is the English meaning of: "${s.hindi}"?`,
        options: allOptions,
        correctAnswer: correctIdx,
        explanation: `"${s.hindi}" (${s.pronunciation}) translates to "${s.english}".`,
      });
    });

    const randomized = questions.sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuizQuestions(randomized);
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
  };

  useEffect(() => {
    if (activeTab === 'quiz') {
      generateQuiz();
    }
  }, [activeTab, sentences.length]);

  // Speech Synthesis for Listen Mode
  const playSentenceAudio = (sentence: Sentence) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence.hindi);
    utterance.lang = 'hi-IN';
    utterance.rate = listenSpeechRate;

    // Word boundary event for karaoke highlight
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        const hTokens = tokenizeText(sentence.hindi);
        let curChar = 0;
        for (let i = 0; i < hTokens.length; i++) {
          if (charIdx >= curChar && charIdx < curChar + hTokens[i].text.length + 1) {
            setActiveWordTokenIndex(i);
            break;
          }
          curChar += hTokens[i].text.length + 1;
        }
      }
    };

    utterance.onend = () => {
      setActiveWordTokenIndex(-1);
      // Auto advance to next sentence if still in listening mode
      if (isListening && activeSentenceIndex < sentences.length - 1) {
        setTimeout(() => {
          setActiveSentenceIndex((prev) => prev + 1);
        }, 1200);
      } else {
        setIsListening(false);
      }
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsListening(true);
  };

  const toggleListen = () => {
    if (isListening) {
      window.speechSynthesis.cancel();
      setIsListening(false);
      setActiveWordTokenIndex(-1);
    } else if (currentSentence) {
      playSentenceAudio(currentSentence);
    }
  };

  // When active sentence changes in Listen mode, play next
  useEffect(() => {
    if (isListening && currentSentence) {
      playSentenceAudio(currentSentence);
    }
  }, [activeSentenceIndex]);

  // Handle Quiz Answer Submit
  const handleSelectQuizAnswer = (optionIdx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswerIdx(optionIdx);
    setIsAnswerSubmitted(true);

    const curQ = quizQuestions[currentQuestionIdx];
    if (optionIdx === curQ.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
      setSelectedAnswerIdx(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      if (currentChapter) {
        const curQ = quizQuestions[currentQuestionIdx];
        const isCurrentCorrect = selectedAnswerIdx !== null && curQ && String(selectedAnswerIdx) === String(curQ.correctAnswer);
        const result: QuizResult = {
          id: `quiz-${Date.now()}`,
          chapterId: currentChapter.id,
          lessonId: currentLesson?.id || '',
          score: score + (isCurrentCorrect ? 1 : 0),
          totalQuestions: quizQuestions.length,
          completedAt: Date.now(),
          answers: {},
        };
        StorageService.saveQuizResult(result);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-6 border-b border-stone-800 bg-stone-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <div className="h-4 w-px bg-stone-800" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Student Learning Platform</h1>
              <p className="text-[11px] text-stone-400">
                {currentChapter?.title || 'Chapter'} • {currentLesson?.title || 'Lesson'}
              </p>
            </div>
          </div>
        </div>

        {/* Learning Navigation Tabs */}
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'reader' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Reader</span>
          </button>

          <button
            onClick={() => setActiveTab('listen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'listen' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Listen Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'vocab' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Vocabulary ({vocabList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'quiz' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Quiz Engine</span>
          </button>
        </div>
      </header>

      {/* Main Learning Arena */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* 1. BOOK READER TAB */}
        {activeTab === 'reader' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Full Chapter Reader ({sentences.length} Sentences)
              </span>
              <button
                onClick={() => setView('presentation')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Presentation Mode</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {sentences.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSentenceIndex(idx)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                    activeSentenceIndex === idx
                      ? 'bg-stone-900 border-amber-500/60 shadow-xl ring-1 ring-amber-500/20'
                      : 'bg-stone-900/40 border-stone-800 hover:bg-stone-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="w-7 h-7 rounded-xl bg-stone-800 text-stone-400 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-xl font-bold font-hindi text-white leading-relaxed">
                        {s.hindi}
                      </p>
                      <p className="text-sm font-hindi text-amber-300/80">
                        {s.pronunciation}
                      </p>
                      <p className="text-sm text-stone-400">
                        {s.english}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. LISTEN & KARAOKE MODE */}
        {activeTab === 'listen' && (
          <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-6 text-center">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Sentence {activeSentenceIndex + 1} of {sentences.length}</span>
              <div className="flex items-center gap-2">
                <span>Speed:</span>
                {[0.75, 0.9, 1.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setListenSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      listenSpeechRate === rate ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Big Sentence Display */}
            {currentSentence ? (
              <div className="py-8 space-y-6">
                {/* Hindi Layer with word karaoke */}
                <div className="text-3xl sm:text-4xl font-black font-hindi leading-relaxed flex flex-wrap justify-center gap-3">
                  {tokenizeText(currentSentence.hindi).map((t, i) => {
                    const isWordSpeaking = activeWordTokenIndex === i;
                    return (
                      <span
                        key={t.id}
                        className={`px-2.5 py-1 rounded-xl transition-all duration-150 ${
                          isWordSpeaking
                            ? 'bg-amber-500 text-stone-950 scale-110 shadow-xl font-black'
                            : 'text-white'
                        }`}
                      >
                        {t.text}
                      </span>
                    );
                  })}
                </div>

                {/* Pronunciation Layer */}
                <p className="text-lg font-hindi text-amber-300/80 font-medium">
                  {currentSentence.pronunciation}
                </p>

                {/* English Layer */}
                <p className="text-base text-stone-400 max-w-xl mx-auto">
                  {currentSentence.english}
                </p>
              </div>
            ) : (
              <div className="py-12 text-stone-500 text-sm">No sentences available.</div>
            )}

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-800">
              <button
                onClick={() => setActiveSentenceIndex((i) => Math.max(0, i - 1))}
                disabled={activeSentenceIndex === 0}
                className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition disabled:opacity-30"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={toggleListen}
                className="px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xl hover:scale-105 transition transform flex items-center gap-2.5"
              >
                {isListening ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isListening ? 'Pause Reading' : 'Listen with Audio'}</span>
              </button>

              <button
                onClick={() => setActiveSentenceIndex((i) => Math.min(sentences.length - 1, i + 1))}
                disabled={activeSentenceIndex >= sentences.length - 1}
                className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition disabled:opacity-30"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. VOCABULARY FLASHCARDS */}
        {activeTab === 'vocab' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Word {vocabIndex + 1} of {vocabList.length}</span>
              <span className="font-semibold text-emerald-400">
                {masteredWords.size} / {vocabList.length} Mastered
              </span>
            </div>

            {vocabList.length > 0 ? (
              <div className="flex flex-col items-center space-y-6">
                {/* 3D Flashcard */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-md h-72 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl p-8 flex flex-col justify-between items-center text-center cursor-pointer hover:border-amber-500/50 transition-all transform hover:scale-102"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                    {isFlipped ? 'English Translation' : 'Hindi & Pronunciation (Click to Flip)'}
                  </span>

                  {!isFlipped ? (
                    <div className="space-y-3 my-auto">
                      <h3 className="text-4xl font-black font-hindi text-white">
                        {vocabList[vocabIndex]?.word}
                      </h3>
                      <p className="text-base font-hindi text-amber-300">
                        {vocabList[vocabIndex]?.pron}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 my-auto">
                      <h3 className="text-2xl font-bold text-white">
                        {vocabList[vocabIndex]?.meaning}
                      </h3>
                      <p className="text-xs font-hindi text-stone-400 italic">
                        "{vocabList[vocabIndex]?.example}"
                      </p>
                    </div>
                  )}

                  <span className="text-[11px] text-stone-500">
                    Click anywhere on card to flip
                  </span>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const curId = vocabList[vocabIndex]?.id;
                      if (curId) {
                        setMasteredWords((prev) => {
                          const next = new Set(prev);
                          next.delete(curId);
                          return next;
                        });
                      }
                      setVocabIndex((i) => (i + 1) % vocabList.length);
                      setIsFlipped(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
                  >
                    Need Practice
                  </button>

                  <button
                    onClick={() => {
                      const curId = vocabList[vocabIndex]?.id;
                      if (curId) {
                        setMasteredWords((prev) => new Set(prev).add(curId));
                      }
                      setVocabIndex((i) => (i + 1) % vocabList.length);
                      setIsFlipped(false);
                    }}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>I Know This!</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-500 text-sm">
                No vocabulary found in this chapter.
              </div>
            )}
          </div>
        )}

        {/* 4. INTERACTIVE QUIZ ENGINE */}
        {activeTab === 'quiz' && (
          <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-6">
            {!isQuizCompleted ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-stone-800 text-xs">
                  <span className="font-bold text-amber-500 uppercase tracking-wider">
                    Question {currentQuestionIdx + 1} of {quizQuestions.length}
                  </span>
                  <span className="font-mono text-stone-400">Score: {score}</span>
                </div>

                {quizQuestions[currentQuestionIdx] && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">
                      {quizQuestions[currentQuestionIdx].question}
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {(quizQuestions[currentQuestionIdx]?.options || []).map((opt, oIdx) => {
                        const isCorrect = String(oIdx) === String(quizQuestions[currentQuestionIdx]?.correctAnswer);
                        const isSelected = selectedAnswerIdx === oIdx;

                        let btnStyle = 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-200';
                        if (isAnswerSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isSelected) {
                            btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isAnswerSubmitted}
                            onClick={() => handleSelectQuizAnswer(oIdx)}
                            className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Banner */}
                    {isAnswerSubmitted && (
                      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 animate-in fade-in">
                        <p className="text-xs text-stone-300">
                          {quizQuestions[currentQuestionIdx].explanation}
                        </p>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNextQuizQuestion}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition"
                          >
                            <span>Next Question</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Quiz Summary Screen */
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
                <p className="text-sm text-stone-400">
                  You scored <span className="text-amber-400 font-bold text-base">{score}</span> out of{' '}
                  <span className="font-bold">{quizQuestions.length}</span> (
                  {Math.round((score / quizQuestions.length) * 100)}%)
                </p>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={generateQuiz}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('reader')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
                  >
                    Back to Reader
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
