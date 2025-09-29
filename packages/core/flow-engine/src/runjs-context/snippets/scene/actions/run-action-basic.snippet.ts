/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSRecordActionRunJSContext', 'JSCollectionActionRunJSContext'],
  prefix: 'sn-act-run',
  label: 'Run action',
  content: `
await ctx.runAction('someAction', { foo: 'bar' });
ctx.message.success(ctx.t('Action executed'));
`,
};
