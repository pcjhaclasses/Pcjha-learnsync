import type { Chapter, Lesson, Sentence, ThemeConfig, TypographyConfig } from '../types';

export interface PasteParseResult {
  sentences: Omit<Sentence, 'id'>[];
  completeCount: number;
  incompleteGroups: string[][];
  warning: string | null;
}

/**
 * Robust paste analyzer supporting:
 * - Line 1: Hindi
 * - Line 2: Hindi Pronunciation (in Devanagari script, never transliterated)
 * - Line 3: English
 * - Blank lines separating groups
 * - Complete and incomplete validation with actionable warnings
 */
export function analyzePasteContent(text: string): PasteParseResult {
  if (!text || !text.trim()) {
    return {
      sentences: [],
      completeCount: 0,
      incompleteGroups: [],
      warning: null,
    };
  }

  const rawLines = text.split(/\r?\n/).map((l) => l.trim());
  const rawGroups: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of rawLines) {
    if (line === '') {
      if (currentBlock.length > 0) {
        rawGroups.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    rawGroups.push(currentBlock);
  }

  const processedGroups: string[][] = [];

  for (const group of rawGroups) {
    if (group.length > 3 && group.length % 3 === 0) {
      for (let i = 0; i < group.length; i += 3) {
        processedGroups.push(group.slice(i, i + 3));
      }
    } else {
      processedGroups.push(group);
    }
  }

  const sentences: Omit<Sentence, 'id'>[] = [];
  const incompleteGroups: string[][] = [];

  for (const grp of processedGroups) {
    if (grp.length >= 3) {
      sentences.push({
        hindi: grp[0],
        pronunciation: grp[1],
        english: grp[2],
        note: grp.length > 3 ? grp.slice(3).join('\n') : undefined,
      });
    } else if (grp.length > 0) {
      incompleteGroups.push(grp);
    }
  }

  let warning: string | null = null;
  if (incompleteGroups.length > 0) {
    const completeText = `${sentences.length} complete sentence${sentences.length === 1 ? '' : 's'} detected.`;
    const incompleteText = `${incompleteGroups.length} incomplete group${incompleteGroups.length === 1 ? '' : 's'} needs review.`;
    warning = `${completeText} ${incompleteText}`;
  }

  return {
    sentences,
    completeCount: sentences.length,
    incompleteGroups,
    warning,
  };
}

/**
 * Backward-compatible parsePasteSentences export
 */
export function parsePasteSentences(text: string): Omit<Sentence, 'id'>[] {
  return analyzePasteContent(text).sentences;
}

/**
 * Standard CSV Parser handling quotes, commas, and newlines
 */
export function parseCSV(csvText: string): Omit<Sentence, 'id'>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Check if first row is header
  const firstRow = rows[0].map(s => s.toLowerCase());
  const hasHeader = firstRow.some(s => s.includes('hindi') || s.includes('english') || s.includes('pronunciation'));
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .filter(row => row.length >= 2 && (row[0] || row[1] || row[2]))
    .map(row => ({
      hindi: row[0] || '',
      pronunciation: row[1] || '',
      english: row[2] || '',
      note: row[3] || undefined,
    }));
}

/**
 * Exports sentences to RFC 4180 CSV
 */
