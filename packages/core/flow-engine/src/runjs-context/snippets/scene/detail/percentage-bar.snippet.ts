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
  prefix: 'sn-jsf-percent',
  label: 'Display number field as percentage bar',
  description: 'Render numeric values as a percentage progress bar',
  locales: {
    'zh-CN': {
      label: '将数字字段显示为百分比进度条',
      description: '将数字格式化为百分比并显示进度条',
    },
  },
  content: `
const value = Number(ctx.value ?? 0);

if (!Number.isFinite(value)) {
  ctx.render('-');
  return;
}

// Ensure value is between 0 and 100
const percent = Math.max(0, Math.min(100, value));

// Color based on value
const getColor = (val) => {
  if (val >= 80) return '#52c41a';
  if (val >= 50) return '#faad14';
  return '#f5222d';
};

const color = getColor(percent);

ctx.render(\`
  <div style="display: flex; align-items: center; gap: 8px;">
    <div style="flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
      <div style="
        width: \${percent}%;
        height: 100%;
        background: \${color};
        transition: width 0.3s ease;
      "></div>
    </div>
    <span style="color: \${color}; font-weight: 500; min-width: 45px; text-align: right;">
      \${percent.toFixed(1)}%
    </span>
  </div>
\`);
`,
};

export default snippet;
