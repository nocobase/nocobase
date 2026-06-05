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
  description: 'Basic template to send HTTP requests via ctx.request',
  locales: {
    'zh-CN': {
      label: 'API 请求模板',
      description: '使用 ctx.request 发送 HTTP 请求的基础模板',
    },
  },
  content: `
// Replace url/method/params/data as needed
const response = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 10,
  },
});

ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), response?.data);
`,
};

export default snippet;
