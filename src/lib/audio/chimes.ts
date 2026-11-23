"use client";

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }

  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx.resume().catch(() => {
      // Ignore autoplay blocks
    });
  }
  return sharedAudioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine"
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/**
 * Calm rising pentatonic marimba chime on correct answers.
 */
export function playSuccessChime(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(ctx, 523.25, 0, 0.18, 0.12, "triangle"); // C5
    playTone(ctx, 659.25, 0.09, 0.2, 0.12, "triangle"); // E5
    playTone(ctx, 783.99, 0.18, 0.32, 0.14, "sine"); // G5
  } catch {
    // Non-blocking audio
  }
}

/**
 * Gentle warm chime when revealing a progressive hint.
 */
export function playHintChime(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(ctx, 587.33, 0, 0.22, 0.09, "sine"); // D5
  } catch {
    // Non-blocking audio
  }
}

/**
 * Soft non-punitive wooden tap when an answer needs another try (never a harsh buzzer).
 */
export function playGentleNudgeChime(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(ctx, 329.63, 0, 0.14, 0.07, "sine"); // E4 soft
  } catch {
    // Non-blocking audio
  }
}
