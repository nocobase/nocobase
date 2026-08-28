/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType } from '@nocobase/client';
import { ValueBlock } from '@nocobase/plugin-workflow/client';
import type { SubModelItem } from '@nocobase/flow-engine';
import V2DateCalculationInstruction from '../client-v2/nodes/dateCalculation';
import { lang } from '../locale';

export default class extends V2DateCalculationInstruction {
  useInitializers(node): SchemaInitializerItemType {
    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Date calculation result'),
    };
  }

  getCreateModelMenuItem({ node }): SubModelItem {
    const item = super.getCreateModelMenuItem({ node });
    const createModelOptions = item?.createModelOptions;

    if (typeof createModelOptions !== 'function' && createModelOptions?.stepParams?.valueSettings?.init) {
      createModelOptions.stepParams.valueSettings.init.defaultValue = lang('Date calculation result');
    }

    return item;
  }
}
