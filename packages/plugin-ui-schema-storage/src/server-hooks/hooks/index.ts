import { hookFactory } from './factory';
import { removeSchema } from './removeSchema';

const hooks = [
  hookFactory('onCollectionDestroy', 'removeSchema', removeSchema),
  hookFactory('onCollectionFieldDestroy', 'removeSchema', removeSchema),
];

export { hooks };
