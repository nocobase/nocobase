/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * JS Form Action：表单工具栏按钮点击执行 JS。
 */
import { escapeT, createSafeWindow, createSafeDocument } from '@nocobase/flow-engine';
import { FormActionModel } from './FormActionModel';

export class JSFormActionModel extends FormActionModel {}

JSFormActionModel.define({
  label: escapeT('JavaScript action'),
  sort: 9999,
});

JSFormActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: escapeT('Click settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          title: escapeT('Write JavaScript'),
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        return {
          code: `/** 表单 JS Action 示例 **/
const values = ctx.form?.getFieldsValue?.() || {};
ctx.message.success('当前表单值：' + JSON.stringify(values));
`,
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params || {};
        ctx.defineMethod('refresh', async () => {
          if (ctx.blockModel?.resource?.refresh) {
            await ctx.blockModel.resource.refresh();
          } else if (ctx.resource?.refresh) {
            await ctx.resource.refresh();
          }
        });
        await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
      },
    },
  },
});
