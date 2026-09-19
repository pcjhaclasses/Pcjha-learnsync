import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { CanvasPreset } from '../../types';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import { tokenizeText } from '../../services/tokenizer';

export interface PresentationCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

interface PresentationCanvasProps {
  preset: CanvasPreset;
  showWatermark?: boolean;
  watermarkText?: string;
  className?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const PresentationCanvas = forwardRef<PresentationCanvasRef, PresentationCanvasProps>(
  ({ preset, showWatermark = true, watermarkText = 'PCJha LearnSync', className = '', onClick, onContextMenu }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { sentenceIndex, activeLayer, wordIndex } = usePresentation();
    const { theme, typography } = useTheme();
    const { currentChapter, currentLesson } = useApp();

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // Canvas resolution based on preset
    let width = 1920;
    let height = 1080;
    if (preset === '9:16') {
      width = 1080;
      height = 1920;
    } else if (preset === '1:1') {
      width = 1080;
      height = 1080;
    } else if (preset === '720p') {
      width = 1280;
      height = 720;
    }

    const sentences = currentLesson?.sentences || [];
    const sentence = sentences[sentenceIndex] || {
      hindi: 'पाठ प्रारम्भ करने के लिए आगे बढ़ें।',
      pronunciation: 'पाठ प्रारम्भ करने के लिए आगे बढ़ें।',
      english: 'Advance to begin the lesson.',
    };

    // Draw frame to canvas whenever state changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Clear & Background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Header / Meta Info
      const scaleFactor = preset === '9:16' ? 1.2 : width / 1920;
      const paddingX = width * 0.08;
      const topY = height * 0.08;

      ctx.save();
      // Chapter and Lesson tag
      if (currentChapter) {
        ctx.font = `600 ${Math.round(22 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = theme.secondary;
        ctx.textAlign = 'left';
        const chapLabel = `अध्याय ${currentChapter.chapterNumber || 1}: ${currentChapter.title}`;
        ctx.fillText(chapLabel, paddingX, topY);

        if (currentLesson) {
          ctx.font = `500 ${Math.round(18 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = theme.divider;
          ctx.fillText(` •  ${currentLesson.title}`, paddingX + ctx.measureText(chapLabel).width, topY);
        }
      }

      // Sentence Counter pill on right
      const sentenceText = `वाक्य ${sentenceIndex + 1} / ${Math.max(1, sentences.length)}`;
      ctx.font = `600 ${Math.round(18 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.secondary;
      ctx.fillText(sentenceText, width - paddingX, topY);
      ctx.restore();

      // 3. Center Educational Layers (Hindi, Pronunciation, English)
      const hindiTokens = tokenizeText(sentence.hindi);
      const pronTokens = tokenizeText(sentence.pronunciation);
      const engTokens = tokenizeText(sentence.english);

      // Layout coordinates
      const centerY = height * (preset === '9:16' ? 0.42 : 0.48);
      const spacingY = Math.round((preset === '9:16' ? 140 : 100) * scaleFactor);

      // Render Layer Function with Word Wrapping & Token Highlight
      const renderTextLayer = (
        tokens: ReturnType<typeof tokenizeText>,
        layerKey: 'hindi' | 'pronunciation' | 'english',
        baseY: number,
        fontSize: number,
        fontFamily: string,
        textColor: string
      ) => {
        ctx.save();
        ctx.font = `600 ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.textBaseline = 'middle';

        // Measure tokens
        const tokenMetrics = tokens.map((t) => {
          const w = ctx.measureText(t.text).width;
          return { ...t, width: w };
        });

        const spaceWidth = ctx.measureText(' ').width;
        const maxLineWidth = width - paddingX * 2;

        // Break into lines
        const lines: Array<typeof tokenMetrics> = [];
        let currentLine: typeof tokenMetrics = [];
        let currentLineWidth = 0;

        tokenMetrics.forEach((tm) => {
          if (currentLine.length > 0 && currentLineWidth + spaceWidth + tm.width > maxLineWidth) {
            lines.push(currentLine);
            currentLine = [tm];
            currentLineWidth = tm.width;
          } else {
            currentLine.push(tm);
            currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + tm.width;
          }
        });
        if (currentLine.length > 0) lines.push(currentLine);

        // Draw each line centered
        const lineHeight = fontSize * 1.5;
        const totalHeight = lines.length * lineHeight;
        const startY = baseY - totalHeight / 2;

        lines.forEach((line, lIdx) => {
          const lineY = startY + lIdx * lineHeight + lineHeight / 2;
          const lineWidthTotal = line.reduce((acc, t, idx) => acc + t.width + (idx > 0 ? spaceWidth : 0), 0);
          let curX = (width - lineWidthTotal) / 2;

          line.forEach((t) => {
            const isWordActive = activeLayer === layerKey && wordIndex === t.index;

            if (isWordActive) {
              // Highlight pill background
              const padX = 14 * scaleFactor;
              const padY = 8 * scaleFactor;
              const pillW = t.width + padX * 2;
              const pillH = fontSize + padY * 2;
              const pillX = curX - padX;
              const pillY = lineY - pillH / 2;
              const radius = 12 * scaleFactor;

              ctx.save();
              ctx.shadowColor = 'rgba(0,0,0,0.15)';
              ctx.shadowBlur = 16 * scaleFactor;
              ctx.fillStyle = theme.highlightBg;
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillW, pillH, radius);
              ctx.fill();
              ctx.restore();

              // Active Text
              ctx.fillStyle = theme.highlightText;
              ctx.fillText(t.text, curX, lineY);
            } else {
              // Standard word
              ctx.fillStyle = textColor;
              ctx.fillText(t.text, curX, lineY);
            }

            curX += t.width + spaceWidth;
          });
        });

        ctx.restore();
      };

      // 1. Hindi Layer
      renderTextLayer(
        hindiTokens,
        'hindi',
        centerY - spacingY,
        Math.round((typography.hindi.fontSize * 1.35) * scaleFactor),
        typography.hindi.fontFamily,
        theme.hindiText
      );

      // 2. Pronunciation Layer (Devanagari)
      renderTextLayer(
        pronTokens,
        'pronunciation',
        centerY,
        Math.round((typography.pronunciation.fontSize * 1.3) * scaleFactor),
        typography.pronunciation.fontFamily,
        theme.pronunciationText
      );

      // 3. English Layer
      renderTextLayer(
        engTokens,
        'english',
        centerY + spacingY,
        Math.round((typography.english.fontSize * 1.35) * scaleFactor),
        typography.english.fontFamily,
        theme.englishText
      );

      // 4. Progress bar at bottom
      const progressH = 6 * scaleFactor;
      const progressPercent = sentences.length > 0 ? (sentenceIndex + 1) / sentences.length : 0;
      const progressY = height - height * 0.06;

      ctx.save();
      // Track
      ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
      ctx.beginPath();
      ctx.roundRect(paddingX, progressY, width - paddingX * 2, progressH, progressH / 2);
      ctx.fill();

      // Fill
      if (progressPercent > 0) {
        ctx.fillStyle = theme.highlightBg;
        ctx.beginPath();
        ctx.roundRect(paddingX, progressY, (width - paddingX * 2) * progressPercent, progressH, progressH / 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Watermark / Branding
      if (showWatermark && watermarkText) {
        ctx.save();
        ctx.font = `600 ${Math.round(16 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = theme.secondary;
        ctx.globalAlpha = 0.65;
        ctx.textAlign = 'center';
        ctx.fillText(watermarkText, width / 2, height - height * 0.025);
        ctx.restore();
      }
    }, [
      width,
      height,
      preset,
      sentenceIndex,
      activeLayer,
      wordIndex,
      sentence,
      sentences.length,
      currentChapter,
      currentLesson,
      theme,
      typography,
      showWatermark,
      watermarkText,
    ]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`rounded-2xl shadow-2xl transition-all ${className}`}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: `${width} / ${height}`,
          maxHeight: '85vh',
        }}
      />
    );
  }
);
