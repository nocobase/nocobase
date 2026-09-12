/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, FlowModel, FlowModelContext, ModelRenderMode } from '@nocobase/flow-engine';
import _ from 'lodash';

export class FilterFormCustomItemModel extends FlowModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  static defineChildren(ctx: FlowModelContext) {
    const commonModels = ctx.engine.filterModelClassByParent('CommonItemModel');
    // 统一按真实父类名过滤（原为 'FormCustomModel'，导致无法收集子类）
    const formCustomModels = ctx.engine.filterModelClassByParent('FilterFormCustomItemModel');

    const toChildren = (models: Map<string, any>) =>
      Array.from(models.entries()).map(([name, ModelClass]) => {
        const item: any = {
          key: name,
          label: ctx.t(ModelClass.meta.label),
          sort: (ModelClass.meta.sort ?? 999) as number,
          searchable: !!ModelClass.meta?.searchable,
          searchPlaceholder: ModelClass.meta?.searchPlaceholder,
        };
        // 叶子项：点击直接创建实例
        item.createModelOptions = { use: name };
        return item;
      });

    return _.sortBy([...toChildren(commonModels), ...toChildren(formCustomModels)], 'sort');
  }
}

FilterFormCustomItemModel.define({
  hide: true,
  label: tExpr('Others'),
});
