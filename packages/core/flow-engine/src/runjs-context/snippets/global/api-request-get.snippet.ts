/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['*'],
  prefix: 'sn-api-get',
  label: 'GET request template',
  description: 'Basic template to send a GET request via ctx.api',
  content: `
const res = await ctx.api.request({ url: '/your/api', method: 'get', params: { page: 1 } });
ctx.message.success(ctx.t('GET request completed'));
console.log(ctx.t('GET result:'), res);
`,
};
