import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { modelAssets } from '../src/content/assets';
import { worldProps } from '../src/content/world-props';

describe('world prop manifest', () => {
  it('uses the Chapter 0 ship as the player vessel', () => {
    expect(modelAssets.asteria.url).toBe(
      '/assets/assets_glb/ch0_prop_ship.glb',
    );
  });

  it('places every delivered chapter prop exactly once', () => {
    const delivered = readdirSync(
      resolve(process.cwd(), 'public/assets/assets_glb'),
    )
      .filter((filename) => /^ch[1-6]_.*\.glb$/.test(filename))
      .sort();
    const placed = worldProps
      .map((definition) => definition.model.url.split('/').at(-1) ?? '')
      .sort();

    expect(placed).toEqual(delivered);
  });

  it('keeps IDs and primary placements unique', () => {
    const ids = new Set(worldProps.map((definition) => definition.id));
    const positions = new Set(
      worldProps.map((definition) => definition.displayPosition.join(',')),
    );

    expect(ids.size).toBe(worldProps.length);
    expect(positions.size).toBe(worldProps.length);
  });
});
