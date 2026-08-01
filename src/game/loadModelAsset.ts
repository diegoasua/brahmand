import {
  Box3,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { ModelAssetDefinition } from '../content/assets';

const loader = new GLTFLoader();

export async function loadModelAsset(
  definition: ModelAssetDefinition,
): Promise<Group> {
  const gltf = await loader.loadAsync(definition.url);
  const model = gltf.scene;
  const initialBounds = new Box3().setFromObject(model);
  const size = initialBounds.getSize(new Vector3());
  const longestDimension = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(longestDimension) || longestDimension <= 0) {
    throw new Error(`Model at ${definition.url} has invalid bounds.`);
  }

  const wrapper = new Group();
  wrapper.name = `asset:${definition.url}`;
  model.scale.setScalar(definition.targetSize / longestDimension);
  model.rotation.set(
    MathUtils.degToRad(definition.rotation[0]),
    MathUtils.degToRad(definition.rotation[1]),
    MathUtils.degToRad(definition.rotation[2]),
  );
  model.updateMatrixWorld(true);

  const normalizedBounds = new Box3().setFromObject(model);
  const center = normalizedBounds.getCenter(new Vector3());
  model.position.sub(center);

  if (definition.material) {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      for (const material of materials) {
        if (material instanceof MeshStandardMaterial) {
          material.metalness = definition.material?.metalness ?? material.metalness;
          material.roughness = definition.material?.roughness ?? material.roughness;
          material.needsUpdate = true;
        }
      }
    });
  }

  wrapper.add(model);

  return wrapper;
}
