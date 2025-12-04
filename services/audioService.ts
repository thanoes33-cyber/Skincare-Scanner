
export class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
          this.ctx = new AudioContext();
      }
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (!this.enabled || !this.ctx) return;
    
    // Ensure context is running (browsers suspend it until user interaction)
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    
    // Envelope to avoid clicking sound
    gain.gain.setValueAtTime(0, this.ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  playSuccess() {
    // cheerful major third
    this.playTone(880, 'sine', 0.1); // A5
    this.playTone(1108.73, 'sine', 0.2, 0.1); // C#6
  }

  playError() {
    // discordant buzz
    this.playTone(150, 'sawtooth', 0.3);
    this.playTone(140, 'sawtooth', 0.3);
  }

  playClick() {
    // short neutral tick
    this.playTone(600, 'sine', 0.05);
  }

  playScanComplete() {
    // upward arpeggio
    this.playTone(523.25, 'sine', 0.1, 0);   // C5
    this.playTone(659.25, 'sine', 0.1, 0.1); // E5
    this.playTone(783.99, 'sine', 0.2, 0.2); // G5
  }
}

export const audioService = new AudioService();
