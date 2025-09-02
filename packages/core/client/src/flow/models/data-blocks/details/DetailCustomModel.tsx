/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, escapeT, ModelRenderMode, FlowModelContext } from '@nocobase/flow-engine';

export class DetailCustomModel extends FlowModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  static defineChildren(ctx: FlowModelContext) {
    const commonModels = ctx.engine.filterModelClassByParent('CommonModel');
    const detailCustomModels = ctx.engine.filterModelClassByParent('DetailCustomModel');

    const toChildren = (models: Map<string, any>) =>
      Array.from(models.entries()).map(([name, ModelClass]) => ({
        label: ctx.t(ModelClass.meta.label),
        createModelOptions: { use: name },
      }));

    return [...toChildren(commonModels), ...toChildren(detailCustomModels)];
  }
}

DetailCustomModel.define({
  hide: true,
  label: escapeT('Others'),
});
