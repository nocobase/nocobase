/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';
import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-resource-example',
  label: 'Resource example',
  description: 'Create a resource via ctx.createResource and render JSON output',
  locales: {
    'zh-CN': {
      label: '资源示例',
      description: '使用 ctx.useResource 加载数据并渲染 JSON 输出',
    },
  },
  content:
    `
// 创建资源并加载单条记录数据
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
// 可按需设置 filterByTk 指定具体记录：
// resource.setRequestOptions('params', { filterByTk: 1 });
await resource.refresh();

ctx.element.innerHTML = ` +
    '`' +
    `
  <pre style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
    \${JSON.stringify(resource.getData(), null, 2)}
  </pre>
` +
    '`' +
    `;
`,
};

export default snippet;
