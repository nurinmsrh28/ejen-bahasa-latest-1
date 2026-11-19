class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientInterval: number | null = null;
  private ambientPlaying = false;
  private introDroneOscs: OscillatorNode[] = [];
  private introDroneGain: GainNode | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
      this.stopIntroAmbience();
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.06,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.playTone(440, 0.055, 'triangle', 0.035);
  }

  playTransition() {
    if (!this.enabled) return;
    this.playTone(196.0, 0.28, 'sine', 0.035, 0);
    this.playTone(293.66, 0.34, 'triangle', 0.03, 0.06);
    this.playTone(392.0, 0.38, 'sine', 0.025, 0.12);
  }

  playIntroAmbience() {
    if (!this.enabled || this.introDroneOscs.length > 0) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.032, now + 1.4);

      filter.connect(master);
      master.connect(ctx.destination);

      const freqs = [110, 164.81, 220]; // A2 - E3 - A3 mysterious detective fifths
      const oscs: OscillatorNode[] = [];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(filter);
        osc.start(now);
        oscs.push(osc);
      });

      this.introDroneGain = master;
      this.introDroneOscs = oscs;
    } catch {
      // Ignore Web Audio errors on restricted autoplay
    }
  }

  stopIntroAmbience() {
    if (this.introDroneOscs.length === 0) return;
    try {
      const ctx = this.ctx;
      const gain = this.introDroneGain;
      const oscs = this.introDroneOscs;
      this.introDroneOscs = [];
      this.introDroneGain = null;

      if (ctx && gain) {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        window.setTimeout(() => {
          oscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {
              // ignore
            }
          });
          try {
            gain.disconnect();
          } catch {
            // ignore
          }
        }, 500);
      } else {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {
            // ignore
          }
        });
      }
    } catch {
      this.introDroneOscs = [];
      this.introDroneGain = null;
    }
  }

  playClueFound() {
    this.playTone(523.25, 0.14, 'sine', 0.065, 0);
    this.playTone(659.25, 0.18, 'sine', 0.065, 0.07);
    this.playTone(783.99, 0.24, 'triangle', 0.055, 0.14);
    this.playTone(1046.5, 0.34, 'sine', 0.04, 0.2);
  }

  playHint() {
    this.playTone(392, 0.14, 'triangle', 0.05, 0);
    this.playTone(493.88, 0.18, 'sine', 0.05, 0.08);
  }

  playSuccess() {
    this.playTone(440, 0.12, 'triangle', 0.06, 0);
    this.playTone(554.37, 0.14, 'triangle', 0.06, 0.08);
    this.playTone(659.25, 0.16, 'triangle', 0.06, 0.16);
    this.playTone(880, 0.32, 'sine', 0.07, 0.24);
  }

  playError() {
    this.playTone(220, 0.14, 'sawtooth', 0.035, 0);
    this.playTone(185, 0.18, 'sawtooth', 0.035, 0.09);
  }

  playPlace() {
    this.playTone(349.23, 0.09, 'triangle', 0.055, 0);
    this.playTone(523.25, 0.12, 'sine', 0.05, 0.04);
  }

  playFootstep(running = false) {
    if (!this.enabled) return;
    const baseFreq = running ? 132 + Math.random() * 24 : 108 + Math.random() * 16;
    this.playTone(baseFreq, 0.045, 'triangle', running ? 0.022 : 0.015);
  }

  playJump() {
    if (!this.enabled) return;
    this.playTone(210, 0.08, 'sine', 0.032, 0);
    this.playTone(310, 0.1, 'triangle', 0.025, 0.04);
  }

  toggleAmbient() {
    if (this.ambientPlaying) {
      this.stopAmbient();
      return false;
    }
    this.startAmbient();
    return true;
  }

  startAmbient() {
    if (!this.enabled || this.ambientPlaying || typeof window === 'undefined') return;
    const notes = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
    let step = 0;
    this.ambientPlaying = true;
    const triggerNote = () => {
      if (!this.enabled || !this.ambientPlaying) return;
      this.playTone(notes[step % notes.length], 0.9, 'sine', 0.018);
      step += 1;
    };
    triggerNote();
    this.ambientInterval = window.setInterval(triggerNote, 1100);
  }

  stopAmbient() {
    this.ambientPlaying = false;
    if (this.ambientInterval !== null) {
      window.clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  isAmbientPlaying() {
    return this.ambientPlaying;
  }
}

export const gameAudio = new GameAudioEngine();
