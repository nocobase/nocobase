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
  prefix: 'sn-try',
  label: 'try/catch 模板',
  content: `
try {
  // await some async work
} catch (e) {
  ctx.message.error(ctx.t('Operation failed: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};
