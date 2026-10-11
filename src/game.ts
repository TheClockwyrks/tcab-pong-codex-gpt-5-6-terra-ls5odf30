import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X0 as P2FACE,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type Rect = { x: number; y: number; w: number; h: number };
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): unknown;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): Rect | null;
}
export const BACKGROUND = "#07111f";
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n)),
  rnd = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const ball = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: rnd(),
  trail: [],
});
const obs = (i: number): ObstacleState => {
  const p = OBSTACLE_CENTERS[i];
  if (!p) throw Error(`Carom: no obstacle ${i}`);
  return { index: i, cx: p.x, cy: p.y };
};
const base = (muted = false, titleIndex = 0, simTime = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: [obs(0), obs(1)],
  simTime,
  muted,
});
const items = (x: Screen): readonly string[] =>
  x === "title"
    ? TITLE_ITEMS
    : x === "paused"
      ? PAUSE_ITEMS
      : x === "matchover"
        ? MATCHOVER_ITEMS
        : x === "howto"
          ? ["BACK TO MENU"]
          : [];
const rect = (screen: Screen, i: number): Rect | null =>
  i < 0 || i >= items(screen).length
    ? null
    : { x: 440, y: (screen === "title" ? 350 : 430) + i * 62, w: 400, h: 48 };
const needBall = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw Error("Carom: no ball on the field");
  return s.ball;
};
const paddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [side]: p } }) as CaromState;
const integrate = (
  p: DeepReadonly<PaddleState>,
  v: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + v * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + v * dt ? (cy - p.cy) / dt : v,
  };
};
const start = (s: DeepReadonly<CaromState>, mode = s.mode): CaromState =>
  ({
    ...s,
    mode,
    screen: "countdown",
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: ball(),
    paddles: {
      left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
    },
  }) as CaromState;
const home = (s: DeepReadonly<CaromState>) =>
  base(s.muted, s.titleIndex, s.simTime);