export function exportToCSV(sentences: Sentence[]): string {
  const headers = ['Hindi', 'Hindi Pronunciation', 'English', 'Teacher Note'];
  const escapeCell = (str: string = '') => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sentences.map(s => [
    escapeCell(s.hindi),
    escapeCell(s.pronunciation),
    escapeCell(s.english),
    escapeCell(s.note || ''),
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Exports sentences to Plain Text format
 */
export function exportToPlainText(sentences: Sentence[]): string {
  return sentences
    .map(s => `${s.hindi}\n${s.pronunciation}\n${s.english}${s.note ? `\n[Note: ${s.note}]` : ''}`)
    .join('\n\n');
}

/**
 * Triggers a client-side file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports single-file self-contained HTML presentation
 */
export function exportStandaloneHTML(
  chapter: Chapter,
  lesson: Lesson,
  theme: ThemeConfig,
  typography: TypographyConfig
): string {
  const safeData = JSON.stringify({ chapter, lesson, theme, typography });

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(chapter.title)} — ${escapeHTML(lesson.title)} | PCJha LearnSync</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: ${theme.bg};
      color: ${theme.hindiText};
      font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      user-select: none;
      -webkit-user-select: none;
    }
    .container {
      max-width: 900px;
      width: 100%;
      text-align: center;
    }
    .chapter-badge {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${theme.secondary};
      margin-bottom: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .layer {
      margin-bottom: 1.5rem;
      line-height: 1.8;
      transition: opacity 0.2s ease;
    }
    .hindi-layer {
      font-size: ${typography.hindi.fontSize}px;
      font-weight: ${typography.hindi.fontWeight};
      color: ${theme.hindiText};
    }
    .pron-layer {
      font-size: ${typography.pronunciation.fontSize}px;
      font-weight: ${typography.pronunciation.fontWeight};
      color: ${theme.pronunciationText};
    }
    .eng-layer {
      font-size: ${typography.english.fontSize}px;
      font-weight: ${typography.english.fontWeight};
      color: ${theme.englishText};
      font-family: 'Inter', sans-serif;
    }
    .word {
      display: inline-block;
      margin: 0 4px;
      padding: 2px 6px;
      border-radius: ${theme.highlightBorderRadius}px;
      transition: all 0.15s ease;
    }
    .word.active {
      background-color: ${theme.highlightBg};
      color: ${theme.highlightText};
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-weight: 600;
    }
    .progress-bar-container {
      margin-top: 3rem;
      width: 240px;
      height: 4px;
      background: rgba(0,0,0,0.1);
      border-radius: 9999px;
      overflow: hidden;
      margin-inline: auto;
    }
    .progress-fill {
      height: 100%;
      background: ${theme.progressBar};
      transition: width 0.3s ease;
    }
    .counter {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: ${theme.secondary};
      font-family: 'Inter', sans-serif;
    }
    .hint {
      position: fixed;
      bottom: 1rem;
      font-size: 0.75rem;
      color: ${theme.secondary};
      opacity: 0.7;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  <div class="container" id="app"></div>
  <div class="hint">Click or press [→] / [Space] for Next Word • [←] for Previous Word • [Enter] Next Sentence</div>

  <script>
    const DATA = ${safeData};
    let sentenceIndex = 0;
    let activeLayer = 'hindi'; // 'hindi' | 'pronunciation' | 'english'
    let wordIndex = -1;

    function getWords(text) {
      if (!text || !text.trim()) return [];
      return text.trim().split(/\\s+/);
    }

    function render() {
      const sentence = DATA.lesson.sentences[sentenceIndex];
      if (!sentence) return;

      const hindiWords = getWords(sentence.hindi);
      const pronWords = getWords(sentence.pronunciation);
      const engWords = getWords(sentence.english);

      const renderWords = (words, layer) => {
        return words.map((w, idx) => {
          const isActive = activeLayer === layer && wordIndex === idx;
          return '<span class="word' + (isActive ? ' active' : '') + '">' + escapeHTML(w) + '</span>';
        }).join('');
      };

      const progress = ((sentenceIndex + 1) / DATA.lesson.sentences.length) * 100;

      const html =
        '<div class="chapter-badge">' + escapeHTML(DATA.chapter.title) + ' • ' + escapeHTML(DATA.lesson.title) + '</div>' +
        '<div class="layer hindi-layer">' + renderWords(hindiWords, 'hindi') + '</div>' +
        '<div class="layer pron-layer">' + renderWords(pronWords, 'pronunciation') + '</div>' +
        '<div class="layer eng-layer">' + renderWords(engWords, 'english') + '</div>' +
        '<div class="progress-bar-container"><div class="progress-fill" style="width: ' + progress + '%;"></div></div>' +
        '<div class="counter">Sentence ' + (sentenceIndex + 1) + ' / ' + DATA.lesson.sentences.length + '</div>';

      document.getElementById('app').innerHTML = html;
    }

    function nextWord() {
      const sentence = DATA.lesson.sentences[sentenceIndex];
      if (!sentence) return;

      const hindiWords = getWords(sentence.hindi);
      const pronWords = getWords(sentence.pronunciation);
      const engWords = getWords(sentence.english);

      if (wordIndex === -1) {
        activeLayer = 'hindi';
        wordIndex = 0;
      } else if (activeLayer === 'hindi') {
        if (wordIndex < hindiWords.length - 1) {
          wordIndex++;
        } else {
          activeLayer = 'pronunciation';
          wordIndex = 0;
        }
      } else if (activeLayer === 'pronunciation') {
        if (wordIndex < pronWords.length - 1) {
          wordIndex++;
        } else {
          activeLayer = 'english';
          wordIndex = 0;
        }
      } else if (activeLayer === 'english') {
        if (wordIndex < engWords.length - 1) {
          wordIndex++;
        } else {
          if (sentenceIndex < DATA.lesson.sentences.length - 1) {
            sentenceIndex++;
            activeLayer = 'hindi';
            wordIndex = 0;
          }
        }
      }
      render();
    }

    function prevWord() {
      const sentence = DATA.lesson.sentences[sentenceIndex];
      if (!sentence) return;

      const hindiWords = getWords(sentence.hindi);
      const pronWords = getWords(sentence.pronunciation);
      const engWords = getWords(sentence.english);

      if (activeLayer === 'english') {
        if (wordIndex > 0) {
          wordIndex--;
        } else {
          activeLayer = 'pronunciation';
          wordIndex = Math.max(0, pronWords.length - 1);
        }
      } else if (activeLayer === 'pronunciation') {
        if (wordIndex > 0) {
          wordIndex--;
        } else {
          activeLayer = 'hindi';
          wordIndex = Math.max(0, hindiWords.length - 1);
        }
      } else if (activeLayer === 'hindi') {
        if (wordIndex > 0) {
          wordIndex--;
        } else if (sentenceIndex > 0) {
          sentenceIndex--;
          const prevSentence = DATA.lesson.sentences[sentenceIndex];
          const prevEngWords = getWords(prevSentence.english);
          activeLayer = 'english';
          wordIndex = Math.max(0, prevEngWords.length - 1);
        }
      }
      render();
    }

    function escapeHTML(str) {
      return (str || '').replace(/[&<>'"]/g, function(tag) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag);
      });
    }

    window.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        nextWord();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevWord();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (sentenceIndex < DATA.lesson.sentences.length - 1) {
          sentenceIndex++;
          activeLayer = 'hindi';
          wordIndex = 0;
          render();
        }
      }
    });

    window.addEventListener('click', function(e) {
      nextWord();
    });

    window.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      prevWord();
    });

    render();
  </script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return (str || '').replace(/[&<>'"]/g, tag => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag);
  });
}
