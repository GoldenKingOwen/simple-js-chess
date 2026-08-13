import { useSettingsStore } from "@/stores/settings-store";

/**
 * Minimal Web Audio based sound effects. Respects the settings store
 * (soundEnabled, master volume and per-effect volume). Replaced or enhanced by
 * real audio assets later; API stays identical.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function tone(
  frequency: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = "sine",
  when = 0,
) {
  const ctx = getContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + when);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + durationMs / 1000);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + when);
  oscillator.stop(ctx.currentTime + when + durationMs / 1000 + 0.02);
}

type SoundEffect = "move" | "capture" | "check" | "gameEnd" | "notification";

function effectiveVolume(effect: SoundEffect): number {
  const settings = useSettingsStore.getState();
  if (!settings.game.soundEnabled) return 0;
  const master = settings.game.sound.master;
  const specific = settings.game.sound[effect];
  return master * specific;
}

export const sounds = {
  move() {
    const volume = effectiveVolume("move");
    if (volume <= 0) return;
    tone(440, 60, volume, "triangle");
  },
  capture() {
    const volume = effectiveVolume("capture");
    if (volume <= 0) return;
    tone(320, 80, volume, "square", 0);
    tone(210, 90, volume * 0.8, "square", 0.02);
  },
  check() {
    const volume = effectiveVolume("check");
    if (volume <= 0) return;
    tone(880, 90, volume, "triangle");
    tone(880, 90, volume * 0.6, "triangle", 0.12);
  },
  gameEnd() {
    const volume = effectiveVolume("gameEnd");
    if (volume <= 0) return;
    tone(523, 150, volume, "triangle");
    tone(659, 150, volume * 0.8, "triangle", 0.15);
    tone(784, 220, volume * 0.7, "triangle", 0.3);
  },
  notification() {
    const volume = effectiveVolume("notification");
    if (volume <= 0) return;
    tone(660, 100, volume, "sine");
    tone(990, 120, volume * 0.7, "sine", 0.1);
  },
  lowTime() {
    const volume = effectiveVolume("move");
    if (volume <= 0) return;
    tone(196, 120, volume * 0.9, "square");
  },
} as const;