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
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-jsx-unmount',
  label: 'JSX unmount',
  description: 'Unmount previously mounted React content from the block',
  locales: {
    'zh-CN': {
      label: 'JSX 卸载',
      description: '卸载区块中已渲染的 React 内容',
    },
  },
  content: `
if (ctx.__reactRoot?.unmount) { try { ctx.__reactRoot.unmount(); } catch(_) {} }
ctx.__reactRoot = undefined;
ctx.element.innerHTML = '';
`,
};

export default snippet;
