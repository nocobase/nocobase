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
  prefix: 'sn-jsf-value',
  label: 'Display text field as highlighted text',
  description: 'Render the current text field value with simple highlight styling',
  locales: {
    'zh-CN': {
      label: '将文本字段显示为高亮文本',
      description: '将字段值写入容器并添加高亮样式',
    },
  },
  content: `
const v = String(ctx.value ?? '');
ctx.render(\`<span class="nb-js-field-value" style="color:#1890ff;font-weight:600">\${v}</span>\`);
`,
};

export default snippet;
