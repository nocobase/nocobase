import { bindMenuToRole } from './bind-menu-to-role';
import { hookFactory } from './factory';
import { removeParentsIfNoChildren } from './remove-parents-if-no-children';
import { removeSchema } from './remove-schema';

const hooks = [
  hookFactory('onCollectionDestroy', 'removeSchema', removeSchema),
  hookFactory('onCollectionFieldDestroy', 'removeSchema', removeSchema),
  hookFactory('onSelfCreate', 'bindMenuToRole', bindMenuToRole),
  hookFactory('onSelfMove', 'removeParentsIfNoChildren', removeParentsIfNoChildren),
];

export { hooks };
