"use client";

let activeAudioEl: HTMLAudioElement | null = null;
let activeFallbackTimer: ReturnType<typeof setTimeout> | null = null;

export interface SpeakKhmerOptions {
  textKm: string;
  audioUrl?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export function stopKhmerSpeech(): void {
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioEl = null;
  }

  if (activeFallbackTimer) {
    clearTimeout(activeFallbackTimer);
    activeFallbackTimer = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Plays recorded Khmer step audio when audioUrl is provided, falling back to
 * Web Speech API (km-KH) or a brief calm visual read-along pulse when voices
 * are unavailable (e.g., offline headless environments).
 */
export function speakKhmerPrompt({
  textKm,
  audioUrl,
  onStart,
  onEnd,
}: SpeakKhmerOptions): void {
  stopKhmerSpeech();

  if (typeof window === "undefined") {
    onEnd?.();
    return;
  }

  // 1. Prefer recorded native Khmer audio file when available
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      activeAudioEl = audio;
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        activeAudioEl = null;
        onEnd?.();
      };
      audio.onerror = () => {
        activeAudioEl = null;
        speakWithSpeechSynthesis(textKm, onStart, onEnd);
      };
      void audio.play().catch(() => {
        activeAudioEl = null;
        speakWithSpeechSynthesis(textKm, onStart, onEnd);
      });
      return;
    } catch {
      // Fall through to speech synthesis
    }
  }

  speakWithSpeechSynthesis(textKm, onStart, onEnd);
}

function speakWithSpeechSynthesis(
  textKm: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  ) {
    try {
      const voices = window.speechSynthesis.getVoices();
      const khmerVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith("km")
      );

      if (khmerVoice) {
        const utterance = new SpeechSynthesisUtterance(textKm);
        utterance.lang = "km-KH";
        utterance.voice = khmerVoice;
        utterance.rate = 0.92;
        utterance.onstart = () => onStart?.();
        utterance.onend = () => onEnd?.();
        utterance.onerror = () => onEnd?.();
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // Fall back to visual read-along cue
    }
  }

  // Graceful visual read-along pulse when no Khmer TTS engine is installed
  onStart?.();
  activeFallbackTimer = setTimeout(() => {
    activeFallbackTimer = null;
    onEnd?.();
  }, 900);
}
