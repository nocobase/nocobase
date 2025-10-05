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
  prefix: 'sn-api-request',
  label: 'API request template',
  description: 'Send an HTTP request via ctx.api.request',
  locales: {
    'zh-CN': {
      label: 'API 请求模板',
      description: '使用 ctx.api.request 发送 HTTP 请求的模板',
    },
  },
  content: `
const response = await ctx.api.request({
  url: '/your/api',
  method: 'get',
  params: {},
});

if (response?.data) {
  console.log(ctx.t('API response'), response.data);
}
`,
};

export default snippet;
