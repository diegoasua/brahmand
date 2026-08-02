# Planet Collision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the ship at a celestial body's surface instead of letting it fly through, using a pure sphere-vs-sphere collision resolve.

**Architecture:** A standalone pure function (`resolveSphereCollision`) does the vector math — no physics engine. `ExplorationScene.update()` calls it once per celestial body, per frame, right after the ship's own movement update and before the camera reads the ship's position.

**Tech Stack:** TypeScript, `three` (`Vector3`), Vitest.

## Global Constraints

- Display sizes/positions (`displayRadius`, `displayPosition`) are artistic, never physical scale — reuse `displayRadius` directly as the collision radius rather than adding a new content field.
- `interactionRange` (dialogue trigger) is unrelated to collision and must not change.
- No new dependencies.

---

### Task 1: `resolveSphereCollision` pure function

**Files:**
- Create: `src/game/collision.ts`
- Test: `tests/collision.test.ts`

**Interfaces:**
- Produces: `resolveSphereCollision(shipPosition: Vector3, shipVelocity: Vector3, shipRadius: number, bodyPosition: Vector3, bodyRadius: number): void` — mutates `shipPosition` and `shipVelocity` in place. No-op if the ship is not overlapping the body.

- [ ] **Step 1: Write the failing tests**

Create `tests/collision.test.ts`:

```ts
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { resolveSphereCollision } from '../src/game/collision';

describe('resolveSphereCollision', () => {
  it('does nothing when the ship is outside the combined radius', () => {
    const shipPosition = new Vector3(0, 0, 20);
    const shipVelocity = new Vector3(0, 0, -5);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipPosition).toEqual(new Vector3(0, 0, 20));
    expect(shipVelocity).toEqual(new Vector3(0, 0, -5));
  });

  it('stops head-on penetration exactly at the combined radius with zero inward velocity', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(0, 0, -8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(11.5, 5);
    const outwardNormal = shipPosition.clone().sub(bodyPosition).normalize();
    expect(shipVelocity.dot(outwardNormal)).toBeCloseTo(0, 5);
  });

  it('preserves the tangential velocity component while zeroing the inward one', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(3, 0, -8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipVelocity.x).toBeCloseTo(3, 5);
  });

  it('leaves outward-moving velocity untouched but still corrects an overlapping position', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(0, 0, 8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipVelocity).toEqual(new Vector3(0, 0, 8));
    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(11.5, 5);
  });

  it('resolves a diagonal approach onto the exact surface distance', () => {
    const shipPosition = new Vector3(3, 4, 0);
    const shipVelocity = new Vector3(-3, -4, 0);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1, bodyPosition, 6);

    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(7, 5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/collision.test.ts`
Expected: FAIL — `Cannot find module '../src/game/collision'` (file doesn't exist yet).

- [ ] **Step 3: Implement `resolveSphereCollision`**

Create `src/game/collision.ts`:

```ts
import { Vector3 } from 'three';

const SCRATCH_OFFSET = new Vector3();

export function resolveSphereCollision(
  shipPosition: Vector3,
  shipVelocity: Vector3,
  shipRadius: number,
  bodyPosition: Vector3,
  bodyRadius: number,
): void {
  const minDistance = shipRadius + bodyRadius;
  SCRATCH_OFFSET.subVectors(shipPosition, bodyPosition);
  const distance = SCRATCH_OFFSET.length();

  if (distance >= minDistance || distance === 0) {
    return;
  }

  const normal = SCRATCH_OFFSET.divideScalar(distance);
  shipPosition.copy(bodyPosition).addScaledVector(normal, minDistance);

  const inwardSpeed = shipVelocity.dot(normal);
  if (inwardSpeed < 0) {
    shipVelocity.addScaledVector(normal, -inwardSpeed);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/collision.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/collision.ts tests/collision.test.ts
git commit -m "$(cat <<'EOF'
Add sphere-vs-sphere collision resolve for celestial bodies

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wire collision into `ExplorationScene`

**Files:**
- Modify: `src/game/ExplorationScene.ts`

**Interfaces:**
- Consumes: `resolveSphereCollision` from Task 1 (`src/game/collision.ts`).

- [ ] **Step 1: Add the import and a ship collision radius constant**

In `src/game/ExplorationScene.ts`, add the import alongside the existing ones:

```ts
import { resolveSphereCollision } from './collision';
```

Add a class constant next to the existing `#WORLD_PROP_LOAD_DISTANCE`:

```ts
  static readonly #WORLD_PROP_LOAD_DISTANCE = 700;
  static readonly #SHIP_COLLISION_RADIUS = 1.5;
```

- [ ] **Step 2: Resolve collisions right after the ship moves, before the camera reads its position**

In `update()`, change:

```ts
  update(deltaSeconds: number): ExplorationUpdate {
    this.ship.update(deltaSeconds, this.input);
    this.camera.update(deltaSeconds, this.ship);
```

to:

```ts
  update(deltaSeconds: number): ExplorationUpdate {
    this.ship.update(deltaSeconds, this.input);

    for (const celestialObject of this.#celestialObjects) {
      resolveSphereCollision(
        this.ship.object.position,
        this.ship.velocity,
        ExplorationScene.#SHIP_COLLISION_RADIUS,
        celestialObject.object.position,
        celestialObject.definition.displayRadius,
      );
    }

    this.camera.update(deltaSeconds, this.ship);
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npm run typecheck && npx vitest run`
Expected: PASS, no type errors, no regressions.

- [ ] **Step 4: Manually verify in the browser**

Make sure the dev server is running (`npm run dev` in a separate terminal, or reuse one already running). If Playwright isn't available yet, install it once:

```bash
node -e "require.resolve('playwright')" 2>/dev/null || (npm install --no-save playwright && npx playwright install --with-deps chromium)
```

Then run this verification script:

```bash
node <<'EOF'
import('playwright').then(async ({ chromium }) => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5173/');
  await page.waitForSelector('#game-canvas');
  await page.waitForTimeout(1000);

  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(6000);
  const distanceAtImpact = await page.textContent('#distance');
  await page.waitForTimeout(2000);
  const distanceAfterHolding = await page.textContent('#distance');
  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');

  console.log('CONTACT:', await page.textContent('#target'));
  console.log('DISTANCE_AT_IMPACT:', distanceAtImpact);
  console.log('DISTANCE_AFTER_HOLDING_THRUST:', distanceAfterHolding);

  await browser.close();
});
EOF
```

Expected: `CONTACT` is `EARTH`, and `DISTANCE_AT_IMPACT` settles around `17` (Earth's `displayRadius: 16` + ship's `1.5` collision radius) and stays there in `DISTANCE_AFTER_HOLDING_THRUST` even though thrust is still held — proving the ship stopped at the surface instead of clipping through to `0`.

- [ ] **Step 5: Commit**

```bash
git add src/game/ExplorationScene.ts
git commit -m "$(cat <<'EOF'
Stop the ship at a celestial body's surface instead of clipping through

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
