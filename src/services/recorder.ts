import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { VideoCropBounds } from '../types';

export interface RecorderState {
  isSupported: boolean;
  isRecording: boolean;
  durationSeconds: number;
  blobUrl: string | null;
  mimeType: string | null;
  recordedBlob: Blob | null;
  errorMessage: string | null;
}

export interface SupportedMimeOption {
  mime: string;
  label: string;
  extension: 'webm' | 'mp4' | 'mkv';
}

export class ScreenRecorder {
  private mediaStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerId: number | null = null;
  private onStateChange: (state: Partial<RecorderState>) => void;

  constructor(onStateChange: (state: Partial<RecorderState>) => void) {
    this.onStateChange = onStateChange;
  }

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.navigator?.mediaDevices?.getDisplayMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  public static getSupportedMimeTypes(): SupportedMimeOption[] {
    if (typeof MediaRecorder === 'undefined') return [];
    
    // MP4 prioritized first as specified in Update 1
    const candidates: Array<{ mime: string; label: string; extension: 'webm' | 'mp4' | 'mkv' }> = [
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4 (H.264 + AAC - Default)', extension: 'mp4' },
      { mime: 'video/mp4;codecs=avc1', label: 'MP4 (H.264)', extension: 'mp4' },
      { mime: 'video/mp4;codecs=h264,aac', label: 'MP4 (H.264 / AAC)', extension: 'mp4' },
      { mime: 'video/mp4', label: 'MP4 (Standard Container)', extension: 'mp4' },
      { mime: 'video/webm;codecs=vp9,opus', label: 'WebM VP9 + Opus (High Quality)', extension: 'webm' },
      { mime: 'video/webm;codecs=vp8,opus', label: 'WebM VP8 + Opus (Fast)', extension: 'webm' },
      { mime: 'video/webm', label: 'WebM Default', extension: 'webm' },
    ];

    return candidates.filter((c) => {
      try {
        return MediaRecorder.isTypeSupported(c.mime);
      } catch {
        return false;
      }
    });
  }

  /**
   * Start recording directly from an HTML5 Canvas stream (pure presentation, no OS UI).
   */
  public async startCanvasRecording(
    canvas: HTMLCanvasElement,
    options?: {
      fps?: number;
      includeMic?: boolean;
      mimeType?: string;
    }
  ): Promise<boolean> {
    if (!ScreenRecorder.isSupported()) {
      this.onStateChange({
        errorMessage: 'MediaRecorder is not supported in this browser.',
        isRecording: false,
      });
      return false;
    }

    try {
      this.recordedChunks = [];
      const fps = options?.fps || 30;
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;

      if (!canvasStream) {
        throw new Error('Canvas captureStream is not supported on this browser.');
      }

      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      if (options?.includeMic) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          const micTrack = this.micStream.getAudioTracks()[0];
          if (micTrack) {
            combinedTracks.push(micTrack);
          }
        } catch (micErr) {
          console.warn('Microphone permission not granted, proceeding without mic audio:', micErr);
        }
      }

      this.mediaStream = new MediaStream(combinedTracks);
      return this.initAndStartRecorder(options?.mimeType);
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * Start recording from full screen or browser tab via getDisplayMedia.
   */
  public async startDisplayRecording(options?: {
    includeMic?: boolean;
    mimeType?: string;
  }): Promise<boolean> {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      this.onStateChange({
        errorMessage: 'Screen sharing is not supported in this browser.',
        isRecording: false,
      });
      return false;
    }

    try {
      this.recordedChunks = [];
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
        preferCurrentTab: true,
      } as any);

      const combinedTracks: MediaStreamTrack[] = [...displayStream.getTracks()];

      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        this.stopRecording();
      });

      if (options?.includeMic) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          const micTrack = this.micStream.getAudioTracks()[0];
          if (micTrack) {
            combinedTracks.push(micTrack);
          }
        } catch (micErr) {
          console.warn('Microphone not acquired for display capture:', micErr);
        }
      }

      this.mediaStream = new MediaStream(combinedTracks);
      return this.initAndStartRecorder(options?.mimeType);
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * Start browser screen recording (convenience alias for startDisplayRecording).
   */
  public async startRecording(options?: {
    includeMic?: boolean;
    mimeType?: string;
  }): Promise<boolean> {
    return this.startDisplayRecording(options);
  }

  private initAndStartRecorder(preferredMime?: string): boolean {
    const supported = ScreenRecorder.getSupportedMimeTypes();
    let chosenMime = preferredMime && MediaRecorder.isTypeSupported(preferredMime)
      ? preferredMime
      : supported[0]?.mime || 'video/webm';

    this.mediaRecorder = new MediaRecorder(this.mediaStream!, {
      mimeType: chosenMime,
      videoBitsPerSecond: 3_500_000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const finalBlob = new Blob(this.recordedChunks, { type: chosenMime });
      const blobUrl = URL.createObjectURL(finalBlob);
      this.onStateChange({
        isRecording: false,
        blobUrl,
        recordedBlob: finalBlob,
        mimeType: chosenMime,
      });
      this.cleanup();
    };

    this.mediaRecorder.start(500);

    let seconds = 0;
    this.timerId = window.setInterval(() => {
      seconds++;
      this.onStateChange({ durationSeconds: seconds });
    }, 1000);

    this.onStateChange({
      isRecording: true,
      durationSeconds: 0,
      blobUrl: null,
      recordedBlob: null,
      errorMessage: null,
    });

    return true;
  }

  private handleError(err: any) {
    if (err.name === 'NotAllowedError') {
      this.onStateChange({ isRecording: false });
    } else {
      this.onStateChange({
        errorMessage: err.message || 'Failed to initialize recorder.',
        isRecording: false,
      });
    }
    this.cleanup();
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }
}

