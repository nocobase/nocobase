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
  prefix: 'sn-jsb-button',
  label: 'Render button handler',
  description: 'Render a button and handle click events inside the block',
  locales: {
    'zh-CN': {
      label: '按钮事件处理',
      description: '在区块中渲染按钮并绑定点击处理逻辑',
    },
  },
  content: `
const { Button } = ctx.libs.antd;

ctx.render(
  <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
    {ctx.t('Button')}
  </Button>
);
`,
};

export default snippet;
