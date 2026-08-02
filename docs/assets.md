# Asset pipeline

## Runtime assets

Browser-ready files live under `public/assets/` and are served from `/assets/` without the `public` prefix.

```text
public/assets/assets_glb/ch0_prop_ship.glb
                         -> /assets/assets_glb/ch0_prop_ship.glb
```

GLB is the preferred runtime model format. Embed textures when practical so a model arrives as one self-contained file. Runtime code normalizes each asset to an explicitly configured artistic size; the model's source units are never treated as astronomical or educational measurements.

The project convention is:

- Y is up.
- A forward-facing vehicle points toward -Z.
- Vehicle and floating-model origins are normalized to the center of their complete bounds. Grounded props can opt into a bottom-center anchor.
- Per-asset size and orientation corrections live in content manifests, not as unexplained transforms in scene code.

## Editable sources

Editable originals such as Blender files live under `assets/source/`, outside the browser's public directory. Runtime exports and editable sources should not overwrite one another.

## Git LFS

GLB and Blender files are tracked with Git LFS through `.gitattributes`. After cloning, install Git LFS before checking out binary assets:

```bash
git lfs install
git lfs pull
```

Git applies the LFS filter when a matching file is staged. Existing files that were committed as normal Git blobs before a rule was added require an explicit migration; untracked files do not.

## Provenance

Every third-party delivery should carry a nearby `SOURCE.md` or manifest entry recording:

- original download page;
- creator or agency;
- license or usage terms;
- material modifications;
- download date;
- whether logos, people, or third-party elements require separate review.

NASA-hosted does not automatically mean unrestricted in every case. Record the exact source page and its credit line for each planet or spacecraft asset before publishing.

## Current Asteria model

The current player vessel is `public/assets/assets_glb/ch0_prop_ship.glb`: one textured GLB mesh with 6,647 uploaded vertices, no animation, raw bounds of approximately 0.55 × 0.41 × 1.00 source units, and a runtime target size of 7 artistic game units. The embedded texture is preserved. Runtime configuration supplies restrained PBR values for readable space lighting, and a procedural ship remains available if loading fails.

The older `public/assets/models/asteria/asteria.glb` export remains in the repository as source history but is no longer selected at runtime.

## Story-world props

All 50 delivered Chapter 1–6 GLBs are mapped in `src/content/world-props.ts`. The filename prefixes drive their initial role and placement:

- Chapter 1 modular and material assets form a fictional exposed engineering corridor in near-Earth space.
- Chapter 2 plants, samples, and laboratory equipment form a fictional orbital ecosystem test array near Mars.
- Chapter 3 artifacts form a remote archive installation beyond Saturn.
- Chapter 4 characters appear as temporary holographic story-presence models at related encounter sites.
- Chapter 5 stations and satellites occupy near-Earth space; asteroids and comets occupy progressively more distant regions.
- Chapter 6 navigation consoles attach to the engineering corridor.

Nearby props load before they are readily visible. Distant clusters stream when the ship comes within 700 artistic units; unlike celestial fallbacks, unloaded props have no placeholder geometry, so they never appear as generic spheres.

### Solid flight geometry

Celestial bodies use swept spherical collision hulls based on their rendered radius. Authored GLB props become solid as soon as their visual loads: the loader-derived local bounds follow each prop's position, rotation, bobbing, or orbit. Asteria also has a hull radius, and collision checks sweep from its previous to current position so boost-speed movement cannot tunnel through small assets. An impact moves the ship back outside the surface and removes inward velocity while leaving the flight orientation under player control.

### Orbital relationships

Space-native props carry explicit orbital definitions instead of merely being placed near a world:

- The ISS asset follows a circular path around Earth inclined 51.6 degrees, matching NASA's documented ISS orbital inclination.
- The three generic satellite assets use distinct fictional Earth-orbit planes so they do not overlap.
- Asteroids follow low-eccentricity heliocentric paths in the game's compressed belt region.
- Comets follow larger, inclined, high-eccentricity ellipses with the Sun at one focus. Their motion solves Kepler's equation so they move more quickly near perihelion.

Rendered orbital radii and elapsed time remain artistic gameplay values, not physical distances or real-time periods. The ISS inclination reference is [NASA's International Space Station overview](https://www.nasa.gov/reference/international-space-station/).

## Solar System models

The current delivery includes the Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Pluto is represented and labeled as a dwarf planet. The Moon retains a lightweight procedural proxy until a dedicated asset arrives.

High-resolution celestial textures can expand substantially in GPU memory—Earth and Jupiter each decode to roughly 67 MB per large texture. Authored GLBs begin loading at scene startup. Their sphere proxies remain hidden during loading and appear only if a model fails; the Moon retains its intentional procedural representation.
