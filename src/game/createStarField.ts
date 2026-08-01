import {
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
} from 'three';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

export function createStarField(count = 4_500): Points {
  const random = seededRandom(0xb4a4a4d);
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius = 650 + random() * 2_700;
    const azimuth = random() * Math.PI * 2;
    const cosine = random() * 2 - 1;
    const sine = Math.sqrt(1 - cosine * cosine);

    positions[index * 3] = radius * sine * Math.cos(azimuth);
    positions[index * 3 + 1] = radius * cosine;
    positions[index * 3 + 2] = radius * sine * Math.sin(azimuth);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      color: 0xcce8ff,
      size: 1.35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    }),
  );
}
