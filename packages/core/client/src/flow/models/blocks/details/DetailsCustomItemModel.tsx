/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, FlowModel, FlowModelContext, ModelRenderMode } from '@nocobase/flow-engine';
import _ from 'lodash';

export class DetailsCustomItemModel extends FlowModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  static defineChildren(ctx: FlowModelContext) {
    const commonModels = ctx.engine.filterModelClassByParent('CommonItemModel');
    const detailCustomModels = ctx.engine.filterModelClassByParent('DetailsCustomItemModel');

    const toChildren = (models: Map<string, any>) =>
      Array.from(models.entries()).map(([name, ModelClass]) => ({
        key: name,
        label: ctx.t(ModelClass.meta.label),
        createModelOptions: { use: name },
        sort: (ModelClass.meta.sort ?? 999) as number,
      }));

    return _.sortBy([...toChildren(commonModels), ...toChildren(detailCustomModels)], 'sort');
  }
}

DetailsCustomItemModel.define({
  hide: true,
  label: escapeT('Others'),
});
