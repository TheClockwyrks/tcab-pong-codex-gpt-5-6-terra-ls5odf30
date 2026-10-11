import { describe, expect, it } from "vitest";
import { game } from "./game";

function setup() {
  const input = { register: () => undefined, layout: () => null };
  const audio = { define: () => undefined };
  const diagnostics = { register: () => undefined };
  return game.initialize({
    input,
    audio,
    diagnostics,
    events: {},
    viewport: () => ({}),
  } as never) as [import("./game").CaromState, import("./game").CaromDebugApi];
}

describe("Carom debug surface", () => {
  it("creates a complete title world and can clear and restore it", () => {
    const [state, debug] = setup();
    expect(debug.snapshot(state)).toMatchObject({
      screen: "title",
      score: { p1: 0, p2: 0 },
    });
    const empty = debug.clearWorld(state);
    expect(debug.snapshot(empty)).toMatchObject({ ball: null, obstacles: [] });
    expect(debug.snapshot(debug.spawnBall(empty))).toMatchObject({
      ball: { held: true, holdTimer: 1 },
    });
  });

  it("reports velocity-derived speed and keeps debug poses immutable", () => {
    const [state, debug] = setup();
    const posed = debug.setBallVelocity(state, 300, 400);
    expect(debug.snapshot(posed)).toMatchObject({ ball: { speed: 500 } });
    expect(debug.snapshot(state)).toMatchObject({ ball: { speed: 0 } });
  });
});
