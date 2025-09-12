/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormJSActionModel extends FilterFormActionModel {}

FilterFormJSActionModel.define({
  label: 'JS action',
});

FilterFormJSActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: 'Click settings',
  steps: {
    runJs: {
      title: 'Run JavaScript',
      uiSchema: {
        code: {
          type: 'string',
          title: 'Write JavaScript',
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '400px',
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
          version: '1.0.0',
          code: '',
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params;
        // 创建安全的 window 和 document
        const safeWindow = new Proxy(
          {},
          {
            get(target, prop: string) {
              const allowedGlobals = {
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval,
                console,
                // fetch,
                Math,
                Date,
                // 其他需要的全局对象或方法
              };
              if (prop in allowedGlobals) {
                return allowedGlobals[prop];
              }
              throw new Error(`Access to global property "${prop}" is not allowed.`);
            },
          },
        );

        const safeDocument = new Proxy(
          {},
          {
            get(target, prop: string) {
              const allowedDocumentMethods = {
                createElement: document.createElement.bind(document),
                querySelector: document.querySelector.bind(document),
                querySelectorAll: document.querySelectorAll.bind(document),
                // 其他需要的 document 方法
              };
              if (prop in allowedDocumentMethods) {
                return allowedDocumentMethods[prop];
              }
              throw new Error(`Access to document property "${prop}" is not allowed.`);
            },
          },
        );

        await ctx.runjs(code, { window: safeWindow, document: safeDocument });
      },
    },
  },
});
