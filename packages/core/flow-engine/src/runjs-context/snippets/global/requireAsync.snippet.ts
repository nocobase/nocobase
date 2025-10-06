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
  prefix: 'sn-require',
  label: 'Load external library',
  description: 'Dynamically load an external JS via RequireJS',
  locales: {
    'zh-CN': {
      label: '加载外部库',
      description: '通过 RequireJS 动态加载外部脚本',
    },
  },
  content: `
// Load an external library (AMD/RequireJS)
try {
  const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
  console.log('dayjs loaded:', dayjs?.default || dayjs);
} catch (e) {
  ctx.message.error(ctx.t('Failed to load external library: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};

export default snippet;
