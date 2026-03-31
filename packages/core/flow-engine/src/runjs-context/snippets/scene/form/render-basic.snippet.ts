/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSItemRunJSContext } from '../../../contexts/JSItemRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSItemRunJSContext],
  prefix: 'sn-jsitem-basic',
  label: 'Render form item',
  description: 'Render custom content inside a form item container',
  locales: {
    'zh-CN': {
      label: '渲染表单项',
      description: '在表单项容器中渲染自定义内容',
    },
  },
  content: `
ctx.render(\`
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
    <h3 style="color: #1890ff; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">\${ctx.t('JS Item')}</h3>
    <div style="color:#555">\${ctx.t('This area is rendered by your JavaScript code.')}</div>
  </div>
\`);
`,
};

export default snippet;