function movers(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  const human = (side: Side) => {
    const solo = s.mode === "solo";
    const up =
        api.input.value(side === "left" || solo ? "p1-up" : "p2-up") +
        (solo ? api.input.value("p2-up") : 0),
      down =
        api.input.value(side === "left" || solo ? "p1-down" : "p2-down") +
        (solo ? api.input.value("p2-down") : 0);
    return (down - up) * PADDLE_SPEED;
  };
  const one = (side: Side) => {
    const p = s.paddles[side];
    if (p.driven) return integrate(p, p.drivenVy, dt);
    if (side === "left" || s.mode === "versus")
      return integrate(p, human(side), dt);
    if (!s.ai.movement) return { ...p, vy: 0 };
    const defense =
        s.screen === "playing" && s.ai.tracking && s.ball && s.ball.vx > 0,
      target = defense ? s.ball!.y - s.ball!.vy * AI_REACT : AI_HOME_Y,
      diff = target - p.cy,
      dz = defense ? AI_DEADZONE : AI_HOME_DEADZONE;
    return integrate(
      p,
      Math.abs(diff) <= dz || dt <= 0
        ? 0
        : Math.sign(diff) * Math.min(AI_SPEED, Math.abs(diff) / dt),
      dt,
    );
  };
  return {
    ...s,
    paddles: { left: one("left"), right: one("right") },
  } as CaromState;
}
type Face = "left" | "right" | "top" | "bottom";
function hit(
  b: BallState,
  r: { x0: number; x1: number; y0: number; y1: number },
): { b: BallState; f: Face } | null {
  if (!(
    b.x > r.x0 - BALL_R &&
    b.x < r.x1 + BALL_R &&
    b.y > r.y0 - BALL_R &&
    b.y < r.y1 + BALL_R
  ))
    return null;
  const d: [Face, number][] = [
    ["left", b.x - r.x0 + BALL_R],
    ["right", r.x1 + BALL_R - b.x],
    ["top", b.y - r.y0 + BALL_R],
    ["bottom", r.y1 + BALL_R - b.y],
  ];
  const f = d.reduce((a, z) => (z[1] < a[1] ? z : a))[0];
  let { x, y, vx, vy } = b;
  if (f === "left") {
    x = r.x0 - BALL_R;
    if (vx > 0) vx = -vx;
  } else if (f === "right") {
    x = r.x1 + BALL_R;
    if (vx < 0) vx = -vx;
  } else if (f === "top") {
    y = r.y0 - BALL_R;
    if (vy > 0) vy = -vy;
  } else {
    y = r.y1 + BALL_R;
    if (vy < 0) vy = -vy;
  }
  return { b: { ...b, x, y, vx, vy }, f };
}
function physics(
  s: DeepReadonly<CaromState>,
  dt: number,
  sound: (x: string) => void,
): CaromState {
  if (!s.ball) return s as CaromState;
  let b: BallState = { ...s.ball, trail: [...s.ball.trail] };
  const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP)),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const sp = Math.hypot(b.vx, b.vy);
    if (sp) {
      const a = (b.spin / sp) * h,
        c = Math.cos(a),
        q = Math.sin(a);
      b = { ...b, vx: b.vx * c - b.vy * q, vy: b.vx * q + b.vy * c };
    }
    b = {
      ...b,
      spin: b.spin * Math.pow(0.5, h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      sound(CUES.wallBounce);
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      sound(CUES.wallBounce);
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        r =
          side === "left"
            ? {
                x0: P1_X0,
                x1: P1_X1,
                y0: p.cy - PADDLE_HALF,
                y1: p.cy + PADDLE_HALF,
              }
            : {
                x0: P2FACE,
                x1: 1232,
                y0: p.cy - PADDLE_HALF,
                y1: p.cy + PADDLE_HALF,
              },
        z = hit(b, r);
      if (z) {
        b = z.b;
        if (z.f === "left" || z.f === "right") {
          const theta =
              clamp((b.y - p.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE,
            v = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP),
            dir = side === "left" ? 1 : -1;
          b = {
            ...b,
            x: side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R,
            vx: dir * v * Math.cos(theta),
            vy: v * Math.sin(theta),
            spin: clamp(
              b.spin + p.vy * SPIN_FROM_PADDLE,
              -SPIN_CLAMP,
              SPIN_CLAMP,
            ),
          };
          sound(CUES.paddleHit);
        } else sound(CUES.wallBounce);
      }
    }
    for (const o of s.obstacles) {
      const z = hit(b, OBSTACLES[o.index]);
      if (z) {
        b = z.b;
        sound(CUES.obstacleBounce);
      }
    }
  }
  const trail = [...b.trail, { x: b.x, y: b.y, t: s.simTime + dt }].filter(
    (x) => x.t >= s.simTime + dt - TRAIL_TIME,
  );
  if (b.x - BALL_R > FIELD_W || b.x + BALL_R < 0) {
    const winner: Side = b.x > FIELD_W ? "left" : "right";
    const score = {
      p1: s.score.p1 + (winner === "left" ? 1 : 0),
      p2: s.score.p2 + (winner === "right" ? 1 : 0),
    };
    sound(CUES.score);
    if (
      (score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD) ||
      (score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD)
    )
      return {
        ...s,
        score,
        winner,
        screen: "matchover",
        menuIndex: 0,
        ball: b,
      } as CaromState;
    return {
      ...s,
      score,
      receiver: winner === "left" ? "right" : "left",
      screen: "countdown",
      ball: ball(),
    } as CaromState;
  }
  return { ...s, ball: { ...b, trail } } as CaromState;
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    if (s.menuIndex === 0) return start({ ...s, titleIndex: 0 }, "solo");
    if (s.menuIndex === 1) return start({ ...s, titleIndex: 1 }, "versus");
    return { ...s, titleIndex: 2, screen: "howto", menuIndex: 0 } as CaromState;
  }
  if (s.screen === "howto") return home(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? ({ ...s, screen: s.resumeScreen } as CaromState)
      : s.menuIndex === 1
        ? start(s)
        : home(s);
  if (s.screen === "matchover") return s.menuIndex === 0 ? start(s) : home(s);
  return s as CaromState;
}
function menus(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  const its = items(s.screen);
  let n = s as CaromState;
  if (!its.length) return n;
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
    down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
  if (up) n = { ...n, menuIndex: (n.menuIndex + its.length - 1) % its.length };
  else if (down) n = { ...n, menuIndex: (n.menuIndex + 1) % its.length };
  let hover: number | null = null;
  const p = api.input.pointer();
  for (let i = 0; i < its.length; i++) {
    const r = rect(s.screen, i)!;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)
      hover = i;
  }
  if (hover !== null) n = { ...n, menuIndex: hover };
  return api.input.pressed("confirm") ||
    (hover !== null &&
      api.input.pointerPressed() &&
      api.input.pointerReleased())
    ? confirm(n)
    : n;
}
const debug: CaromDebugApi = {
  version: CAROM_DEBUG_VERSION,
  clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
  spawnBall: (s) => ({ ...s, ball: ball() }),
  spawnObstacle: (s, i) => ({
    ...s,
    obstacles: [...s.obstacles.filter((o) => o.index !== i), obs(i)].sort(
      (a, b) => a.index - b.index,
    ),
  }),
  reset: (s) => base(s.muted),
  reconcile: (s) => ({ ...s }),
  setScreen: (s, v) => ({ ...s, screen: v }),
  setMode: (s, v) => ({ ...s, mode: v }),
  setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
  setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
  setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
  setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
  setWinner: (s, v) => ({ ...s, winner: v }),
  setReceiver: (s, v) => ({ ...s, receiver: v }),
  setPaddleCy: (s, side, v) => paddle(s, side, { ...s.paddles[side], cy: v }),
  setPaddleVy: (s, side, v) =>
    paddle(s, side, { ...s.paddles[side], drivenVy: v }),
  setPaddleDriven: (s, side, v) =>
    paddle(s, side, { ...s.paddles[side], driven: v }),
  setBallPosition: (s, x, y) => ({ ...s, ball: { ...needBall(s), x, y } }),
  setBallVelocity: (s, x, y) => ({
    ...s,
    ball: { ...needBall(s), vx: x, vy: y },
  }),
  setBallSpin: (s, v) => ({ ...s, ball: { ...needBall(s), spin: v } }),
  setBallHeld: (s, v) => ({ ...s, ball: { ...needBall(s), held: v } }),
  setBallHoldTimer: (s, v) => ({
    ...s,
    ball: { ...needBall(s), holdTimer: v },
  }),
  setBallServeSign: (s, v) => ({
    ...s,
    ball: { ...needBall(s), serveSign: v },
  }),
  drawBallServeSign: (s) => ({
    ...s,
    ball: { ...needBall(s), serveSign: rnd() },
  }),
  setAiTracking: (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } }),
  setAiMovement: (s, v) => ({ ...s, ai: { ...s.ai, movement: v } }),
  setMuted: (s, v) => ({ ...s, muted: v }),
  snapshot: (s) => ({
    ...s,
    version: CAROM_DEBUG_VERSION,
    ball: s.ball
      ? {
          ...s.ball,
          speed: Math.hypot(s.ball.vx, s.ball.vy),
          trail: [...s.ball.trail],
        }
      : null,
  }),
  menuItemRect: (s, i) => rect(s.screen, i),
};
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    ACTIONS.forEach((a) => api.input.register(a, { keys: [...BINDINGS[a]] }));
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 520,
      freqTo: 720,
      gain: 0.12,
      durationMs: 45,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "triangle",
      freq: 240,
      freqTo: 180,
      gain: 0.12,
      durationMs: 55,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "sawtooth",
      freq: 320,
      freqTo: 420,
      gain: 0.1,
      durationMs: 55,
    });
    api.audio.define(CUES.score, {
      wave: "sine",
      freq: 440,
      freqTo: 880,
      gain: 0.18,
      durationMs: 180,
    });
    const diag = (
      name: string,
      fn: (s: DeepReadonly<CaromState>) => string | number,
    ) => api.diagnostics.register(name, fn);
    diag("screen", (s) => s.screen);
    diag("mode", (s) => s.mode);
    diag("p1", (s) => s.score.p1);
    diag("p2", (s) => s.score.p2);
    diag("ball position", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    diag("ball velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    diag("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : "none",
    );
    diag("ball spin", (s) => (s.ball ? s.ball.spin : "none"));
    diag(
      "left paddle",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} / ${s.paddles.left.vy.toFixed(1)}`,
    );
    diag(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} / ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [base(false), debug];
  },
  update(state, api, dt) {
    let s: CaromState = {
      ...state,
      simTime: state.simTime + dt,
      muted: api.audio.muted(),
    } as CaromState;
    if (api.input.pressed("mute")) {
      api.audio.setMuted(!api.audio.muted());
      s = { ...s, muted: api.audio.muted() };
    }
    const began = state.screen;
    if (began === "countdown" || began === "playing") {
      if (api.input.pressed("pause"))
        return { ...s, resumeScreen: began, screen: "paused", menuIndex: 0 };
    } else if (began === "paused") {
      if (api.input.pressed("pause") || api.input.pressed("back"))
        return { ...s, screen: s.resumeScreen };
    } else if (
      began === "howto" &&
      (api.input.pressed("confirm") || api.input.pressed("back"))
    )
      return home(s);
    else if (began === "matchover" && api.input.pressed("back")) return home(s);
    else if (
      began === "title" ||
      began === "howto" ||
      began === "matchover" ||
      began === "paused"
    )
      return menus(s, api);
    if (s.screen !== "countdown" && s.screen !== "playing") return s;
    s = movers(s, api, dt);
    if (!s.ball) return s;
    if (s.screen === "countdown") {
      const timer = s.ball.holdTimer - dt;
      if (timer <= 0) {
        const dir = s.receiver === "left" ? -1 : 1,
          b = s.ball;
        return {
          ...s,
          screen: "playing",
          ball: {
            ...b,
            held: false,
            holdTimer: 0,
            vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
            vy: b.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
            trail: [],
          },
        };
      }
      return {
        ...s,
        ball: {
          ...s.ball,
          holdTimer: timer,
          trail: [
            ...s.ball.trail,
            { x: s.ball.x, y: s.ball.y, t: s.simTime },
          ].filter((x) => x.t >= s.simTime - TRAIL_TIME),
        },
      };
    }
    return physics(s, dt, (x) => api.audio.play(x));
  },
  render(s, api) {
    const c = api.ctx,
      glow = (x: string, b = 14) => {
        c.fillStyle = x;
        c.shadowColor = x;
        c.shadowBlur = b;
      };
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    c.strokeStyle = "#31506b";
    c.lineWidth = 2;
    c.setLineDash([12, 14]);
    c.beginPath();
    c.moveTo(FIELD_CX, 25);
    c.lineTo(FIELD_CX, FIELD_H - 25);
    c.stroke();
    c.setLineDash([]);
    for (const o of s.obstacles) {
      glow("#f6b84a", 18);
      c.beginPath();
      c.roundRect(o.cx - 10, o.cy - 70, 20, 140, 10);
      c.fill();
    }
    for (const [side, color, x] of [
      ["left", "#41d8ff", P1_X0],
      ["right", "#fb5b9d", P2_X0],
    ] as const) {
      glow(color, 22);
      c.beginPath();
      c.roundRect(x, s.paddles[side].cy - PADDLE_HALF, 16, 110, 8);
      c.fill();
    }
    if (s.ball) {
      for (let i = 1; i < s.ball.trail.length; i++) {
        c.strokeStyle = `rgba(215,245,255,${(i / s.ball.trail.length) * 0.55})`;
        c.lineWidth = 3 + (i / s.ball.trail.length) * 7;
        c.beginPath();
        c.moveTo(s.ball.trail[i - 1].x, s.ball.trail[i - 1].y);
        c.lineTo(s.ball.trail[i].x, s.ball.trail[i].y);
        c.stroke();
      }
      glow("#f5fbff", 26);
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      c.fill();
    }
    c.shadowBlur = 0;
    c.textAlign = "center";
    c.fillStyle = "#d8e8f5";
    if (["playing", "countdown", "paused", "matchover"].includes(s.screen)) {
      c.font = "700 44px system-ui";
      c.fillText(String(s.score.p1), 500, 70);
      c.fillText(String(s.score.p2), 780, 70);
      c.font = "600 14px system-ui";
      c.fillStyle = "#83a7c4";
      c.fillText(
        s.mode === "solo" ? "SOLO // FIRST TO 11" : "VERSUS // FIRST TO 11",
        FIELD_CX,
        70,
      );
    }
    const panel = (title: string, sub?: string) => {
      c.fillStyle = "rgba(5,15,28,.88)";
      c.fillRect(310, 170, 660, 410);
      c.strokeStyle = "#335d78";
      c.strokeRect(310, 170, 660, 410);
      c.fillStyle = "#eaf6ff";
      c.font = "800 64px system-ui";
      c.fillText(title, FIELD_CX, 270);
      if (sub) {
        c.font = "500 18px system-ui";
        c.fillStyle = "#93b3c8";
        c.fillText(sub, FIELD_CX, 310);
      }
    };
    if (s.screen === "title") panel(TITLE_TEXT, "A SPIN-DRIVEN PADDLE DUEL");
    else if (s.screen === "howto") {
      panel("HOW TO PLAY");
      c.font = "500 18px system-ui";
      c.fillStyle = "#bdd5e7";
      [
        "W / S moves cyan. Arrow keys move pink in Versus.",
        "Move through a hit to bend the ball with spin.",
        "Bank shots around the gold pylons. First to 11, win by 2.",
      ].forEach((x, i) => c.fillText(x, FIELD_CX, 335 + i * 34));
    } else if (s.screen === "paused") panel("PAUSED", "TAKE A BREATH");
    else if (s.screen === "matchover")
      panel(
        s.winner === "left" ? "CYAN WINS" : "PINK WINS",
        `${s.score.p1} — ${s.score.p2}`,
      );
    else if (s.screen === "countdown") {
      c.fillStyle = "#eaf6ff";
      c.font = "700 24px system-ui";
      c.fillText("READY", FIELD_CX, 130);
    }
    items(s.screen).forEach((x, i) => {
      const r = rect(s.screen, i)!,
        on = i === s.menuIndex;
      c.fillStyle = on ? "#41d8ff" : "#8eabc0";
      c.font = on ? "800 24px system-ui" : "600 21px system-ui";
      c.fillText(x, FIELD_CX, r.y + 32);
      if (on) {
        c.strokeStyle = "#41d8ff";
        c.lineWidth = 2;
        c.strokeRect(r.x, r.y, r.w, r.h);
      }
    });
    c.shadowBlur = 0;
  },
};
