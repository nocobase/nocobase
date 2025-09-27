/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSafeDocument, createSafeWindow, escapeT } from '@nocobase/flow-engine';
import { CodeEditor } from '../../../components/code-editor';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormJSActionModel extends FilterFormActionModel {}

FilterFormJSActionModel.define({
  label: escapeT('JS action'),
  sort: 9999,
});

FilterFormJSActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: escapeT('Click settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '400px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: 'embed',
      defaultParams(ctx) {
        return {
          version: '1.0.0',
          code: '',
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params;
        await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
      },
    },
  },
});
