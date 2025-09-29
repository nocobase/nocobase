/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';
const snippet: SnippetModule = {
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-jsb-card',
  label: 'Render card',
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
