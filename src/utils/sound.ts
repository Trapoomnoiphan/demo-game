/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private backgroundLoop: OscillatorNode | null = null;
  private backgroundLoop2: OscillatorNode | null = null;
  private backgroundGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    // AudioContext is initialized lazily upon first user interaction
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('game_sound_muted') === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('game_sound_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMuted;
  }

  getMuteStatus(): boolean {
    return this.isMuted;
  }

  playHover() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio playHover failed', e);
    }
  }

  playConfirm() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(this.ctx.currentTime + 0.25);
      osc2.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio playConfirm failed', e);
    }
  }

  playShoot() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio playShoot failed', e);
    }
  }

  playExplode() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      // Simple lowpass filter for explosive rumbling
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio playExplode failed', e);
    }
  }

  playShield() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio playShield failed', e);
    }
  }

  playGameOver() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [300, 260, 220, 180];
      const duration = 0.2;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * duration);
        gain.gain.setValueAtTime(0.08, now + idx * duration);
        gain.gain.exponentialRampToValueAtTime(0.005, now + (idx + 1) * duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * duration);
        osc.stop(now + (idx + 1) * duration);
      });
    } catch (e) {
      console.warn('Audio playGameOver failed', e);
    }
  }

  startMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.backgroundGain = this.ctx.createGain();
      this.backgroundGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      this.backgroundGain.connect(this.ctx.destination);

      // Low cyberpunk baseline pulsing beat
      this.backgroundLoop = this.ctx.createOscillator();
      this.backgroundLoop.type = 'sawtooth';
      this.backgroundLoop.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      // Frequency modulator to create rhythmic gaming pulsing "wub-wub"
      const modulator = this.ctx.createOscillator();
      modulator.frequency.value = 3; // LFO 3Hz speed
      const modGain = this.ctx.createGain();
      modGain.gain.value = 8; // range of wobble

      modulator.connect(modGain);
      modGain.connect(this.backgroundLoop.frequency);

      this.backgroundLoop.connect(this.backgroundGain);

      modulator.start();
      this.backgroundLoop.start();
      this.isMusicPlaying = true;
    } catch (e) {
      console.warn('Audio startMusic failed', e);
    }
  }

  stopMusic() {
    try {
      if (this.backgroundLoop) {
        this.backgroundLoop.stop();
        this.backgroundLoop.disconnect();
        this.backgroundLoop = null;
      }
      if (this.backgroundGain) {
        this.backgroundGain.disconnect();
        this.backgroundGain = null;
      }
      this.isMusicPlaying = false;
    } catch (e) {
      console.warn('Audio stopMusic failed', e);
    }
  }
}

export const sound = new SoundController();
