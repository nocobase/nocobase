/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

/**
 * RunJS context for JSColumnModel (table custom column).
 * Focused on per-row rendering with access to current record and cell element.
 */
export class JSColumnRunJSContext extends FlowRunJSContext {}

JSColumnRunJSContext.define({
  label: 'JSColumn RunJS context',
  properties: {
    element:
      'ElementProxy instance providing a safe DOM container for the current table cell. Supports innerHTML/append and basic DOM APIs.',
    record: 'Current row record object (read-only).',
    recordIndex: 'Index of the current row in the page (0-based).',
    collection: 'Collection definition metadata (read-only).',
    viewer:
      'View controller providing dialog/drawer/embed helpers for interactions initiated from the cell (e.g., open details).',
    React: 'React library',
    antd: 'Ant Design library',
  },
  methods: {
    onRefReady:
      'Wait for cell DOM element to be ready before executing callback. Parameters: (ref, callback, timeout?) => void',
    requireAsync: 'Load external library by URL: `const lib = await ctx.requireAsync(url)`',
    importAsync: 'Dynamically import ESM module by URL: `const mod = await ctx.importAsync(url)`',
  },
});

JSColumnRunJSContext.define(
  {
    label: 'JS 列 RunJS 上下文',
    properties: {
      element: 'ElementProxy，表格单元格的安全 DOM 容器，支持 innerHTML/append 等',
      record: '当前行记录对象（只读）',
      recordIndex: '当前行索引（从 0 开始）',
      collection: '集合定义元数据（只读）',
      viewer: '视图控制器，可用于在单元格中触发抽屉/对话框/内嵌等交互',
      React: 'React 库',
      antd: 'Ant Design 库',
    },
    methods: {
      onRefReady: '等待单元格 DOM 就绪后执行回调。参数：(ref, callback, timeout?)',
      requireAsync: '按 URL 异步加载外部库：`const lib = await ctx.requireAsync(url)`',
      importAsync: '按 URL 动态导入 ESM 模块：`const mod = await ctx.importAsync(url)`',
    },
  },
  { locale: 'zh-CN' },
);
