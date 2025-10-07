/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-html',
  label: 'Render HTML template',
  description: 'Render a simple HTML layout into the block element',
  locales: {
    'zh-CN': {
      label: '渲染 HTML 模板',
      description: '在区块中渲染简单的 HTML 布局',
    },
  },
  content:
    `
// Render a basic HTML template inside the block container
ctx.element.innerHTML = ` +
    '`' +
    `
  <section style="padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h2 style="margin: 0 0 12px;">\${ctx.t('Welcome title')}</h2>
    <p style="margin: 0; color: #555;">\${ctx.t('Describe your block content here.')}</p>
  </section>
` +
    '`' +
    `;
`,
};

export default snippet;
