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

/** Generic tone sequence helper. */
function playTones(seq: { freq: number; at: number; dur: number; gain?: number }[]): boolean {
  const audio = getCtx();
  if (!audio) return false;
  if (audio.state === "suspended") void audio.resume();
  if (audio.state !== "running") return false;
  const now = audio.currentTime;
  for (const n of seq) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = n.freq;
    const start = now + n.at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(n.gain ?? 0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + n.dur + 0.05);
  }
  return true;
}

/** Bright double-ping for a newly received order on the kitchen display. */
export function chimeNewOrder(): boolean {
  return playTones([
    { freq: 880, at: 0, dur: 0.35 },
    { freq: 1174.66, at: 0.18, dur: 0.45 },
    { freq: 880, at: 0.6, dur: 0.35 },
    { freq: 1174.66, at: 0.78, dur: 0.5 },
  ]);
}

/** Soft two-note cue for any order status change. */
export function chimeStatus(): boolean {
  return playTones([
    { freq: 587.33, at: 0, dur: 0.3, gain: 0.22 },
    { freq: 880, at: 0.14, dur: 0.5, gain: 0.22 },
  ]);
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

export function vibrateTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([60, 50, 60]);
    } catch {
      /* ignored */
    }
  }
}

