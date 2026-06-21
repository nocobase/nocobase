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

export class FormCustomItemModel extends FlowModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  static defineChildren(ctx: FlowModelContext) {
    const commonModels = ctx.engine.filterModelClassByParent('CommonItemModel');
    // 统一按真实父类名过滤（原为 'FormCustomModel'，导致无法收集子类）
    const formCustomModels = ctx.engine.filterModelClassByParent('FormCustomItemModel');

    const toChildren = (models: Map<string, any>) =>
      Array.from(models.entries()).map(([name, ModelClass]) => {
        const hasChildren = typeof ModelClass.defineChildren === 'function' || !!ModelClass.meta?.children;
        const item: any = {
          key: name,
          label: ctx.t(ModelClass.meta.label),
          sort: (ModelClass.meta.sort ?? 999) as number,
          searchable: !!ModelClass.meta?.searchable,
          searchPlaceholder: ModelClass.meta?.searchPlaceholder,
          hide: ModelClass.meta?.hide,
        };
        if (hasChildren) {
          // 子模型自身定义了 children，作为"子菜单入口"使用；点击展开二级菜单
          item.children = (innerCtx: FlowModelContext) => {
            if (typeof ModelClass.defineChildren === 'function') {
              return ModelClass.defineChildren(innerCtx);
            }
            return ModelClass.meta?.children || [];
          };
        } else {
          // 叶子项：点击直接创建实例
          item.createModelOptions = ModelClass.meta?.createModelOptions || { use: name };
        }
        return item;
      });

    return _.sortBy([...toChildren(commonModels), ...toChildren(formCustomModels)], 'sort');
  }
}

FormCustomItemModel.define({
  hide: true,
  label: tExpr('Others'),
});
