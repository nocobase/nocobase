/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-card',
  label: 'Render card',
  description: 'Render a styled card layout inside the block',
  locales: {
    'zh-CN': {
      label: '渲染卡片',
      description: '在区块中渲染带样式的卡片布局',
    },
  },
  content:
    `
ctx.element.innerHTML = ` +
    '`' +
    `
  <div style="border:1px solid #ddd;border-radius:8px;padding:16px;">
    <h3 style="margin:0 0 8px;">\${ctx.t('Title')}</h3>
    <div>\${ctx.t('Card content')}</div>
  </div>
` +
    '`' +
    `;
`,
};
export default snippet;
