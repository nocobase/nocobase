/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, FlowModel, ModelRenderMode } from '@nocobase/flow-engine';

export class TableCustomColumnModel extends FlowModel {
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;
}

TableCustomColumnModel.registerFlow({
  key: 'tableColumnSettings',
  title: tExpr('Table column settings'),
  steps: {
    title: {
      title: tExpr('Column title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tExpr('Column title'),
          },
        },
      },
      defaultParams: (ctx) => {
        return {
          title:
            ctx.model.title ||
            ctx.model.constructor['meta']?.title ||
            ctx.model.flowEngine.findModelClass((_, ModelClass) => {
              return ModelClass === ctx.model.constructor;
            })?.[0],
        };
      },
      handler(ctx, params) {
        const title = ctx.engine.translate(params.title);
        ctx.model.setProps('title', title);
      },
    },
    tooltip: {
      title: tExpr('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    width: {
      title: tExpr('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 150,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    fixed: {
      title: tExpr('Fixed'),
      use: 'fixed',
    },
  },
});

TableCustomColumnModel.define({
  hide: true,
  label: tExpr('Other columns'),
});
