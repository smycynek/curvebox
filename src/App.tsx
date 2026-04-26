import { createSignal, onMount, type Component } from 'solid-js';
import styles from './App.module.css';
import { Point } from './Point';
import { Color } from './color';
import { AboutBox } from './AboutBox';
import { Logger, LoggerLevel } from './Logger';
import { anyCircle, anyPolynomial, circle } from './curves';
import { getMousePos, getTouchPos, round1, round2 } from './utility';

interface DrawConfig {
  color: Color;
  scale: number;
  offset: Point;
  canvas: HTMLCanvasElement;
}

const App: Component = () => {
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;

  // Canvas height
  const [height, setHeight] = createSignal(0);
  const [pt, setPt] = createSignal('');
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

  const getDrawConfig = (color: Color, offset: Point = new Point(0, 0)): DrawConfig => {
    return {
      color: color,
      canvas: canvas,
      scale: 20,
      offset: offset,
    };
  };

  // 50px spaced grid point for reference
  const drawGrid = () => {
    for (let idx = -canvas.width / 2; idx <= canvas.width; idx += 20) {
      for (let idy = -canvas.height / 2; idy < canvas.height; idy += 20) {
        drawGridPoint(idx, idy);
      }
    }
    drawPoint(canvas.width / 2, canvas.height / 2, Color.darkgreen, 5);
    drawCurvePointCartSegments([new Point(0, 0), new Point(0, 100)], getDrawConfig(Color.black));
    drawCurvePointCartSegments([new Point(0, 0), new Point(100, 0)], getDrawConfig(Color.black));
  };

  const drawCurves = () => {
    //  drawCurveAsSegments( 0, 1,  anyPolynomial(1, 0, 0, 0), getDrawConfig(Color.red));
    //  drawCurveAsSegments( 1, 2,  anyPolynomial(1, 0, 0), getDrawConfig(Color.blue));

    //  drawCurveAsSegments( 0, 4,  anyPolynomial(-1, 0, 0), getDrawConfig(Color.darkgreen));
    //  drawCurveAsSegments( -4, 0,  anyPolynomial(-1, 2, -1, 0), getDrawConfig(Color.purple));
    // drawCurveAsSegments( 0, Math.PI, anyCircle(3), getDrawConfig(Color.black));

    // drawCurveAsSegments( 0, 4,  anyPolynomial([1, 0, 0]), getDrawConfig(Color.blue));
    // drawCurveAsSegments( 0, 1,  anyPolynomial([4, 8, 4], [2,2]), getDrawConfig(Color.red));

    // drawCurvePointCartSegments([new Point(2,4)], getDrawConfig(Color.purple));

    //  drawCurvePointCartSegments([new Point(0,0), new Point(2,4)], getDrawConfig(Color.orange));
    //  drawCurvePointCartSegments([new Point(2,4), new Point(4,16)], getDrawConfig(Color.orange));

    drawCurveAsSegments(0, 1, anyPolynomial([0.5, 0, 0]), getDrawConfig(Color.red));
    drawCurveAsSegments(1, 2, anyPolynomial([0.5, 0, 0, 0]), getDrawConfig(Color.blue));
    drawCurveAsSegments(2, 2.5, anyPolynomial([0.25, 0, 0, 2]), getDrawConfig(Color.darkgreen));
    drawCurveAsSegments(2.5, 3, anyPolynomial([0.5, 0, 5.56 / 2]), getDrawConfig(Color.orange));
  };

  const drawCurveAsSegments = (
    start: number,
    end: number,
    func: (n: number) => Point,
    config: DrawConfig
  ): [Point, Point] => {
    const points: Point[] = [];

    for (let idx = start; idx <= end; idx += 0.01) {
      points.push(func(idx));
    }
    points.push(func(end));

    Logger.info(`Drew curve from ${start} to ${end} with ${points.length} points`);
    points.forEach((p, idx) => Logger.info(`Point ${idx}: (${p.x}, ${p.y})`));

    drawCurvePointCartSegments(points, config);
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
    drawCurves();
  };

  const drawGridPoint = (x: number, y: number) => {
    drawPoint(x, y, Color.black, 0.25);
  };

  const drawCurvePointCartSegments = (points: Point[], config: DrawConfig) => {
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(points[i], points[i + 1], config);
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

  const drawLine = (p1: Point, p2: Point, config: DrawConfig) => {
    if (!canvas) {
      init();
    }
    context.strokeStyle = config.color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(
      (p1.x + config.offset.x) * config.scale + config.canvas.width / 2 + config.offset.x,
      (-p1.y - config.offset.y) * config.scale + config.canvas.height / 2 + config.offset.y
    );
    context.lineTo(
      (p2.x + config.offset.x) * config.scale + config.canvas.width / 2 + config.offset.x,
      (-p2.y - config.offset.y) * config.scale + config.canvas.height / 2 + config.offset.y
    );
    context.stroke();
  };

  const contextMenuHandler = (data: MouseEvent) => {
    data.preventDefault();
  };

  const mouseOverHandler = (data: MouseEvent) => {
    const pos = getMousePos(canvas, data);

    const x = round1((pos.x - canvas.width / 2) / 20);
    const y = round1(-(pos.y - canvas.height / 2) / 20);
    Logger.info(`Mouse over at (${x}, ${y})`);
    setPt(`Point: (${x}, ${y})`);
  };

  const touchMoveHandler = (data: TouchEvent) => {
    const touch = data.touches[0];
    if (touch) {
      const pos = getTouchPos(canvas, touch);

      const x = round1((pos.x - canvas.width / 2) / 20);
      const y = round1(-(pos.y - canvas.height / 2) / 20);
      Logger.info(`Touch move at (${x}, ${y})`);
      setPt(`Point:(${x}, ${y})`);
    }
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
        <p>Simple curve and spline plotting</p>
      </header>
      <header class={styles.header}>
        <canvas
          class={styles.pointCanvas}
          onMouseMove={mouseOverHandler}
          onTouchMove={touchMoveHandler}
          onContextMenu={contextMenuHandler}
          id="main-canvas"
        ></canvas>
        <div></div>
      </header>
      <header class="label">{pt()}</header>
      <hr />
    </div>
  );
};

export default App;
