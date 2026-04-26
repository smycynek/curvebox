import { createSignal, onMount, type Component } from 'solid-js';
import styles from './App.module.css';
import { Point } from './Point';
import { Color } from './color';
import { AboutBox } from './AboutBox';
import { Logger, LoggerLevel } from './Logger';
import { anyPolynomial } from './curves';

const App: Component = () => {
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;

  // Canvas height
  const [height, setHeight] = createSignal(0);

  // Only called once to give a reasonable sized canvas that is square
  // and a multiple of 50px
  const resizeCanvas = () => {
    const reducedHeight = window.innerHeight * 0.6;
    const roundedHeight = reducedHeight - (reducedHeight % 50);
    const reducedWidth = window.innerWidth * 0.85;
    const roundedWidth = reducedWidth - (reducedWidth % 50);

    if (roundedWidth > roundedHeight) {
      canvas.width = roundedHeight;
      canvas.height = roundedHeight;
    } else {
      canvas.width = roundedWidth;
      canvas.height = roundedWidth;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context = canvas.getContext('2d')!;
    setHeight(canvas.height);
  };

  // 50px spaced grid point for reference
  const drawGrid = () => {
    for (let idx = 50; idx < canvas.width; idx += 50) {
      for (let idy = 50; idy < canvas.height; idy += 50) {
        drawGridPoint(idx, idy);
      }
    }
    drawCurveAsSegments(canvas, 0, 5, Color.blue, anyPolynomial(1, 0, 0, 0), 10, new Point(0, 0));
    drawCurveAsSegments(canvas, 0, 5, Color.red, anyPolynomial(-1, 0, 0, 0), 10, new Point(0, 0));
    drawCurveAsSegments(canvas, 0, 5, Color.orange, anyPolynomial(0.1, 0, 0), 10, new Point(0, 0));
    drawCurveAsSegments(canvas, 0, 5, Color.black, anyPolynomial(2, 0), 10, new Point(0, 0));
  };

  const drawCurveAsSegments = (
    canvas: HTMLCanvasElement,
    start: number,
    end: number,
    color: Color,
    func: (n: number) => Point,
    scale: number,
    offset: Point = new Point(0, 0)
  ): [Point, Point] => {
    const points: Point[] = [];

    for (let idx = start; idx <= end; idx += 0.1) {
      points.push(func(idx));
    }
    drawCurvePointCartSegments(canvas, points, scale, color, offset);
    return [points[0], points[points.length - 1]] as [Point, Point];
  };

  const toggleLog = () => {
    console.log('Cycle logging');
    switch (Logger.loggerLevel) {
      case LoggerLevel.None:
        Logger.loggerLevel = LoggerLevel.Info;
        break;
      case LoggerLevel.Info:
        Logger.loggerLevel = LoggerLevel.Trace;
        break;
      default:
        Logger.loggerLevel = LoggerLevel.None;
    }
    console.log(`Set to ${LoggerLevel[Logger.loggerLevel]}`);
  };

  const init = () => {
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    canvas = document.getElementById('main-canvas')! as HTMLCanvasElement;
    resizeCanvas();
    drawGrid();
  };

  const drawGridPoint = (x: number, y: number) => {
    drawPoint(x, y, Color.black, 0.75);
  };

  const drawCurvePointCart = (
    c: HTMLCanvasElement,
    p: Point,
    scale: number,
    offset: Point = new Point(0, 0)
  ) => {
    drawPoint(
      (p.x + offset.x) * scale + c.width / 2 + offset.x,
      (-p.y - offset.y) * scale + c.height / 2 + offset.y,
      Color.blue,
      3
    );
  };

  const drawCurvePointCartSegments = (
    c: HTMLCanvasElement,
    points: Point[],
    scale: number,
    color: Color,
    offset: Point = new Point(0, 0)
  ) => {
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(c, points[i], points[i + 1], color, scale, offset);
    }
  };

  const drawPoint = (
    x: number, // note, screen coords
    y: number,
    color: Color,
    radius: number = 2
  ) => {
    if (!canvas) {
      init();
    }
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  };

  const drawLine = (
    c: HTMLCanvasElement,
    p1: Point,
    p2: Point,
    color: Color,
    scale: number,
    offset: Point = new Point(0, 0)
  ) => {
    if (!canvas) {
      init();
    }
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(
      (p1.x + offset.x) * scale + c.width / 2 + offset.x,
      (-p1.y - offset.y) * scale + c.height / 2 + offset.y
    );
    context.lineTo(
      (p2.x + offset.x) * scale + c.width / 2 + offset.x,
      (-p2.y - offset.y) * scale + c.height / 2 + offset.y
    );
    context.stroke();
  };

  const contextMenuHandler = (data: MouseEvent) => {
    data.preventDefault();
  };

  onMount(() => {
    init();
  });

  return (
    <div>
      <header class={styles.header}>
        <h1 title="Toggle Log" onClick={[toggleLog, null]}>
          Curve Box
        </h1>
        <h2>Hours of Fun*</h2>
        <p>Simple curve and spline plotting</p>
      </header>
      <header class={styles.header}>
        <canvas
          class={styles.pointCanvas}
          onContextMenu={contextMenuHandler}
          id="main-canvas"
        ></canvas>
        <div></div>
      </header>
      <header class={styles.row}></header>

      <hr />

      <div>
        <AboutBox></AboutBox>
      </div>
    </div>
  );
};

export default App;
