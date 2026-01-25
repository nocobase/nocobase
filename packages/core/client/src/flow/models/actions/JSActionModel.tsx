/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSafeDocument, createSafeWindow, createSafeNavigator, tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { CodeEditor } from '../../components/code-editor';
import { ActionModel } from '../base';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';

export class JSActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'default',
    title: tExpr('JS action'),
    icon: 'JavaScriptOutlined',
  };
}

JSActionModel.define({
  label: tExpr('JS action'),
  sort: 9999,
  createModelOptions: {
    use: 'JSActionModel',
  },
});

JSActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: tExpr('Click settings'),
  steps: {
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: {
        code: {
          type: 'string',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams(ctx) {
        return {
          version: 'v1',
          code: `
ctx.message.info('Hello JS action.');
`,
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        const navigator = createSafeNavigator();
        await ctx.runjs(
          code,
          { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
          { version },
        );
      },
    },
  },
});
