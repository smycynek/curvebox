import * as tf from '@tensorflow/tfjs';
import { Point } from './Point';
import '@tensorflow/tfjs-backend-webgpu'; // This adds the WebGL backend to the global backend registry
import { Logger } from './Logger';

/*
Log tensor id, conveniently returns what is passed to it
*/
export function logId(
  tensor: tf.Tensor | tf.Tensor2D,
  prefix: string = ''
): tf.Tensor | tf.Tensor2D {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataId: any = tensor.dataId;
  Logger.trace(`${prefix} Tensor id:`, `${dataId.id}`);
  return tensor;
}

/*
Some implementations take random points from the collection of user-entered points, but
this also works well.
*/
export function randomSeedCentroid(max: number): Point {
  return new Point(Math.round(Math.random() * max), Math.round(Math.random() * max));
}

/*
From a collection of points, take the average xs and ys and return one
point (as a tensor)
*/
export function centroid(points: tf.Tensor2D | tf.Tensor): tf.Tensor {
  const centroid = points.mean(0);
  return logId(centroid, 'Centroid allocated');
}

/*
Return the distance of each point in pointList (the user points)
to each point in pointRefs (the center points) and return in a new tensor.
*/
export function distance(pointRefs: tf.Tensor, pointList: tf.Tensor): tf.Tensor {
  // sqrt is not technically needed here, since we only want the relative magnitude of each distance,
  // but still including it here for ease of debugging.

  // squaredDifference is a nice convenience here
  return tf.tidy(() => pointList.squaredDifference(pointRefs).sum(-1).sqrt()); // -1 is the last axis, non-intuitive
}

export function getMousePos(canvas: HTMLCanvasElement, mouseEvent: MouseEvent): Point {
  const canvasRect: DOMRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width; // scale because of bitmapping
  const scaleY = canvas.height / canvasRect.height;
  return new Point(
    (mouseEvent.clientX - canvasRect.left) * scaleX,
    (mouseEvent.clientY - canvasRect.top) * scaleY
  );
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
