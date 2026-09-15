/** Visual/audio timing is isolated from combat balance. Milliseconds unless noted. */
export const presentation = {
  parry: { flash: 170, spread: 0.55, minAxisChange: 0.55 },
  bloom: {
    duration: 900,
    count: 56,
    petalRadius: 23,
    auraRadius: 38,
    colors: [0xffd757, 0xffefac, 0xffa84d, 0xe7f9a5],
  },
  growth: {
    duration: 700,
    count: 42,
    minSpeed: 95,
    spreadSpeed: 190,
    gravity: 350,
  },
  finisher: {
    windupFraction: 0.76,
    flash: 260,
    shake: 0.008,
    shakeDuration: 180,
  },
  impact: { flash: 140 },
};
