/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsCustomItemModel } from '@nocobase/client';
import { FlowModelContext, ModelRenderMode, SubModelItem, tExpr } from '@nocobase/flow-engine';
import _ from 'lodash';

export class TaskCardCommonItemModel extends DetailsCustomItemModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  static defineChildren(ctx: FlowModelContext): Promise<SubModelItem[]> | SubModelItem[] {
    const commonModels = ctx.engine.filterModelClassByParent('CommonItemModel');

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
          item.children = (innerCtx: FlowModelContext) => {
            if (typeof ModelClass.defineChildren === 'function') {
              return ModelClass.defineChildren(innerCtx);
            }
            return ModelClass.meta?.children || [];
          };
        } else {
          item.createModelOptions = ModelClass.meta?.createModelOptions || { use: name };
        }
        return item;
      });

    return _.sortBy([...toChildren(commonModels)], 'sort');
  }
}

TaskCardCommonItemModel.define({
  hide: true,
  label: tExpr('Others'),
});
