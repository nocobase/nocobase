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
  prefix: 'sn-jsb-click',
  label: 'Add click listener',
  description: 'Render a button and bind a click event handler',
  locales: {
    'zh-CN': {
      label: '添加点击监听',
      description: '渲染按钮并绑定点击事件处理',
    },
  },
  content: `
// Render a button and bind a click handler
const button = document.createElement('button');
button.textContent = ctx.t('Click me');
button.style.padding = '6px 12px';
button.addEventListener('click', () => ctx.message.success(ctx.t('Clicked!')));

const wrapper = document.createElement('div');
wrapper.style.padding = '12px';
wrapper.appendChild(button);

ctx.render(wrapper);
`,
};

export default snippet;
