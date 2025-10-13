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
  prefix: 'sn-jsb-react',
  label: 'Render React',
  description: 'Render a React element inside the block container',
  locales: {
    'zh-CN': {
      label: '渲染 React',
      description: '在区块容器中渲染 React 组件',
    },
  },
  content: `
// Render a React element into ctx.element via ReactDOM
const { React, ReactDOM, antd } = ctx;
const { Button } = antd;

const node = React.createElement(
  'div',
  { style: { padding: 12 } },
  React.createElement(Button, { type: 'primary', onClick: () => ctx.message.success(ctx.t('Clicked!')) }, ctx.t('Click')),
);
ReactDOM.createRoot(ctx.element).render(node);
`,
};

export default snippet;
