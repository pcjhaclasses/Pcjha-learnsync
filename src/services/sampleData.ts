import type { Course, Chapter, Lesson, Sentence } from '../types';

export const SAMPLE_SENTENCES: Sentence[] = [
  {
    id: 'sample-sent-1',
    hindi: 'मेरा विद्यालय बहुत सुंदर है।',
    pronunciation: 'मेरा विद्यालय बहुत सुन्दर है।',
    english: 'My school is very beautiful.',
    note: 'Emphasize the correct pronunciation of "सुन्दर" with the anusvara/n sound.',
  },
  {
    id: 'sample-sent-2',
    hindi: 'यहाँ एक बड़ा हरा-भरा खेल का मैदान है।',
    pronunciation: 'यहाँ एक बड़ा हरा-भरा खेल का मैदान है।',
    english: 'There is a large lush green playground here.',
    note: 'Note the compound word "हरा-भरा" joined with hyphen.',
  },
  {
    id: 'sample-sent-3',
    hindi: 'सभी शिक्षक हमें स्नेह और लगन से पढ़ाते हैं।',
    pronunciation: 'सभी शिक्षक हमें स्नेह और लगन से पढ़ाते हैं।',
    english: 'All teachers teach us with affection and dedication.',
    note: '"स्नेह" denotes love/affection and "लगन" denotes dedication/perseverance.',
  },
  {
    id: 'sample-sent-4',
    hindi: 'हमारे विद्यालय में एक विशाल पुस्तकालय भी है।',
    pronunciation: 'हमारे विद्यालय में एक विशाल पुस्तकालय भी है।',
    english: 'There is also a vast library in our school.',
    note: '"पुस्तकालय" is composed of "पुस्तक" (book) + "आलय" (place/abode).',
  },
  {
    id: 'sample-sent-5',
    hindi: 'मुझे अपने विद्यालय पर बहुत गर्व है।',
    pronunciation: 'मुझे अपने विद्यालय पर बहुत गर्व है।',
    english: 'I am very proud of my school.',
    note: 'Closing thought on school pride and student gratitude.',
  },
];

export const SAMPLE_LESSON: Lesson = {
  id: 'sample-lesson-1',
  title: 'पाठ १: परिचय (Introduction)',
  sentences: SAMPLE_SENTENCES,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const SAMPLE_CHAPTER: Chapter = {
  id: 'sample-chapter-1',
  title: 'मेरा विद्यालय',
  subtitle: 'My School',
  subject: 'हिन्दी भाषा (Hindi Language)',
  className: 'कक्षा ६ (Class 6)',
  chapterNumber: 1,
  author: 'PC Jha',
  description: 'A foundational lesson introducing school vocabulary, pronunciation nuances in Devanagari, and English comprehension.',
  coverImage: '',
  lessons: [SAMPLE_LESSON],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const SAMPLE_COURSE: Course = {
  id: 'sample-course-1',
  title: 'Hindi Learning — Class 6',
  author: 'PC Jha',
  description: 'Structured word-by-word lessons for Devanagari Hindi language proficiency.',
  themeId: 'classroom',
  chapters: [SAMPLE_CHAPTER],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
