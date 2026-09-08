/**
 * HTML5 Web Audio API Synthesizer for Emergency Audible Alerts (SIH26024).
 * Generates an alternating dual-tone statutory siren (800Hz - 1200Hz)
 * without external audio asset dependencies. Safe for modern browser autoplay policies.
 */

class EmergencySirenSynthesizer {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;

  public async play(durationMs: number = 8000): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.isPlaying) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("Web Audio API not supported on this platform.");
        return;
      }

      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      // Use a harsh sawtooth/triangle wave for statutory alert urgency
      this.oscillator.type = "sawtooth";
      this.oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);

      // Volume envelope with gentle ramp-up to prevent click
      this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.1);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();
      this.isPlaying = true;

      // Alternating 800Hz <-> 1200Hz dual-tone every 250ms
      let highTone = false;
      const startTime = Date.now();

      this.intervalId = setInterval(() => {
        if (!this.isPlaying || !this.audioCtx || !this.oscillator) {
          this.stop();
          return;
        }

        const elapsed = Date.now() - startTime;
        if (durationMs > 0 && elapsed >= durationMs) {
          this.stop();
          return;
        }

        highTone = !highTone;
        const targetFreq = highTone ? 1200 : 800;
        this.oscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.05);
      }, 250);
    } catch (err) {
      console.warn("Audible alert playback prevented by browser audio policy or error:", err);
      this.isPlaying = false;
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.gainNode && this.audioCtx && this.audioCtx.state === "running") {
      try {
        this.gainNode.gain.setTargetAtTime(0.001, this.audioCtx.currentTime, 0.05);
      } catch {}
    }

    setTimeout(() => {
      if (this.oscillator) {
        try {
          this.oscillator.stop();
          this.oscillator.disconnect();
        } catch {}
        this.oscillator = null;
      }
      this.isPlaying = false;
    }, 80);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const sirenSynthesizer = new EmergencySirenSynthesizer();

/**
 * Synthesizes an emergency dual-tone siren (800Hz - 1200Hz).
 * @param durationMs Duration in ms before auto-stopping (default: 8000ms).
 */
export function playEmergencySiren(durationMs: number = 8000): void {
  sirenSynthesizer.play(durationMs);
}

/**
 * Immediately stops any currently sounding emergency siren.
 */
export function stopEmergencySiren(): void {
  sirenSynthesizer.stop();
}

/**
 * Checks if emergency siren is currently active.
 */
export function isEmergencySirenPlaying(): boolean {
  return sirenSynthesizer.getIsPlaying();
}
