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
  prefix: 'sn-jsf-status-tag',
  label: 'Render status tag with color',
  description: 'Display value as a colored tag based on status',
  locales: {
    'zh-CN': {
      label: '状态标签（带颜色）',
      description: '根据状态值显示不同颜色的标签',
    },
  },
  content: `
const statusColors = {
  active: 'green',
  pending: 'orange',
  inactive: 'gray',
  error: 'red',
  success: 'blue',
};

const status = String(ctx.value || 'unknown');
const color = statusColors[status] || 'default';

ctx.element.innerHTML = \`
  <span style="
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    background-color: var(--\${color}-1, #f0f0f0);
    color: var(--\${color}-6, #333);
    border: 1px solid var(--\${color}-3, #d9d9d9);
  ">
    \${ctx.t(status)}
  </span>
\`;
`,
};

export default snippet;
