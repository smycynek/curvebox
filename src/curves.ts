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

export function anyPolynomial(coefficients: number[], reparam: number[] = [0, 1]) {
  const polyFunc = (t: number): Point => {
    let y = 0;
    for (let idx = 0; idx < coefficients.length; idx++) {
      y += coefficients[idx] * Math.pow(t, coefficients.length - idx - 1);
    }
    return new Point(reparam[0] + t * reparam[1], y);
  };

  Logger.info(
    `Created polynomial with coefficients ${coefficients} and order ${coefficients.length - 1} `
  );

  return polyFunc;
}

// Given a polynomial def and a param range [a,b], how easy is it without libs to
// create a u [0,1] reparam? what about a natural/arc length?
// Do I need to symbolically work out f(g(h)) and store that as a new set of polynomial coefficients? That seems like a nightmare. Maybe I can just do it numerically? Like, sample the curve at a bunch of points, measure the distance along the curve at each point, and then create a new function that maps u to t based on those distances. That way I can get a pretty good approximation of the arc length parameterization without having to do any symbolic math.
