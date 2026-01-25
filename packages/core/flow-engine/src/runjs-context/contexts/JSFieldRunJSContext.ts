/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSFieldRunJSContext extends FlowRunJSContext {}

JSFieldRunJSContext.define({
  label: 'JSField RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container for field rendering.
      Supports innerHTML, append, and other DOM manipulation methods.`,
    value: `Current value of the field (read-only).
      Contains the data value stored in this field.`,
    record: `Current record data object (read-only).
      Contains all field values of the parent record.`,
    collection: `Collection definition metadata (read-only).
      Provides schema information about the collection this field belongs to.`,
  },
  methods: {
    onRefReady: `Wait for field container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = ctx.value })`,
  },
});

JSFieldRunJSContext.define(
  {
    label: 'JS 字段 RunJS 上下文',
    properties: {
      element: 'ElementProxy，字段渲染容器，支持 innerHTML/append 等 DOM 操作',
      value: '字段当前值（只读）',
      record: '当前记录对象（只读，包含父记录全部字段值）',
      collection: '集合定义元数据（只读，描述字段所属集合的 Schema）',
    },
    methods: {
      onRefReady:
        '在字段容器 DOM 就绪后执行回调。参数：(ref, callback, timeout?)；示例：ctx.onRefReady(ctx.ref, el => { el.innerHTML = ctx.value })',
    },
  },
  { locale: 'zh-CN' },
);
