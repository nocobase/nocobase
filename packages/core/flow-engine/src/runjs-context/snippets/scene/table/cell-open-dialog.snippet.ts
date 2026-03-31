/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSColumnRunJSContext } from '../../../contexts/JSColumnRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSColumnRunJSContext],
  prefix: 'sn-col-open-dialog',
  label: 'Cell dialog with row data',
  description: 'Render a button in cell to open dialog via ctx.openView with current row context',
  locales: {
    'zh-CN': {
      label: '单元格对话框（显示行数据）',
      description: '在单元格渲染按钮，点击后通过 ctx.openView 打开弹窗并传入当前行上下文',
    },
  },
  content: `
// Render a button inside the cell
const button = document.createElement('button');
button.className = 'nb-cell-btn';
button.style.padding = '4px 8px';
button.textContent = ctx.t('View');
const popupUid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
const primaryKey = ctx.collection?.primaryKey || 'id';

button?.addEventListener('click', async () => {
  await ctx.openView(popupUid, {
    mode: 'dialog',
    title: ctx.t('Row detail'),
    params: {
      filterByTk: ctx.record?.[primaryKey],
      record: ctx.record,
    },
  });
});

ctx.render(button);
`,
};

export default snippet;
