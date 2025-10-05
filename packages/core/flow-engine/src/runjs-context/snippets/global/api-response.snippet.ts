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
  contexts: ['*'],
  prefix: 'sn-api-display',
  label: 'API response display',
  description: 'Fetch data and render the JSON result inside ctx.element',
  locales: {
    'zh-CN': {
      label: 'API 响应展示',
      description: '请求数据并将 JSON 结果渲染到 ctx.element 中',
    },
  },
  content:
    `
const response = await ctx.api.request({
  url: '/users',
  method: 'get',
  params: { page: 1, pageSize: 10 },
});

ctx.element.innerHTML = ` +
    '`' +
    `
  <pre style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
    \${JSON.stringify(response?.data ?? {}, null, 2)}
  </pre>
` +
    '`' +
    `;
`,
};

export default snippet;
