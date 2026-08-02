# Planet collision — design spec

## Goal

The ship can currently fly straight through a celestial body's surface — proximity only
ever triggers dialogue, never blocks movement. Add simple physical solidity so planets
(and other celestial bodies) stop the ship at their surface.

## Approach

Sphere-vs-sphere resolve, checked once per frame in `ExplorationScene.update()`, no
physics engine:

- Ship gets a `collisionRadius` constant (~1.5, matching the hull's rough size).
- Each `CelestialBodyDefinition` already has `displayRadius` (the body's rendered size,
  never physical scale per existing convention) — reused directly as its collision
  radius. No new content field needed.
- Per body, per frame: if `distanceTo(ship, body) < collisionRadius(ship) +
  displayRadius(body)`, push the ship's position back out to exactly that combined
  distance along the body→ship vector, and zero the component of the ship's velocity
  pointing into the surface (dot product with the surface normal, clamped). The ship can
  still slide along the surface or thrust directly away.
- `interactionRange` (used for the existing `F`/`C` dialogue trigger) is unaffected and
  stays separate — it's larger than `displayRadius` for every current body, so proximity
  dialogue keeps triggering before the ship physically touches the surface.

## Testing

Collision resolution is pure vector math independent of Three.js rendering or input —
extract it into a small pure function (e.g. `resolveSphereCollision(shipPosition,
shipVelocity, shipRadius, bodyPosition, bodyRadius)` returning the corrected position and
velocity) so it can be unit tested directly: penetrating head-on stops at the surface
with zero inward velocity, grazing/tangential approach is undisturbed, no interpenetration
at various angles.
