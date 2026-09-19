import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Scissors,
  Crop,
  Play,
  Pause,
  FileVideo,
  Music,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Check,
  Eye,
} from 'lucide-react';
import type { VideoCropBounds } from '../../types';
import { hasClientSideMp4Support, convertVideoBlobToMp4 } from '../../services/recorder';

interface VideoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  recordedBlob: Blob | null;
  mimeType: string | null;
  defaultTitle: string;
  onSendToAudioStudio?: (blob: Blob) => void;
  onRecordAgain?: () => void;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
type CropAspectPreset = 'free' | '16:9' | '9:16' | '1:1' | '4:3';

const DEFAULT_CROP: VideoCropBounds = { x: 0, y: 0, width: 1, height: 1 };

export const VideoCropModal: React.FC<VideoCropModalProps> = ({
  isOpen,
  onClose,
  blobUrl,
  recordedBlob,
  mimeType,
  defaultTitle,
  onSendToAudioStudio,
  onRecordAgain,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [filename, setFilename] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number | null>(null);
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);

  // Spatial crop state
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropBounds, setCropBounds] = useState<VideoCropBounds>(DEFAULT_CROP);
  const [tempCrop, setTempCrop] = useState<VideoCropBounds>(DEFAULT_CROP);
  const [aspectPreset, setAspectPreset] = useState<CropAspectPreset>('free');
  const [previewCropped, setPreviewCropped] = useState<boolean>(false);

  // Dragging state
  const dragRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startCrop: VideoCropBounds;
    containerRect: DOMRect;
  } | null>(null);

  const isCropActive =
    cropBounds.x > 0.005 ||
    cropBounds.y > 0.005 ||
    cropBounds.width < 0.995 ||
    cropBounds.height < 0.995;

  useEffect(() => {
    if (defaultTitle) {
      const sanitized = defaultTitle.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const isMp4Capable = mimeType?.includes('mp4') || hasClientSideMp4Support();
      const ext = isMp4Capable ? 'mp4' : 'webm';
      setFilename(`PCJha-LearnSync_${sanitized}_${dateStr}.${ext}`);

      if (!isMp4Capable) {
        setBrowserWarning(
          'Notice: Client-side MP4 recording is not natively supported in this browser. Video will be saved in valid WebM format. For direct MP4 output, please use Chrome, Edge, or Safari.'
        );
      } else {
        setBrowserWarning(null);
      }
    }
  }, [defaultTitle, mimeType]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Loop within trim bounds
      if (trimEnd > 0 && cur >= trimEnd) {
        videoRef.current.currentTime = trimStart;
        if (!isPlaying) {
          videoRef.current.pause();
        }
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Preset aspect ratio calculator
  const applyAspectPreset = useCallback(
    (preset: CropAspectPreset) => {
      setAspectPreset(preset);
      if (preset === 'free') return;

      const video = videoRef.current;
      const vidWidth = video?.videoWidth || 1920;
      const vidHeight = video?.videoHeight || 1080;
      const vidAR = vidWidth / vidHeight;

      let targetAR = 16 / 9;
      if (preset === '9:16') targetAR = 9 / 16;
      else if (preset === '1:1') targetAR = 1;
      else if (preset === '4:3') targetAR = 4 / 3;

      let w = 1;
      let h = 1;

      if (targetAR > vidAR) {
        // Wider than video: fit to width, reduce height
        w = 1;
        h = Math.min(1, (vidWidth / targetAR) / vidHeight);
      } else {
        // Taller than video: fit to height, reduce width
        h = 1;
        w = Math.min(1, (vidHeight * targetAR) / vidWidth);
      }

      const x = Math.max(0, (1 - w) / 2);
      const y = Math.max(0, (1 - h) / 2);

      setTempCrop({ x, y, width: w, height: h });
    },
    []
  );

  // Pointer drag for crop handles
  const handlePointerDown = (e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault();
    e.stopPropagation();

    const container = videoContainerRef.current;
    if (!container) return;

    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...tempCrop },
      containerRect: container.getBoundingClientRect(),
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const { handle: dragHandle, startX, startY, startCrop, containerRect } = dragRef.current;

      const dx = (ev.clientX - startX) / containerRect.width;
      const dy = (ev.clientY - startY) / containerRect.height;

      let { x, y, width, height } = startCrop;

      if (dragHandle === 'move') {
        x = Math.max(0, Math.min(1 - width, startCrop.x + dx));
        y = Math.max(0, Math.min(1 - height, startCrop.y + dy));
      } else {
        if (dragHandle.includes('w')) {
          const newX = Math.max(0, Math.min(startCrop.x + startCrop.width - 0.08, startCrop.x + dx));
          width = startCrop.width + (startCrop.x - newX);
          x = newX;
        }
        if (dragHandle.includes('e')) {
          width = Math.max(0.08, Math.min(1 - startCrop.x, startCrop.width + dx));
        }
        if (dragHandle.includes('n')) {
          const newY = Math.max(0, Math.min(startCrop.y + startCrop.height - 0.08, startCrop.y + dy));
          height = startCrop.height + (startCrop.y - newY);
          y = newY;
        }
        if (dragHandle.includes('s')) {
          height = Math.max(0.08, Math.min(1 - startCrop.y, startCrop.height + dy));
        }
      }

      setTempCrop({ x, y, width, height });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleApplyCrop = () => {
    setCropBounds(tempCrop);
    setIsCropping(false);
    setPreviewCropped(true);
  };

  const handleResetCrop = () => {
    setCropBounds(DEFAULT_CROP);
    setTempCrop(DEFAULT_CROP);
    setAspectPreset('free');
    setPreviewCropped(false);
  };

  const handleCancelCrop = () => {
    setTempCrop(cropBounds);
    setIsCropping(false);
  };

  const handleDownload = async () => {
    if (!recordedBlob && !blobUrl) return;
    setIsExporting(true);
    setConversionProgress(null);

    try {
      let downloadBlob: Blob | null = recordedBlob;
      let downloadUrl = blobUrl;

      const isTargetingMp4 = filename.toLowerCase().endsWith('.mp4');
      const isAlreadyMp4 = (downloadBlob?.type || mimeType || '').includes('mp4');

      // If spatial crop or time trim applied, or WebM needs MP4 conversion
      const needsTranscode = isCropActive || trimStart > 0.1 || (duration > 0 && trimEnd < duration - 0.1) || (isTargetingMp4 && !isAlreadyMp4);

      if (downloadBlob && needsTranscode) {
        if (hasClientSideMp4Support()) {
          setConversionProgress(0);
          downloadBlob = await convertVideoBlobToMp4(downloadBlob, {
            fps: 30,
            crop: isCropActive ? cropBounds : undefined,
            timeRange: { startSec: trimStart, endSec: trimEnd },
            onProgress: (pct) => setConversionProgress(pct),
          });
          downloadUrl = URL.createObjectURL(downloadBlob);
        } else {
          // Fallback if browser lacks WebCodecs MP4 support
          const safeName = filename.replace(/\.mp4$/i, '.webm');
          setFilename(safeName);
          setBrowserWarning(
            'Notice: Client-side MP4 transcoding is unavailable on this browser. Video will be saved in WebM format.'
          );
        }
      }

      if (!downloadUrl) return;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'PCJha-recording.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Error generating video: ' + (err?.message || 'Export failed'));
    } finally {
      setIsExporting(false);
      setConversionProgress(null);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  if (!isOpen || !blobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-stone-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileVideo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Recording Complete — Preview & Export</h2>
              <p className="text-xs text-stone-400">
                Crop frame, trim duration & download authentic MP4 video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Browser Limitation Notice */}
          {browserWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{browserWarning}</span>
            </div>
          )}

          {/* Conversion Progress Bar */}
          {conversionProgress !== null && (
            <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding Genuine MP4 Video with Crop & Trim...</span>
                </span>
                <span className="font-mono">{conversionProgress}%</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-150"
                  style={{ width: `${conversionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Video Preview Arena with Interactive Crop Box */}
          <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800/80 flex flex-col items-center">
            {/* Top Preview Controls Bar */}
            <div className="w-full flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!isCropping) {
                      setTempCrop(cropBounds);
                      setIsCropping(true);
                    } else {
                      handleCancelCrop();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                    isCropping
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>{isCropping ? 'Editing Crop Box' : 'Crop Video'}</span>
                </button>

                {isCropActive && !isCropping && (
                  <button
                    onClick={() => setPreviewCropped(!previewCropped)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs border transition ${
                      previewCropped
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-stone-700 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{previewCropped ? 'Showing Cropped Frame' : 'Show Full Frame'}</span>
                  </button>
                )}
              </div>

              {isCropActive && !isCropping && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
                    Crop Applied ({Math.round(cropBounds.width * 100)}% × {Math.round(cropBounds.height * 100)}%)
                  </span>
                  <button
                    onClick={handleResetCrop}
                    className="text-stone-400 hover:text-red-400 text-xs transition"
                    title="Reset Crop"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Video Box with Crop Overlay */}
            <div
              ref={videoContainerRef}
              className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-stone-800 bg-black flex items-center justify-center select-none"
            >
              {/* Scaled video wrapper when previewing cropped */}
              <div
                style={
                  previewCropped && isCropActive && !isCropping
                    ? {
                        position: 'absolute',
                        width: `${(1 / cropBounds.width) * 100}%`,
                        height: `${(1 / cropBounds.height) * 100}%`,
                        left: `-${(cropBounds.x / cropBounds.width) * 100}%`,
                        top: `-${(cropBounds.y / cropBounds.height) * 100}%`,
                      }
                    : { width: '100%', height: '100%' }
                }
                className="transition-all duration-200"
              >
                <video
                  ref={videoRef}
                  src={blobUrl}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain pointer-events-none"
                  playsInline
                />
              </div>

              {/* Interactive Spatial Crop Overlay (Active during Crop Mode) */}
              {isCropping && (
                <div className="absolute inset-0 pointer-events-auto">
                  {/* Darkened mask outside crop box */}
                  <div
                    style={{
                      left: `${tempCrop.x * 100}%`,
                      top: `${tempCrop.y * 100}%`,
                      width: `${tempCrop.width * 100}%`,
                      height: `${tempCrop.height * 100}%`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    }}
                    className="absolute border-2 border-amber-400 cursor-move transition-shadow"
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                  >
                    {/* Grid guidelines */}
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-amber-300/50" />
                      <div className="border-r border-b border-amber-300/50" />
                      <div className="border-b border-amber-300/50" />
                      <div className="border-r border-b border-amber-300/50" />
                      <div className="border-r border-b border-amber-300/50" />
                      <div className="border-b border-amber-300/50" />
                      <div className="border-r border-amber-300/50" />
                      <div className="border-r border-amber-300/50" />
                      <div />
                    </div>

                    {/* Corner Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
                    />

                    {/* Edge Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'n')}
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400 border border-black rounded-xs cursor-ns-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 's')}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400 border border-black rounded-xs cursor-ns-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'w')}
                      className="absolute top-1/2 -left-1 -translate-y-1/2 h-6 w-2 bg-amber-400 border border-black rounded-xs cursor-ew-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'e')}
                      className="absolute top-1/2 -right-1 -translate-y-1/2 h-6 w-2 bg-amber-400 border border-black rounded-xs cursor-ew-resize"
                    />
                  </div>
                </div>
              )}

              {/* Play / Pause button */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-stone-900/80 hover:bg-amber-600 border border-white/20 text-white flex items-center justify-center transition backdrop-blur-xs opacity-80 hover:opacity-100 hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
              </button>
            </div>

            {/* Crop Toolbar (Visible during Crop Mode) */}
            {isCropping && (
              <div className="w-full mt-4 p-3 bg-stone-900/90 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400 font-semibold mr-1">Aspect Ratio:</span>
                  {(['free', '16:9', '9:16', '1:1', '4:3'] as CropAspectPreset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => applyAspectPreset(p)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        aspectPreset === p
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {p === 'free' ? 'Free' : p}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetCrop}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleCancelCrop}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Crop</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time & Duration Trim Controls */}
          <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <div className="flex items-center gap-1.5 font-semibold text-stone-300">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>Trim Video Duration</span>
              </div>
              <div className="font-mono text-[11px]">
                Current: <span className="text-amber-400">{formatTime(currentTime)}</span> / {formatTime(duration)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-stone-400 w-12">Start:</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trimEnd - 0.5)}
                  step={0.1}
                  value={trimStart}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTrimStart(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-xs text-amber-400 w-16 text-right">{formatTime(trimStart)}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-stone-400 w-12">End:</span>
                <input
                  type="range"
                  min={trimStart + 0.5}
                  max={duration || 1}
                  step={0.1}
                  value={trimEnd}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTrimEnd(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-xs text-amber-400 w-16 text-right">{formatTime(trimEnd)}</span>
              </div>
            </div>
          </div>

          {/* Export Settings (Filename) */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Export Filename (.mp4)
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-800 bg-stone-950/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            {onSendToAudioStudio && recordedBlob && (
              <button
                onClick={() => {
                  onSendToAudioStudio(recordedBlob);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center gap-2"
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span>Send to Audio Studio</span>
              </button>
            )}

            {onRecordAgain && (
              <button
                onClick={() => {
                  onClose();
                  onRecordAgain();
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition"
              >
                Record Again
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-white text-xs font-medium transition"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-102 transition transform disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing MP4...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Video (.mp4)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
