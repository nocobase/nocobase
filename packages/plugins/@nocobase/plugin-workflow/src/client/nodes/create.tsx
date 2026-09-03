/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType } from '@nocobase/client';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import V2CreateInstruction from '../../client-v2/nodes/create';

export default class extends V2CreateInstruction {
  useInitializers(node): SchemaInitializerItemType | null {
    if (!node.config.collection) {
      return null;
    }

    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: CollectionBlockInitializer,
      collection: node.config.collection,
      dataPath: `$jobsMapByNodeKey.${node.key}`,
    };
  }
}
