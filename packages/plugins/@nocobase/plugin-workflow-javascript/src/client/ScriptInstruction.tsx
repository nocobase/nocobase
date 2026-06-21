/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import V2ScriptInstruction from '../client-v2/nodes/script';
import { SchemaInitializerItemType } from '@nocobase/client';
import { ValueBlock } from '@nocobase/plugin-workflow/client';

import { lang } from '../locale';

export default class extends V2ScriptInstruction {
  constructor() {
    super();
    this.bindTranslate(lang);
  }

  useInitializers(node: { id: string | number; title?: string }): SchemaInitializerItemType {
    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Script result'),
    };
  }
}
