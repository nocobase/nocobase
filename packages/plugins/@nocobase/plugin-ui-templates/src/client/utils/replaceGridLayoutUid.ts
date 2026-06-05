/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { replaceUidInGridLayout, type FlowModel, type GridLayoutV2 } from '@nocobase/flow-engine';

export function replaceGridLayoutUid(parent: FlowModel, fromUid: string, toUid: string) {
  if (
    typeof (parent as any).setGridStepLayout !== 'function' ||
    typeof (parent as any).syncLayoutProps !== 'function'
  ) {
    return false;
  }

  const gridParams = parent.getStepParams('gridSettings', 'grid') || {};
  const rawLayout = _.cloneDeep(gridParams.layout ?? (parent as any).props?.layout) as GridLayoutV2 | undefined;

  if (rawLayout?.version !== 2) {
    return false;
  }

  const layout = replaceUidInGridLayout(rawLayout, fromUid, toUid);
  (parent as any).setGridStepLayout(layout);
  (parent as any).syncLayoutProps(layout);

  return true;
}
