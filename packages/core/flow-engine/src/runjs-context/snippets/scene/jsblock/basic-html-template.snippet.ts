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
  prefix: 'sn-jsb-basic-html',
  label: 'Basic HTML template',
  description: 'Render a simple HTML structure into the block element',
  locales: {
    'zh-CN': {
      label: '基础 HTML 模板',
      description: '在区块容器中渲染简单的 HTML 结构',
    },
  },
  content:
    `
ctx.element.innerHTML = ` +
    '`' +
    `
  <div style="padding: 20px;">
    <h2>\${ctx.t('Hello World')}</h2>
    <p>\${ctx.t('This is a basic HTML template.')}</p>
  </div>
` +
    '`' +
    `;
`,
};

export default snippet;
