export type SoundKind =
  | "parry"
  | "perfect"
  | "break"
  | "hit"
  | "swing"
  | "cue"
  | "hurt"
  | "water"
  | "fertilizer"
  | "finisher"
  | "growth"
  | "charge"
  | "bloom"
  | "bloomEnd"
  | "flowerWave"
  | "flowerHit"
  | "phase"
  | "victory"
  | "quakeCue"
  | "quake";
export class AudioFeedback {
  ctx?: AudioContext;
  muted = false;
  output?: DynamicsCompressorNode;
  ring?: GainNode;
  dispose() {
    if (this.ctx) void this.ctx.close();
    this.ctx = undefined;
    this.output = undefined;
    this.ring = undefined;
  }
  unlock() {
    if (!this.ctx) {
      const c = (this.ctx = new AudioContext());
      const limiter = (this.output = c.createDynamicsCompressor());
      limiter.threshold.value = -14;
      limiter.knee.value = 12;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.18;
      const master = c.createGain();
      master.gain.value = 0.6;
      limiter.connect(master);
      master.connect(c.destination);
      const send = (this.ring = c.createGain()),
        delay = c.createDelay(0.3),
        feedback = c.createGain(),
        filter = c.createBiquadFilter();
      send.gain.value = 0.2;
      delay.delayTime.value = 0.081;
      feedback.gain.value = 0.26;
      filter.type = "lowpass";
      filter.frequency.value = 5400;
      send.connect(delay);
      delay.connect(filter);
      filter.connect(limiter);
      filter.connect(feedback);
      feedback.connect(delay);
    }
    void this.ctx.resume();
  }
  play(kind: SoundKind) {
    if (!this.ctx || this.muted || !this.output) return;
    if (kind === "phase") {
      this.tone(130, 260, 0.16, 0.8);
      this.tone(390, 780, 0.08, 0.7, 0.12);
      return;
    }
    if (kind === "victory") {
      [523, 659, 784, 1046].forEach((f, i) =>
        this.tone(f, f, 0.08, 1.1, i * 0.15),
      );
      return;
    }
    if (kind === "quakeCue") {
      this.tone(165, 165, 0.16, 0.22);
      return;
    }
    if (kind === "quake") {
      this.tone(110, 40, 0.3, 0.35);
      this.noise(0.2, 0.18, 800);
      return;
    }
    if (kind === "bloom") {
      [523, 659, 784, 1046, 1318].forEach((f, i) =>
        this.tone(f, f * 1.003, 0.065, 0.95, i * 0.065),
      );
      this.noise(0.22, 0.07, 2600);
      return;
    }
    if (kind === "bloomEnd") {
      this.tone(784, 659, 0.035, 0.4);
      this.tone(523, 523, 0.04, 0.5, 0.1);
      return;
    }
    if (kind === "flowerWave") {
      this.noise(0.18, 0.15, 3200);
      this.tone(660, 1320, 0.08, 0.22);
      return;
    }
    if (kind === "flowerHit") {
      this.noise(0.1, 0.18, 1800);
      this.tone(330, 165, 0.14, 0.2);
      return;
    }
    if (kind === "growth") {
      [660, 880, 1320, 1760].forEach((f, i) =>
        this.tone(f, f * 1.01, 0.065, 0.48, i * 0.055),
      );
      return;
    }
    if (kind === "charge") {
      this.tone(130, 310, 0.09, 0.18);
      return;
    }
    if (kind === "finisher") {
      this.tone(145, 43, 0.55, 0.55);
      this.tone(310, 95, 0.2, 0.3, 0.008);
      this.tone(780, 760, 0.11, 0.9, 0.016);
      this.noise(0.2, 0.55, 950);
      return;
    }
    const c = this.ctx,
      t = c.currentTime,
      metal = ["parry", "perfect", "break", "finisher"].includes(kind);
    const base =
      kind === "water"
        ? 1250
        : kind === "fertilizer"
          ? 680
          : kind === "break"
            ? 390
            : kind === "perfect"
              ? 1050
              : kind === "parry"
                ? 790
                : kind === "cue"
                  ? 440
                  : kind === "hurt"
                    ? 95
                    : kind === "hit"
                      ? 180
                      : 240;
    const modes = metal ? [1, 1.47, 2.09, 2.76, 3.91, 5.12] : [1, 2];
    const duration =
      kind === "break"
        ? 1.5
        : kind === "perfect"
          ? 1.2
          : metal
            ? 0.9
            : kind === "cue"
              ? 0.07
              : 0.18;
    modes.forEach((ratio, i) => {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = metal ? "sine" : kind === "hurt" ? "sawtooth" : "triangle";
      o.frequency.setValueAtTime(base * ratio, t);
      if (!metal)
        o.frequency.exponentialRampToValueAtTime(
          base * ratio * 0.5,
          t + duration,
        );
      const decay = duration / (1 + i * 0.35);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(
        (metal ? 0.19 : 0.1) / (1 + i * 0.7),
        t + 0.002,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      g.connect(this.output!);
      if (metal) g.connect(this.ring!);
      o.start(t);
      o.stop(t + decay + 0.02);
    });
    if (metal || kind === "hit") {
      const length = kind === "break" ? 0.13 : 0.035;
      const b = c.createBuffer(1, c.sampleRate * length, c.sampleRate),
        a = b.getChannelData(0);
      for (let i = 0; i < a.length; i++)
        a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 3);
      const source = c.createBufferSource(),
        filter = c.createBiquadFilter(),
        gain = c.createGain();
      source.buffer = b;
      filter.type = "highpass";
      filter.frequency.value = metal ? 2400 : 500;
      gain.gain.value = metal ? 0.3 : 0.18;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.output);
      source.start(t);
    }
  }
  private tone(
    from: number,
    to: number,
    volume: number,
    duration: number,
    delay = 0,
  ) {
    const c = this.ctx!,
      t = c.currentTime + delay,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(this.output!);
    o.start(t);
    o.stop(t + duration + 0.02);
  }
  private noise(duration: number, volume: number, cutoff: number) {
    const c = this.ctx!,
      b = c.createBuffer(1, c.sampleRate * duration, c.sampleRate),
      a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++)
      a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 2);
    const s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = b;
    f.type = "lowpass";
    f.frequency.value = cutoff;
    g.gain.value = volume;
    s.connect(f);
    f.connect(g);
    g.connect(this.output!);
    s.start();
  }
}
