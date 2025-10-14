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
    importAsync: 'Dynamically import ESM module: `const mod = await ctx.importAsync(url)`',
    embedBlock:
      `Replace current JS block with an Embed block that targets an existing model uid.\n\n` +
      'Signature: `await ctx.embedBlock(targetUid: string)`\n\n' +
      'Note: After calling this function, subsequent script code will NOT execute.',
    copyBlock:
      `Clone an existing block (with all sub-models), remap UIDs, and replace current JS block with the cloned block.\n\n` +
      'Signature: `await ctx.copyBlock(sourceUid: string)`\n\n' +
      'Note: After calling this function, subsequent script code will NOT execute.',
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
      importAsync: '按 URL 动态导入 ESM 模块：`const mod = await ctx.importAsync(url)`',
      embedBlock:
        '将当前 JS 区块原位替换为 Embed 区块，并指向已有模型 uid。\n\n' +
        '签名：`await ctx.embedBlock(targetUid: string)`\n\n' +
        '注意：调用后，后续脚本将不会继续执行。',
      copyBlock:
        '克隆指定 uid 的区块（含子模型），并将当前 JS 区块原位替换为克隆结果。\n\n' +
        '签名：`await ctx.copyBlock(sourceUid: string)`\n\n' +
        '注意：调用后，后续脚本将不会继续执行。',
    },
  },
  { locale: 'zh-CN' },
);
