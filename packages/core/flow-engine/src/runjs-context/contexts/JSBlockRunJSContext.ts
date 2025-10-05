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
  label: 'JSBlock RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container.
      Supports innerHTML, append, and other DOM manipulation methods.
      Use this to render content in the JS block.`,
    record: `Current record data object (read-only).
      Available when the JS block is within a data block or detail view context.`,
    value: 'Current value of the field or component, if available in the current context.',
  },
  methods: {
    onRefReady: `Wait for container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = "Ready!" })`,
  },
});

JSBlockRunJSContext.define(
  {
    label: 'JS 区块 RunJS 上下文',
    properties: {
      element: 'ElementProxy，安全的 DOM 容器，支持 innerHTML/append 等',
      record: '当前记录（只读，用于数据区块/详情等场景）',
      value: '当前值（若存在）',
      React: 'React（已注入）',
      antd: 'Ant Design（已注入）',
    },
    methods: {
      onRefReady: '容器 ref 就绪回调：\n```js\nctx.onRefReady(ctx.ref, el => { /* ... */ })\n```',
      requireAsync: '加载外部库：`const lib = await ctx.requireAsync(url)`',
    },
  },
  { locale: 'zh-CN' },
);
