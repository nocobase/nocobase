/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSBlockRunJSContext extends FlowRunJSContext {}

JSBlockRunJSContext.define({
  label: 'RunJS context',
  properties: {
    element: {
      description: `ElementProxy instance providing a safe DOM container.
      Supports innerHTML, append, and other DOM manipulation methods.
      Use this to render content in the JS block.`,
      detail: 'ElementProxy',
      properties: {
        innerHTML: 'Set or read the HTML content of the container element.',
      },
    },
    record: `Current record data object (read-only).
      Available when the JS block is within a data block or detail view context.`,
    value: 'Current value of the field or component, if available in the current context.',
    React: 'React library',
    antd: 'Ant Design library',
  },
  methods: {
    onRefReady: `Wait for container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = "Ready!" })`,
    requireAsync: 'Load external library: `const lib = await ctx.requireAsync(url)`',
    importAsync:
      'Dynamically import an ESM module by URL: `const mod = await ctx.importAsync(url)`.\n' +
      'Note: if the module has only a default export, ctx.importAsync returns that default value directly (no `.default`).',
  },
});

JSBlockRunJSContext.define(
  {
    label: 'RunJS 上下文',
    properties: {
      element: {
        description: 'ElementProxy，安全的 DOM 容器，支持 innerHTML/append 等',
        detail: 'ElementProxy',
        properties: {
          innerHTML: '读取或设置容器的 HTML 内容',
        },
      },
      record: '当前记录（只读，用于数据区块/详情等场景）',
      value: '当前值（若存在）',
      React: 'React 库',
      antd: 'Ant Design 库',
    },
    methods: {
      onRefReady: '容器 ref 就绪回调：\n```js\nctx.onRefReady(ctx.ref, el => { /* ... */ })\n```',
      requireAsync: '加载外部库：`const lib = await ctx.requireAsync(url)`',
      importAsync:
        '按 URL 动态导入 ESM 模块：`const mod = await ctx.importAsync(url)`。\n' +
        '注意：当模块只有 default 一个导出时，ctx.importAsync 会直接返回 default 值（无需再写 `.default`）。',
    },
  },
  { locale: 'zh-CN' },
);
