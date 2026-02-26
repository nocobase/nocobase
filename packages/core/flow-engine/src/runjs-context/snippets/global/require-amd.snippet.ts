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
  label: 'Load AMD module',
  description: 'Dynamically load an AMD/RequireJS module by URL',
  locales: {
    'zh-CN': {
      label: '加载 AMD 模块',
      description: '通过 RequireJS 按 URL 动态加载 AMD 模块',
    },
  },
  content: `
// Load an external library (AMD/RequireJS)
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log('dayjs loaded:', dayjs?.default || dayjs);
`,
};

export default snippet;
