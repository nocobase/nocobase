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
  prefix: 'sn-sleep',
  label: '等待模板',
  content: `
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ms = 500;
await sleep(ms);
ctx.message.success(ctx.t('Waited {{ms}} ms', { ms }));
`,
};
