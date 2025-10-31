/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSItemRunJSContext extends FlowRunJSContext {}

JSItemRunJSContext.define({
  label: 'JSItem RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container for form item rendering.
      Supports innerHTML, append, and other DOM manipulation methods.`,
    resource: `Current resource instance (read-only).
      Provides access to the data resource associated with the current form context.`,
    record: `Current record data object (read-only).
      Contains all field values of the parent record.`,
  },
  methods: {
    onRefReady: `Wait for form item container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void`,
  },
});

JSItemRunJSContext.define(
  {
    label: 'JS 表单项 RunJS 上下文',
    properties: {
      element: 'ElementProxy，表单项渲染容器，支持 innerHTML/append 等 DOM 操作',
      resource: '当前资源（只读）',
      record: '当前记录（只读）',
    },
    methods: {
      onRefReady: '容器就绪后执行回调。参数：(ref, callback, timeout?)',
    },
  },
  { locale: 'zh-CN' },
);
