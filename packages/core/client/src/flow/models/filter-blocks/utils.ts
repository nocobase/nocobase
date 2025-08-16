/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../base/BlockModel';
import { BlockGridModel } from '../base/GridModel';

export function getAllDataModels(gridModel: BlockGridModel): FlowModel[] {
  return gridModel.filterSubModels('items', (item: CollectionBlockModel) => {
    return !!item.resource?.supportsFilter;
  });
}
