import React from 'react';
import type { TextLayer, WordToken } from '../../types';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme } from '../../state/ThemeContext';
import { tokenizeText } from '../../services/tokenizer';

interface WordHighlightLayerProps {
  layer: TextLayer;
  text: string;
}

export const WordHighlightLayer: React.FC<WordHighlightLayerProps> = ({ layer, text }) => {
  const { activeLayer, wordIndex, presentationConfig, focusWord } = usePresentation();
  const { theme, typography } = useTheme();

  const tokens: WordToken[] = tokenizeText(text);

  const isLayerActive = activeLayer === layer;

  // Determine line focus opacity
  let layerOpacity = 1;
  if (presentationConfig.lineFocus !== 'none' && activeLayer !== null) {
    if (presentationConfig.lineFocus === 'activeLine') {
      layerOpacity = isLayerActive ? 1 : 0.42;
    } else if (presentationConfig.lineFocus === 'activeAndPrev') {
      if (layer === 'hindi') layerOpacity = 1;
      else if (layer === 'pronunciation') layerOpacity = activeLayer === 'hindi' ? 0.4 : 1;
      else if (layer === 'english') layerOpacity = activeLayer === 'english' ? 1 : 0.4;
    } else if (presentationConfig.lineFocus === 'activeAndNext') {
      if (layer === 'english') layerOpacity = 1;
      else if (layer === 'pronunciation') layerOpacity = activeLayer === 'english' ? 0.4 : 1;
      else if (layer === 'hindi') layerOpacity = activeLayer === 'hindi' || activeLayer === 'pronunciation' ? 1 : 0.4;
    }
  }

  // Get typography layer configuration
  const typo = typography[layer];
  const defaultTextColor =
    layer === 'hindi'
      ? theme.hindiText
      : layer === 'pronunciation'
      ? theme.pronunciationText
      : theme.englishText;

  // Render individual word token
  const renderWord = (token: WordToken) => {
    const isWordActive = isLayerActive && wordIndex === token.index;
    const isPreviousWord = isLayerActive && wordIndex > token.index;

    // Word Focus calculations
    let wordOpacity = 1;
    if (presentationConfig.wordFocus !== 'off' && isLayerActive && wordIndex >= 0) {
      if (presentationConfig.wordFocus === 'currentWord') {
        wordOpacity = isWordActive ? 1 : 0.45;
      } else if (presentationConfig.wordFocus === 'currentAndSurrounding') {
        const dist = Math.abs(wordIndex - token.index);
        wordOpacity = dist <= 1 ? 1 : 0.4;
      }
    }

    // Dynamic style computation for highlight variants
    let wordStyle: React.CSSProperties = {
      display: 'inline-block',
      margin: '0 3px',
      padding: `${theme.highlightPaddingY}px ${theme.highlightPaddingX}px`,
      borderRadius: `${theme.highlightBorderRadius}px`,
      opacity: wordOpacity,
      transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
      color: defaultTextColor,
      position: 'relative',
      transform: isWordActive ? 'scale(1.14) translateY(-2px)' : 'scale(1) translateY(0)',
      zIndex: isWordActive ? 10 : 1,
      cursor: 'pointer',
    };

    if (isWordActive) {
      // Compute active style
      switch (theme.highlightStyle) {
        case 'background':
          wordStyle = {
            ...wordStyle,
            backgroundColor: hexToRgba(theme.highlightBg, theme.highlightOpacity),
            color: theme.highlightText,
            fontWeight: Math.min(800, typo.fontWeight + 100),
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          };
          break;
        case 'pill':
          wordStyle = {
            ...wordStyle,
            backgroundColor: hexToRgba(theme.highlightBg, theme.highlightOpacity),
            color: theme.highlightText,
            borderRadius: '9999px',
            fontWeight: Math.min(800, typo.fontWeight + 100),
            boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
          };
          break;
        case 'underline':
          wordStyle = {
            ...wordStyle,
            borderBottom: `3px solid ${theme.highlightBg}`,
            color: theme.highlightText || defaultTextColor,
            fontWeight: Math.min(800, typo.fontWeight + 100),
            borderRadius: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          };
          break;
        case 'glow':
          wordStyle = {
            ...wordStyle,
            backgroundColor: hexToRgba(theme.highlightBg, 0.25),
            color: theme.highlightText,
            boxShadow: `0 0 20px ${hexToRgba(theme.highlightBg, 0.85)}`,
            fontWeight: Math.min(800, typo.fontWeight + 100),
          };
          break;
        case 'bold':
          wordStyle = {
            ...wordStyle,
            color: theme.highlightText,
            fontWeight: 800,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          };
          break;
        case 'textColor':
          wordStyle = {
            ...wordStyle,
            color: theme.highlightText,
            fontWeight: Math.min(800, typo.fontWeight + 100),
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          };
          break;
      }
    } else if (isPreviousWord && theme.previousText) {
      wordStyle.color = theme.previousText;
    } else if (!isWordActive && isLayerActive && theme.inactiveText) {
      wordStyle.color = theme.inactiveText;
    }

    return (
      <span
        key={token.id}
        style={wordStyle}
        data-index={token.index}
        onClick={(e) => {
          e.stopPropagation();
          focusWord(layer, token.index);
        }}
        role="button"
        tabIndex={0}
        title={`Focus word: ${token.text}`}
        className="word-token select-none font-feature-settings hover:opacity-95"
      >
        {token.text}
      </span>
    );
  };

  return (
    <div
      style={{
        fontFamily: typo.fontFamily,
        fontSize: `${typo.fontSize}px`,
        fontWeight: typo.fontWeight,
        lineHeight: typo.lineHeight,
        letterSpacing: `${typo.letterSpacing}px`,
        opacity: layerOpacity,
        transition: 'opacity 0.2s ease',
      }}
      className="py-1 my-1"
    >
      {tokens.length === 0 ? (
        <span className="opacity-30 italic text-sm">(Empty)</span>
      ) : (
        tokens.map(renderWord)
      )}
    </div>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
