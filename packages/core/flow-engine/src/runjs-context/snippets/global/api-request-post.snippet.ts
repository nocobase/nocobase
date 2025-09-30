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
  prefix: 'sn-api-post',
  label: 'POST request template',
  description: 'Basic template to send a POST request via ctx.api',
  content: `
const res = await ctx.api.request({ url: '/your/api', method: 'post', data: { name: 'NocoBase' } });
ctx.message.success(ctx.t('POST request completed'));
console.log(ctx.t('POST result:'), res);
`,
};
