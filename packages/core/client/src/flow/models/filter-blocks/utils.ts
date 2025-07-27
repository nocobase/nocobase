/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { FilterBlockModel } from '../base/BlockModel';
import { BlockGridModel } from '../base/GridModel';
import { CreateFormModel } from '../data-blocks/form';

export function getAllDataModels(gridModel: BlockGridModel): FlowModel[] {
  const gridRows = gridModel.props.rows as Record<string, string[][]>;

  return Object.values(gridRows)
    .flat(2)
    .map((uid) => {
      return gridModel.flowEngine.getModel(uid);
    })
    .filter(
      (model): model is FlowModel =>
        model !== null && !(model instanceof FilterBlockModel) && !(model instanceof CreateFormModel),
    );
}
