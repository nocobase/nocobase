/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType } from '@nocobase/client';
import { ValueBlock } from '../components/ValueBlock';
import { SubModelItem } from '@nocobase/flow-engine';
import V2CalculationInstruction from '../../client-v2/nodes/calculation';
import { lang } from '../locale';

export default class extends V2CalculationInstruction {
  useInitializers(node): SchemaInitializerItemType {
    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Calculation result'),
    };
  }

  getCreateModelMenuItem({ node }): SubModelItem {
    const item = super.getCreateModelMenuItem({ node });

    if (item?.createModelOptions?.stepParams?.valueSettings?.init) {
      item.createModelOptions.stepParams.valueSettings.init.defaultValue = lang('Calculation result');
    }

    return item;
  }
}
