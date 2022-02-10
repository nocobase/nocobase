import { hookFactory } from './factory';
import { removeSchema } from './remove-schema';
import { bindMenuToRole } from './bind-menu-to-row';

const hooks = [
  hookFactory('onCollectionDestroy', 'removeSchema', removeSchema),
  hookFactory('onCollectionFieldDestroy', 'removeSchema', removeSchema),
  hookFactory('onSelfCreate', 'bindMenuToRole', bindMenuToRole),
];

export { hooks };
