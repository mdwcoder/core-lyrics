/**
 * CORE-LYRICS · Client-side Audio Beat & Onset Analyzer (100% in-browser)
 * Analiza archivos de audio (MP3, WAV, etc.) para detectar automáticamente:
 * 1. BPM (Tempo del beat mediante filtrado lowpass y picos de kick/transitorios).
 * 2. Inicio del beat / Drop / Offset inicial (cuándo entra el ritmo o bombo principal).
 * Formateador de notas de tiempo: //-//MM:SS:CC//-//
 */

export interface BeatAnalysisResult {
  bpm: number;
  startOffset: number; // En segundos
  duration: number;
  confidence: number; // 0..1
}

/**
 * Formatea segundos a la estructura solicitada: //-//MM:SS:CC//-//
 * Ejemplo: 12.41s -> //-//00:12:41//-//
 */
export function formatTimestampTag(timeInSeconds: number): string {
  const totalCentis = Math.max(0, Math.floor(timeInSeconds * 100));
  const mins = Math.floor(totalCentis / 6000);
  const secs = Math.floor((totalCentis % 6000) / 100);
  const centis = totalCentis % 100;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const cc = String(centis).padStart(2, '0');

  return `//-//${mm}:${ss}:${cc}//-//`;
}

/**
 * Parsea una marca de tiempo en formato //-//MM:SS:CC//-// a segundos
 */
export function parseTimestampTag(tag: string): number | null {
  const match = tag.match(/\/\/\-\/(\d{2}):(\d{2}):(\d{2})\/\/\-/);
  if (!match) return null;

  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const centis = parseInt(match[3], 10);

  return mins * 60 + secs + centis / 100;
}

/**
 * Analiza un archivo de audio directamente en el cliente con Web Audio API
 */
export async function analyzeBeatFromAudioFile(file: File): Promise<BeatAnalysisResult> {
  const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioCtxClass();

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use slice to avoid neutering arrayBuffer in some browser implementations
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Use up to the first 60 seconds (sufficient to detect intro, drop and tempo)
    const maxSecondsToAnalyze = Math.min(60, duration);
    const numSamples = Math.floor(maxSecondsToAnalyze * sampleRate);

    // 1. Detect Beat Start / Drop / Onset
    const startOffset = detectDropOffset(audioBuffer, maxSecondsToAnalyze);

    // 2. Detect BPM using filtered kick-transient channel
    const bpm = await detectBpmFromBuffer(audioBuffer, maxSecondsToAnalyze);

    return {
      bpm: bpm || 90,
      startOffset,
      duration,
      confidence: bpm ? 0.85 : 0.5
    };
  } finally {
    tempCtx.close().catch(() => {});
  }
}

/**
 * Detecta el inicio del ritmo o primer golpe de bombo significativo
 */
function detectDropOffset(buffer: AudioBuffer, maxSeconds: number): number {
  const sampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0);
  const limit = Math.min(channelData.length, Math.floor(maxSeconds * sampleRate));

  // Frame window of 20ms
  const frameSize = Math.floor(sampleRate * 0.02);
  const numFrames = Math.floor(limit / frameSize);

  const energies = new Float32Array(numFrames);
  let maxEnergy = 0;

  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const offset = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const val = channelData[offset + i];
      sum += val * val;
    }
    const rms = Math.sqrt(sum / frameSize);
    energies[f] = rms;
    if (rms > maxEnergy) {
      maxEnergy = rms;
    }
  }

  if (maxEnergy === 0) return 0;

  // Threshold: 15% of peak energy with attack
  const threshold = maxEnergy * 0.15;
  for (let f = 1; f < numFrames - 1; f++) {
    const cur = energies[f];
    const prev = energies[f - 1];
    // Check for transient rise
    if (cur > threshold && (cur - prev) > threshold * 0.3) {
      const timeInSec = (f * frameSize) / sampleRate;
      return +(Math.max(0, timeInSec - 0.05).toFixed(2));
    }
  }

  return 0;
}

/**
 * Detecta el tempo (BPM) aplicando un filtro pasabajo a ~150Hz en OfflineAudioContext
 */
async function detectBpmFromBuffer(buffer: AudioBuffer, maxSeconds: number): Promise<number> {
  const sampleRate = buffer.sampleRate;
  const frameLength = Math.min(buffer.length, Math.floor(maxSeconds * sampleRate));

  // Create Offline Context for fast-rendering lowpass kick filter
  const OfflineCtxClass = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtxClass(1, frameLength, sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // Biquad lowpass filter at 150Hz isolates kick drums and heavy bass transients
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, 0);
  filter.Q.setValueAtTime(1, 0);

  source.connect(filter);
  filter.connect(offlineCtx.destination);
  source.start(0);

  const filtered = await offlineCtx.startRendering();
  const data = filtered.getChannelData(0);

  // Peak detection with minimum distance (corresponding to ~220 BPM max tempo)
  const minPeakDistance = Math.floor(sampleRate * (60 / 220));
  let peakMax = 0;
  for (let i = 0; i < data.length; i++) {
    const abs = Math.abs(data[i]);
    if (abs > peakMax) peakMax = abs;
  }

  if (peakMax === 0) return 90;

  const threshold = peakMax * 0.45;
  const peaks: number[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    const val = Math.abs(data[i]);
    if (val > threshold && val > Math.abs(data[i - 1]) && val > Math.abs(data[i + 1])) {
      if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minPeakDistance) {
        peaks.push(i);
      }
    }
  }

  if (peaks.length < 4) return 90;

  // Count interval frequencies between peaks
  const intervalCounts: Record<number, number> = {};

  for (let i = 0; i < peaks.length; i++) {
    for (let j = 1; j <= 5 && i + j < peaks.length; j++) {
      const deltaSamples = (peaks[i + j] - peaks[i]) / j;
      const seconds = deltaSamples / sampleRate;
      let bpm = 60 / seconds;

      // Normalize into rap tempo zone (typically 70 to 145 BPM)
      while (bpm < 70) bpm *= 2;
      while (bpm > 145) bpm /= 2;

      const roundedBpm = Math.round(bpm);
      if (roundedBpm >= 65 && roundedBpm <= 160) {
        intervalCounts[roundedBpm] = (intervalCounts[roundedBpm] || 0) + 1;
      }
    }
  }

  // Find most frequent BPM
  let bestBpm = 90;
  let maxCount = 0;

  for (const bpmStr of Object.keys(intervalCounts)) {
    const bpmVal = parseInt(bpmStr, 10);
    const count = intervalCounts[bpmVal];
    if (count > maxCount) {
      maxCount = count;
      bestBpm = bpmVal;
    }
  }

  return bestBpm;
}
