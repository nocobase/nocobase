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
  prefix: 'sn-jsf-value',
  label: 'Render field value',
  description: 'Render current field value with simple styling',
  locales: {
    'zh-CN': {
      label: '渲染字段值',
      description: '将字段值写入容器并添加基础样式',
    },
  },
  content: `
const v = String(ctx.value ?? '');
ctx.element.innerHTML = \`<span class="nb-js-field-value" style="color:#1890ff;font-weight:600">\${v}</span>\`;
`,
};

export default snippet;
