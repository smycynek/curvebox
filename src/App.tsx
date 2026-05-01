import { createSignal, onMount, type Component } from 'solid-js';
import styles from './App.module.css';
import { Point } from './Point';
import { Color } from './color';
import { Logger, LoggerLevel } from './Logger';
import {
  anyPolynomial,
  arcLength,
  arcLengthParametrization,
  normalParametrization,
} from './curves';
import { getMousePos, getTouchPos, round1 } from './utility';

interface DrawConfig {
  color: Color;
  scale: number;
  offset: Point;
  canvas: HTMLCanvasElement;
}

const App: Component = () => {
  const range: [number, number] = [-2, 2];
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let aPoly: (t: number) => Point;
  let aPolyArcLength: (t: number) => Point;
  let aPolyNormal: (t: number) => Point;
  // Canvas height
  const [height, setHeight] = createSignal(0);
  const [uValue, setUValue] = createSignal(0.0);
  const [sValue, setSValue] = createSignal(0.0);
  const [tValue, setTValue] = createSignal(0.0);
  const [sArcLengthValue, setSArcLengthValue] = createSignal(0.0);
  const [pt, setPt] = createSignal('Waiting for mouse move...');
  // Only called once to give a reasonable sized canvas that is square
  // and a multiple of 50px

  const drawAllEvals = () => {
    drawCurves();
    drawPoints();
  };
  const drawPoints = () => {
    const uValRes = aPolyNormal(uValue());
    const sValRes = aPolyArcLength(sValue());
    const tValRes = aPoly(tValue());

    drawPoint(
      canvas.width / 2 + uValRes.x * 20,
      canvas.height / 2 - uValRes.y * 20,
      Color.black,
      4
    );
    drawPoint(
      canvas.width / 2 + sValRes.x * 20,
      canvas.height / 2 - sValRes.y * 20,
      Color.black,
      4
    );
    drawPoint(
      canvas.width / 2 + tValRes.x * 20,
      canvas.height / 2 - tValRes.y * 20,
      Color.black,
      4
    );
  };

  const setUValueW = (v: number) => {
    setUValue(v);
    drawAllEvals();
  };

  const setTValueW = (v: number) => {
    setTValue(v);
    drawAllEvals();
  };

  const setSValueW = (v: number) => {
    setSValue(v);
    drawAllEvals();
  };

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
    // drawPoint(canvas.width / 2, canvas.height / 2, Color.black, 3);
    drawCurvePointCartSegments([new Point(0, -100), new Point(0, 100)], getDrawConfig(Color.black));
    drawCurvePointCartSegments([new Point(-100, 0), new Point(100, 0)], getDrawConfig(Color.black));
  };

  const drawCurves = () => {
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    const coefficients1 = [-5 * 0.9, -1.5 * 0.9, -1 * 0.9, 0.5 * 0.9, 0.5 * 0.9];
    const coefficients2 = [-1 * 0.9, -1.5 * 0.9, -1 * 0.9, 0.5 * 0.9, 0.5 * 0.9];
    const coefficients3 = [3 * 0.9, -1.5 * 0.9, -1 * 0.9, 0.5 * 0.9, 0.5 * 0.9];

    aPoly = anyPolynomial(coefficients1);

    drawCurveAsSegments(-2, 2, aPoly, getDrawConfig(Color.blue));
    const theArcLength = arcLength(aPoly, range);
    console.log(`Arc length of curve from ${range[0]} to ${range[1]} is ${theArcLength}`);

    aPolyNormal = normalParametrization(anyPolynomial(coefficients2), range);
    drawCurveAsSegments(0, 1, aPolyNormal, getDrawConfig(Color.red));

    aPolyArcLength = arcLengthParametrization(anyPolynomial(coefficients3), range);
    setSArcLengthValue(arcLength(aPoly, range));
    console.log(sArcLengthValue());
    drawCurveAsSegments(0, theArcLength, aPolyArcLength, getDrawConfig(Color.darkgreen));
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
    // points.forEach((p, idx) => Logger.info(`Point ${idx}: (${p.x}, ${p.y})`));

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
    setTValue(range[0]);
    drawCurves();
    drawPoints();
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
    context.lineWidth = 2;
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
    // Logger.info(`Mouse over at (${x}, ${y})`);
    // setPt(`Mouse Position: (${x}, ${y})`);
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
        <p>Simple curve and parameter plotting</p>
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

      <div class="container">
        <header class="label bold">Arc length parameterization</header>
        <header class="label">{'s-Param: ' + sValue().toFixed(2)}</header>
        <header class="label">
          <input
            type="range"
            step="0.01"
            min="0"
            max={sArcLengthValue()}
            class="slider"
            id="myRange2"
            value={sValue()}
            onInput={(e) => setSValueW(+e.currentTarget.value)}
          />
        </header>
      </div>

      <div class="container">
        <header class="label bold">Normal parameterization</header>
        <header class="label">{'u-Param: ' + uValue().toFixed(2)}</header>
        <header class="label">
          <input
            type="range"
            step="0.01"
            min="0"
            max="1.00"
            class="slider"
            id="myRange1"
            value={uValue()}
            onInput={(e) => setUValueW(+e.currentTarget.value)}
          />
        </header>
      </div>

      <div class="container">
        <header class="label bold">Original bounds parameterization</header>
        <header class="label">{'t-Param: ' + tValue().toFixed(2)}</header>
        <header class="label">
          <input
            type="range"
            step="0.01"
            min={range[0]}
            max={range[1]}
            class="slider"
            id="myRange3"
            value={tValue()}
            onInput={(e) => setTValueW(+e.currentTarget.value)}
          />
        </header>
      </div>
    </div>
  );
};

export default App;
