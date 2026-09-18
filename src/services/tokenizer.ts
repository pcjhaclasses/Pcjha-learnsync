import type { WordToken } from '../types';

/**
 * Tokenizes a sentence into display words while preserving natural punctuation.
 * Punctuation (Hindi danda ।, ॥, periods, commas, quotes, brackets, question marks)
 * remains attached to words so highlighting does not isolate punctuation into empty tokens.
 */
export function tokenizeText(text: string): WordToken[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Split by whitespace while preserving compound words with hyphens
  const rawWords = text.trim().split(/\s+/);

  return rawWords.map((word, index) => {
    // Clean raw text strips external punctuation for search/matching
    const rawClean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

    return {
      id: `w-${index}-${encodeURIComponent(word)}`,
      index,
      text: word,
      raw: rawClean || word,
    };
  });
}

/**
 * Counts words accurately in any text layer
 */
export function countWords(text: string): number {
  return tokenizeText(text).length;
}