/**
 * Detects if the current browser environment can produce genuine MP4 files
 * either via native MediaRecorder support or via WebCodecs + mp4-muxer.
 */
export function hasClientSideMp4Support(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof MediaRecorder !== 'undefined') {
    const mp4Mimes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4',
    ];
    if (mp4Mimes.some((m) => {
      try {
        return MediaRecorder.isTypeSupported(m);
      } catch {
        return false;
      }
    })) {
      return true;
    }
  }
  return typeof (window as any).VideoEncoder !== 'undefined';
}

export interface ConvertVideoOptions {
  fps?: number;
  timeRange?: { startSec: number; endSec: number };
  crop?: VideoCropBounds;
  onProgress?: (pct: number) => void;
}

/**
 * Transcodes a recorded video blob (e.g. WebM) into a genuine, valid ISO BMFF MP4 file
 * client-side using WebCodecs (VideoEncoder, VideoFrame) and mp4-muxer.
 * Applies visual spatial cropping and time trimming frame-by-frame.
 */
export async function convertVideoBlobToMp4(
  inputBlob: Blob,
  options?: ConvertVideoOptions
): Promise<Blob> {
  if (typeof (window as any).VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not available in this browser for MP4 transcoding.');
  }

  const fps = options?.fps || 30;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  const url = URL.createObjectURL(inputBlob);
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video metadata for MP4 conversion.'));
  });

  const hasCrop = !!(
    options?.crop &&
    (options.crop.x > 0.005 ||
      options.crop.y > 0.005 ||
      options.crop.width < 0.995 ||
      options.crop.height < 0.995)
  );
  const hasTimeTrim = !!(
    options?.timeRange &&
    (options.timeRange.startSec > 0.1 ||
      (options.timeRange.endSec > 0 &&
        options.timeRange.endSec < (video.duration || 99999) - 0.1))
  );

  // If already MP4 container and neither crop nor time trim requested, return as-is
  if (inputBlob.type.includes('mp4') && !hasCrop && !hasTimeTrim) {
    URL.revokeObjectURL(url);
    return inputBlob;
  }

  const videoDuration = video.duration || 1;
  const startSec = Math.max(0, options?.timeRange?.startSec ?? 0);
  const endSec = Math.min(
    videoDuration,
    options?.timeRange?.endSec && options.timeRange.endSec > startSec
      ? options.timeRange.endSec
      : videoDuration
  );
  const effectiveDuration = Math.max(0.1, endSec - startSec);

  const origWidth = video.videoWidth || 1920;
  const origHeight = video.videoHeight || 1080;

  let sx = 0;
  let sy = 0;
  let sw = origWidth;
  let sh = origHeight;

  if (options?.crop) {
    const cx = Math.max(0, Math.min(0.95, options.crop.x));
    const cy = Math.max(0, Math.min(0.95, options.crop.y));
    const cw = Math.max(0.05, Math.min(1 - cx, options.crop.width));
    const ch = Math.max(0.05, Math.min(1 - cy, options.crop.height));

    sx = Math.round(cx * origWidth);
    sy = Math.round(cy * origHeight);
    sw = Math.round(cw * origWidth);
    sh = Math.round(ch * origHeight);
  }

  // Dimensions must be even for H.264 / AVC
  const width = Math.max(2, Math.floor(sw / 2) * 2);
  const height = Math.max(2, Math.floor(sh / 2) * 2);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Failed to create canvas context for MP4 conversion.');
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;
  const VideoEncoderClass = (window as any).VideoEncoder;
  const VideoFrameClass = (window as any).VideoFrame;

  const encoder = new VideoEncoderClass({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: any) => {
      encoderError = e;
      console.error('VideoEncoder error during MP4 export:', e);
    },
  });

  encoder.configure({
    codec: 'avc1.42001f', // H.264 Baseline Level 3.1
    width,
    height,
    bitrate: 3_500_000,
    framerate: fps,
  });

  const totalFrames = Math.max(1, Math.round(effectiveDuration * fps));
  const frameInterval = effectiveDuration / totalFrames;

  for (let i = 0; i < totalFrames; i++) {
    if (encoderError) throw encoderError;
    const targetTime = Math.min(videoDuration, startSec + i * frameInterval);
    video.currentTime = targetTime;

    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

    const frame = new VideoFrameClass(canvas, {
      timestamp: Math.round((i * frameInterval) * 1_000_000), // microseconds relative to output start
    });

    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    if (options?.onProgress) {
      options.onProgress(Math.round(((i + 1) / totalFrames) * 100));
    }
  }

  await encoder.flush();
  muxer.finalize();
  URL.revokeObjectURL(url);

  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
