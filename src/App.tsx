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
  speed,
} from './curves';
import { inverse2d } from './vector';
import { createSpline } from './splines';

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

  const [i0Adjusted, setI0Adjusted] = createSignal(1.0);
  const [i1Adjusted, setI1Adjusted] = createSignal(1.0);
  const [i2Adjusted, setI2Adjusted] = createSignal(1.0);
  const [i3Adjusted, setI3Adjusted] = createSignal(1.0);
  const [i4Adjusted, setI4Adjusted] = createSignal(1.0);

  const [sArcLengthValue, setSArcLengthValue] = createSignal(0.0);

  const [uEval, setUEval] = createSignal(new Point(0, 0));
  const [sEval, setSEval] = createSignal(new Point(0, 0));
  const [tEval, setTEval] = createSignal(new Point(0, 0));

  const [uSpeed, setUSpeed] = createSignal('');
  const [sSpeed, setSSpeed] = createSignal('');
  const [tSpeed, setTSpeed] = createSignal('');

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

    setUEval(uValRes);
    setSEval(sValRes);
    setTEval(tValRes);

    const uSpeedVal =
      uValue() < 0.05 || uValue() > 0.99 ? '-' : speed(aPolyNormal, uValue(), 0.25).toFixed(2);
    const tSpeedVal =
      tValue() < -1.95 || tValue() > 1.95 ? '-' : speed(aPoly, tValue(), 1).toFixed(2);
    const sSpeedVal =
      sValue() < 0.05 || sValue() > 11.4
        ? '-'
        : speed(aPolyArcLength, sValue(), 1 / 11.5).toFixed(2);

    setUSpeed(uSpeedVal);
    setTSpeed(tSpeedVal);
    setSSpeed(sSpeedVal);

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

  const seti0AdjustedW = (v: number) => {
    setI0Adjusted(v);
    drawAllEvals();
  };

  const seti1AdjustedW = (v: number) => {
    setI1Adjusted(v);
    drawAllEvals();
  };

  const seti2AdjustedW = (v: number) => {
    setI2Adjusted(v);
    drawAllEvals();
  };

  const seti3AdjustedW = (v: number) => {
    setI3Adjusted(v);
    drawAllEvals();
  };

  const seti4AdjustedW = (v: number) => {
    setI4Adjusted(v);
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
    const coefficients1 = [
      -5 * 0.9 * i0Adjusted(),
      -1.5 * 0.9 * i1Adjusted(),
      -1 * 0.9 * i2Adjusted(),
      0.5 * 0.9 * i3Adjusted(),
      0.5 * 0.9 * i4Adjusted(),
    ];
    const coefficients2 = [
      -1 * 0.9 * i0Adjusted(),
      -1.5 * 0.9 * i1Adjusted(),
      -1 * 0.9 * i2Adjusted(),
      0.5 * 0.9 * i3Adjusted(),
      0.5 * 0.9 * i4Adjusted(),
    ];
    const coefficients3 = [
      3 * 0.9 * i0Adjusted(),
      -1.5 * 0.9 * i1Adjusted(),
      -1 * 0.9 * i2Adjusted(),
      0.5 * 0.9 * i3Adjusted(),
      0.5 * 0.9 * i4Adjusted(),
    ];

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

  onMount(() => {
    init();
  });

  return (
    <div>
      <header class={styles.header}>
        <h1 title="Toggle Log" onClick={[toggleLog, null]}>
          Curve Box
        </h1>
        <p>A fidget spinner that also shows curve parameterization, aka Hours of Fun</p>
      </header>
      <header class={styles.header}>
        <canvas
          class={styles.pointCanvas}
          onContextMenu={contextMenuHandler}
          id="main-canvas"
        ></canvas>
        <div></div>
      </header>

      <details>
        <summary>Parameterization</summary>

        <div class="container">
          <header class="label bold">Arc length parameterization</header>
          <header class="label sm">
            {'s-Param: ' +
              sValue().toFixed(2) +
              ', Value: [' +
              sEval().x.toFixed(2) +
              ', ' +
              sEval().y.toFixed(2) +
              '], Speed: \u{2248} ' +
              sSpeed()}
          </header>
          <header class="label">
            <input
              type="range"
              step="0.01"
              min="0"
              max={sArcLengthValue()}
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              id="myRange2"
              value={sValue()}
              onInput={(e) => setSValueW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">Normal parameterization</header>
          <header class="label sm">
            {'u-Param: ' +
              uValue().toFixed(2) +
              ', Value: [' +
              uEval().x.toFixed(2) +
              ', ' +
              uEval().y.toFixed(2) +
              '], Speed: \u{2248} ' +
              uSpeed()}
          </header>
          <header class="label">
            <input
              type="range"
              step="0.01"
              min="0"
              max="1.00"
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              id="myRange1"
              value={uValue()}
              onInput={(e) => setUValueW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">Original bounds parameterization</header>
          <header class="label sm">
            {'t-Param: ' +
              tValue().toFixed(2) +
              ', Value: [' +
              tEval().x.toFixed(2) +
              ', ' +
              tEval().y.toFixed(2) +
              '], Speed: \u{2248} ' +
              tSpeed()}
          </header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min={range[0]}
              max={range[1]}
              id="myRange3"
              value={tValue()}
              onInput={(e) => setTValueW(+e.currentTarget.value)}
            />
          </header>
        </div>
      </details>
      <details>
        <summary>Coefficient scale</summary>
        <div class="container">
          <header class="label bold">a0: {i0Adjusted()}</header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min="0.5"
              max="1.5"
              id="myRange3"
              value={i0Adjusted()}
              onInput={(e) => seti0AdjustedW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">a1: {i1Adjusted()}</header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min="0.5"
              max="1.5"
              id="myRange1"
              value={i1Adjusted()}
              onInput={(e) => seti1AdjustedW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">a2: {i2Adjusted()}</header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min="0.5"
              max="1.5"
              id="myRange2"
              value={i2Adjusted()}
              onInput={(e) => seti2AdjustedW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">a3: {i3Adjusted()}</header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min="0.5"
              max="1.5"
              id="myRange3"
              value={i3Adjusted()}
              onInput={(e) => seti3AdjustedW(+e.currentTarget.value)}
            />
          </header>
        </div>

        <div class="container">
          <header class="label bold">a4: {i4Adjusted()}</header>
          <header class="label">
            <input
              class="h-3 bg-neutral-quaternary rounded-full cursor-pointer range-sm"
              type="range"
              step="0.01"
              min="0.5"
              max="1.5"
              id="myRange4"
              value={i4Adjusted()}
              onInput={(e) => seti4AdjustedW(+e.currentTarget.value)}
            />
          </header>
        </div>
      </details>
    </div>
  );
};

export default App;
