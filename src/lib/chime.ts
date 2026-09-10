/** Soft, luxury "order ready" chime rendered with the Web Audio API (no asset needed). */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

/** Must be called from a user gesture on iOS/Safari so later chimes are allowed. */
export async function unlockChime(): Promise<boolean> {
  const audio = getCtx();
  if (!audio) return false;
  try {
    if (audio.state === "suspended") await audio.resume();
    return audio.state === "running";
  } catch {
    return false;
  }
}

export function chimeReady(): boolean {
  const audio = getCtx();
  if (!audio) return false;
  if (audio.state === "suspended") void audio.resume();
  if (audio.state !== "running") return false;

  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.value = 0.0001;
  master.connect(audio.destination);
  master.gain.setValueAtTime(0.9, now);

  // Warm three-note arpeggio (E5 – G#5 – B5) played twice, bell-like.
  const notes = [659.25, 830.61, 987.77];
  [0, 1].forEach((pass) => {
    notes.forEach((freq, i) => {
      const start = now + pass * 0.95 + i * 0.16;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const partial = audio.createOscillator();
      const partialGain = audio.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      partial.type = "sine";
      partial.frequency.value = freq * 2;
      partialGain.gain.value = 0.12;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);

      osc.connect(gain);
      partial.connect(partialGain);
      partialGain.connect(gain);
      gain.connect(master);

      osc.start(start);
      partial.start(start);
      osc.stop(start + 1.2);
      partial.stop(start + 1.2);
    });
  });

  return true;
}

export function vibrateReady() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([120, 80, 120, 80, 240]);
    } catch {
      /* ignored */
    }
  }
}
