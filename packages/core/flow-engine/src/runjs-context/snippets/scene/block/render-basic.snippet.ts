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
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-jsb-html',
  label: 'Render HTML',
  description: 'Render simple HTML into the block container',
  locales: {
    'zh-CN': {
      label: '渲染 HTML',
      description: '在区块容器中渲染简单 HTML 内容',
    },
  },
  content:
    `
ctx.element.innerHTML = ` +
    '`' +
    `
  <div style="padding:12px">\${ctx.t('Hello JSBlock')}</div>
` +
    '`' +
    `;
`,
};

export default snippet;
