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
  prefix: 'sn-require',
  label: 'Load external library',
  description: 'Dynamically load an external JS via RequireJS',
  content: `
// Load an external library (AMD/RequireJS)
try {
  const lib = await ctx.requireAsync('https://cdn.example.com/lib@1.0.0/index.js');
  console.log('lib loaded:', lib);
} catch (e) {
  ctx.message.error(ctx.t('Failed to load external library: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};
