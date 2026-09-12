/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SchemaInitializerItemType } from '@nocobase/client';
import { ValueBlock } from '@nocobase/plugin-workflow/client';
import AggregateInstructionV2 from '../client-v2/AggregateInstruction';
import { useLang } from '../locale';

export default class AggregateInstruction extends AggregateInstructionV2 {
  useInitializers(node): SchemaInitializerItemType | null {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const resultTitle = useLang('Query result');
    if (!node.config.collection) {
      return null;
    }

    return {
      name: `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle,
    };
  }
}
