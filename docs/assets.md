# Asset pipeline

## Runtime assets

Browser-ready files live under `public/assets/` and are served from `/assets/` without the `public` prefix.

```text
public/assets/models/asteria/asteria.glb
                         -> /assets/models/asteria/asteria.glb
```

GLB is the preferred runtime model format. Embed textures when practical so a model arrives as one self-contained file. Runtime code normalizes each asset to an explicitly configured artistic size; the model's source units are never treated as astronomical or educational measurements.

The project convention is:

- Y is up.
- A forward-facing vehicle points toward -Z.
- Model origins are normalized to the center of their complete bounds at load time.
- Per-asset size and orientation corrections live in `src/content/assets.ts`, not as unexplained transforms in scene code.

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

- File: `public/assets/models/asteria/asteria.glb`
- GLTF version: 2.0
- Geometry: one mesh, 8,726 uploaded vertices
- Texture: one embedded 1024×1024 PNG base-color texture
- Animations: none
- Raw bounds: approximately 0.42 × 0.39 × 1.00 source units
- Runtime target size: 5.5 artistic game units

The embedded texture is preserved. The export omits metallic and roughness factors, which invokes glTF's fully metallic default and made the hull nearly black without an environment map. Runtime configuration supplies restrained PBR values for readable space lighting. A procedural ship remains available if loading fails.

## Solar System models

The current delivery includes Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Pluto is represented and labeled as a dwarf planet. The Sun and Moon retain lightweight procedural proxies until dedicated assets arrive.

High-resolution planet textures can expand substantially in GPU memory—Earth and Jupiter each decode to roughly 67 MB per large texture. Detailed GLBs therefore load progressively when Asteria approaches a world. Sphere proxies preserve navigation and interaction while a model is unavailable or still loading.
