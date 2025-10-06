/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['JSColumnRunJSContext'],
  prefix: 'sn-col-open-dialog',
  label: 'Cell dialog with row data',
  description: 'Render a button in cell to open dialog showing current row JSON',
  locales: {
    'zh-CN': {
      label: '单元格对话框（显示行数据）',
      description: '在单元格渲染按钮，点击后弹出对话框展示当前行 JSON',
    },
  },
  content: `
// 在单元格渲染一个按钮
ctx.element.innerHTML = '<button class="nb-cell-btn" style="padding:4px 8px">' + ctx.t('View') + '</button>';
ctx.element.querySelector('.nb-cell-btn')?.addEventListener('click', () => {
  ctx.viewer.dialog({
    title: ctx.t('Row detail'),
    content: '<pre style="padding:12px;white-space:pre-wrap">' +
      JSON.stringify(ctx.record ?? {}, null, 2) + '</pre>',
  });
});
`,
};

export default snippet;
