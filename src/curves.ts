import { Logger } from './Logger';
import { Point } from './Point';

export function sine(t: number): Point {
  return new Point(t, Math.sin(t));
}

export function cosine(t: number): Point {
  return new Point(t, Math.cos(t));
}

export function anyCircle(radius: number) {
  const circleFunc = (t: number): Point => {
    return new Point(radius * Math.cos(t), radius * Math.sin(t));
  };
  return circleFunc;
}

export function anyPolynomial(coefficients: number[]) {
  const polyFunc = (t: number): Point => {
    let y = 0;
    for (let idx = 0; idx < coefficients.length; idx++) {
      y += coefficients[idx] * Math.pow(t, idx);
    }
    return new Point(t, y);
  };
  Logger.info(
    `Created polynomial with coefficients ${coefficients} and order ${coefficients.length - 1} `
  );
  return polyFunc;
}

export function speed(func: (t: number) => Point, t: number, scale: number = 1): number {
  let tAdjusted = t;
  if (t <= 0.01) {
    tAdjusted = t + 0.03;
  }
  const s1 = func(tAdjusted);
  const s2 = func(tAdjusted - 0.001 * scale);
  return (s2.y - s1.y) / (s2.x - s1.x);
}

export function normalParametrization(
  func: (t: number) => Point,
  bounds: [number, number]
): (t: number) => Point {
  const [a, b] = bounds;
  const reparamFunc = (t: number): Point => {
    return func(a + t * (b - a));
  };
  return reparamFunc;
}

export function arcLengthParametrization(
  func: (t: number) => Point,
  bounds: [number, number]
): (t: number) => Point {
  const arcLengthValue = arcLength(func, bounds);
  const [a, b] = bounds;
  const reparamFunc = (t: number): Point => {
    return func(a + (t * (b - a)) / arcLengthValue);
  };
  return reparamFunc;
}

export function arcLength(
  func: (t: number) => Point,
  range: [number, number],
  numSamples: number = 100
): number {
  const step = (range[1] - range[0]) / numSamples;
  let length = 0;
  const samples: Point[] = [];
  for (let i = range[0]; i <= range[1]; i += step) {
    samples.push(func(i));
  }
  samples.push(func(range[1]));
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}
