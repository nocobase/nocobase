/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSFieldRunJSContext } from '../../../contexts/JSFieldRunJSContext';
import { FormJSFieldItemRunJSContext } from '../../../contexts/FormJSFieldItemRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSFieldRunJSContext, FormJSFieldItemRunJSContext],
  prefix: 'sn-jsf-currency',
  label: 'Format number as currency',
  description: 'Display number with currency symbol and formatting',
  locales: {
    'zh-CN': {
      label: '货币格式化',
      description: '将数字格式化为带货币符号的形式',
    },
  },
  content: `
const amount = Number(ctx.value ?? 0);

if (!Number.isFinite(amount)) {
  ctx.element.innerHTML = '-';
  return;
}

// Format as currency (USD by default)
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount);

// Add color based on positive/negative
const color = amount >= 0 ? '#52c41a' : '#f5222d';

ctx.element.innerHTML = \`
  <span style="color: \${color}; font-weight: 500;">
    \${formatted}
  </span>
\`;
`,
};

export default snippet;
