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
  prefix: 'sn-api-get',
  label: 'GET request template',
  description: 'Basic template to send a GET request via ctx.api',
  locales: {
    'zh-CN': {
      label: 'GET 请求模板',
      description: '使用 ctx.api 发送 GET 请求的基础模板',
    },
  },
  content: `
const res = await ctx.api.request({ url: '/your/api', method: 'get', params: { page: 1 } });
ctx.message.success(ctx.t('GET request completed'));
console.log(ctx.t('GET result:'), res);
`,
};

export default snippet;
