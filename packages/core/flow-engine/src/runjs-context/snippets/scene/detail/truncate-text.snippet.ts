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
  prefix: 'sn-jsf-truncate',
  label: 'Truncate long text with tooltip',
  description: 'Display truncated text with "..." and show full text on hover',
  locales: {
    'zh-CN': {
      label: '截断长文本（带提示）',
      description: '显示截断的文本，鼠标悬停显示完整内容',
    },
  },
  content: `
const text = String(ctx.value || '');
const maxLength = 50; // Maximum characters to display

if (text.length <= maxLength) {
  ctx.element.innerHTML = text;
  return;
}

const truncated = text.slice(0, maxLength) + '...';

ctx.element.innerHTML = \`
  <span
    title="\${text.replace(/"/g, '&quot;')}"
    style="
      cursor: help;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    "
  >
    \${truncated}
  </span>
\`;
`,
};

export default snippet;
