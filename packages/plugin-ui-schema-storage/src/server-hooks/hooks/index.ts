import { hookFactory } from './factory';
import { removeSchema } from './remove-schema';
import { bindMenuToRole } from './bind-menu-to-row';
import { removeParentsIfNoChildren } from './remove-parents-if-no-children';

const hooks = [
  hookFactory('onCollectionDestroy', 'removeSchema', removeSchema),
  hookFactory('onCollectionFieldDestroy', 'removeSchema', removeSchema),
  hookFactory('onSelfCreate', 'bindMenuToRole', bindMenuToRole),
  hookFactory('onSelfMove', 'removeParentsIfNoChildren', removeParentsIfNoChildren),
];

export { hooks };
