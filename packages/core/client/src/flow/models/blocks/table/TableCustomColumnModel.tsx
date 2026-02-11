/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, FlowModel, ModelRenderMode } from '@nocobase/flow-engine';
import { Divider } from 'antd';
import React from 'react';
import { CustomWidth } from './TableColumnModel';
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
        const title = ctx.t(params.title, { ns: 'lm-flow-engine' });
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
        ctx.model.setProps('tooltip', ctx.t(params.tooltip, { ns: 'lm-flow-engine' }));
      },
    },
    width: {
      title: tExpr('Column width'),
      uiMode(ctx) {
        const columnWidth = ctx.model.props.width;
        return {
          type: 'select',
          key: 'width',
          props: {
            options: [
              { label: 50, value: 50 },
              { label: 100, value: 100 },
              { label: 150, value: 150 },
              { label: 200, value: 200 },
              { label: 250, value: 250 },
              { label: 300, value: 300 },
              { label: 350, value: 350 },
              { label: 400, value: 400 },
              { label: 450, value: 450 },
              { label: 500, value: 500 },
            ],
            dropdownRender: (menu, setOpen, handleChange) => {
              return (
                <>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <CustomWidth
                    setOpen={setOpen}
                    handleChange={handleChange}
                    t={ctx.t}
                    defaultValue={
                      [50, 100, 150, 200, 250, 300, 350, 400, 450, 500].includes(columnWidth) ? null : columnWidth
                    }
                  />
                </>
              );
            },
          },
        };
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
