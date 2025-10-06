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
  prefix: 'sn-jsx-mount',
  label: 'JSX mount',
  description: 'Render JSX via ReactDOM.createRoot in the block',
  locales: {
    'zh-CN': {
      label: 'JSX 挂载',
      description: '在区块中使用 ReactDOM.createRoot 渲染 JSX',
    },
  },
  content: `
// Render JSX (editor does not auto-transform)
const { ReactDOM, antd } = ctx;
const { Button } = antd;

if (ctx.__reactRoot?.unmount) { try { ctx.__reactRoot.unmount(); } catch(_) {} ctx.__reactRoot = undefined; }
const root = ReactDOM.createRoot(ctx.element);
root.render(<Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>{ctx.t('Button')}</Button>);
ctx.__reactRoot = root;
`,
};

export default snippet;
