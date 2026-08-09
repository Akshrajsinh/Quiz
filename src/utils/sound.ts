// Lightweight synthesized sound effects using the Web Audio API.
// No external audio files are required, so the app works fully offline.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  { type = 'sine', gain = 0.2, delay = 0, glideTo }: { type?: OscillatorType; gain?: number; delay?: number; glideTo?: number } = {}
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + delay + duration);
  }
  g.gain.setValueAtTime(gain, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.05);
}

export const sfx = {
  click: () => tone(660, 0.08, { type: 'triangle', gain: 0.15 }),
  navigate: () => tone(440, 0.12, { type: 'sine', gain: 0.15, glideTo: 660 }),
  correct: () => {
    tone(523.25, 0.15, { gain: 0.22 });
    tone(659.25, 0.15, { gain: 0.22, delay: 0.12 });
    tone(783.99, 0.3, { gain: 0.25, delay: 0.24 });
  },
  wrong: () => {
    tone(311.13, 0.25, { type: 'sawtooth', gain: 0.15 });
    tone(233.08, 0.35, { type: 'sawtooth', gain: 0.15, delay: 0.1 });
  },
  reveal: () => tone(880, 0.25, { type: 'triangle', gain: 0.2, glideTo: 220 }),
  tick: () => tone(1000, 0.04, { type: 'square', gain: 0.06 }),
  timeUp: () => {
    tone(220, 0.4, { type: 'sawtooth', gain: 0.2 });
    tone(196, 0.5, { type: 'sawtooth', gain: 0.2, delay: 0.2 });
  },
  spinStart: () => tone(200, 0.6, { type: 'sawtooth', gain: 0.15, glideTo: 900 }),
  spinStop: () => tone(700, 0.3, { type: 'triangle', gain: 0.2, glideTo: 300 }),
  drumroll: () => {
    for (let i = 0; i < 8; i++) tone(150, 0.05, { type: 'square', gain: 0.08, delay: i * 0.08 });
  },
  fanfare: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.4, { gain: 0.25, delay: i * 0.15 }));
  },
  whoosh: () => tone(300, 0.3, { type: 'sine', gain: 0.12, glideTo: 60 }),
  buzzerOpen: () => {
    tone(440, 0.1, { type: 'sine', gain: 0.2 });
    tone(880, 0.25, { type: 'triangle', gain: 0.3, delay: 0.08 });
  },
  buzzerPress: () => {
    tone(880, 0.12, { type: 'square', gain: 0.35 });
    tone(1174.66, 0.25, { type: 'square', gain: 0.35, delay: 0.08 });
  },
};

export function unlockAudio() {
  getCtx();
}
