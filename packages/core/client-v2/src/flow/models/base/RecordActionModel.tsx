/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildSubModelItems, DefaultStructure } from '@nocobase/flow-engine';
import { ActionModel, ActionSceneEnum } from './ActionModel';

export class RecordActionModel<T extends DefaultStructure = DefaultStructure> extends ActionModel<T> {}

RecordActionModel.define({
  children: async (ctx) => {
    const children = await buildSubModelItems(ActionModel)(ctx);
    return children.filter((item) => {
      const M = ctx.engine.getModelClass(item.useModel) as typeof ActionModel;
      return M._isScene(ActionSceneEnum.record);
    });
  },
});
