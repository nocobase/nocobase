/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['JSFieldRunJSContext', 'FormJSFieldItemRunJSContext'],
  prefix: 'sn-jsf-num',
  label: 'Format number',
  description: 'Format numeric value with locale-aware separators',
  locales: {
    'zh-CN': {
      label: '格式化数字',
      description: '按本地化格式输出数值',
    },
  },
  content: `
// Format number using locale
const n = Number(ctx.value ?? 0);
ctx.element.innerHTML = String(Number.isFinite(n) ? n.toLocaleString() : ctx.value ?? '');
`,
};

export default snippet;
