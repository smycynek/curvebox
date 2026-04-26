import { Logger } from './Logger';
import { Point } from './Point';

export function sine(t: number): Point {
  return new Point(t, Math.sin(t));
}

export function cosine(t: number): Point {
  return new Point(t, Math.cos(t));
}

export function quadratic(t: number): Point {
  return new Point(t, t * t);
}

export function nquadratic(t: number): Point {
  return new Point(t, -t * t);
}

export function cubic(t: number): Point {
  return new Point(t, t * t * t);
}

export function circle(t: number): Point {
  return new Point(Math.cos(t), Math.sin(t));
}

export function anyCubic(c3: number, c2: number, c1: number, c0: number) {
  const cubicFunc = (t: number): Point => {
    return new Point(t, c3 * t * t * t + c2 * t * t + c1 * t + c0);
  };
  return cubicFunc;
}

export function anyCircle(radius: number) {
  const circleFunc = (t: number): Point => {
    return new Point(radius * Math.cos(t), radius * Math.sin(t));
  };
  return circleFunc;
}

export function anyPolynomial(...coefficients: number[]) {
  const polyFunc = (t: number): Point => {
    let y = 0;
    for (let idx = 0; idx < coefficients.length; idx++) {
      y += coefficients[idx] * Math.pow(t, coefficients.length - idx - 1);
    }
    return new Point(t, y);
  };

  Logger.info(
    `Created polynomial with coefficients ${coefficients} and order ${coefficients.length - 1} `
  );

  return polyFunc;
}
