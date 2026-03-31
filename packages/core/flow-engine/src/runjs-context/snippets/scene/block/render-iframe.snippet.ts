/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-iframe',
  label: 'Render iframe',
  description: 'Embed example.com as a sandboxed iframe inside the block element',
  locales: {
    'zh-CN': {
      label: '渲染 iframe',
      description: '在区块中以 sandbox 限制嵌入 example.com 页面',
    },
  },
  content: `
// Create an iframe that fills the current block container
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Render the iframe as the only content
ctx.render(iframe);
`,
};

export default snippet;
