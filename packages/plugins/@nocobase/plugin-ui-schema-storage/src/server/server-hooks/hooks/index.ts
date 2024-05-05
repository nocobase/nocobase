/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
