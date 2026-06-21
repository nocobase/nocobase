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
  description: 'Create a resource via ctx.makeResource and render JSON output',
  locales: {
    'zh-CN': {
      label: '资源示例',
      description: '使用 ctx.initResource 加载数据并渲染 JSON 输出',
    },
  },
  content: `
// Create a resource and load a single record
const resource = ctx.makeResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
// Optionally set filterByTk to target a specific record:
// resource.setRequestOptions('params', { filterByTk: 1 });
await resource.refresh();

ctx.render(\`
  <pre style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
    \${JSON.stringify(resource.getData(), null, 2)}
  </pre>
\`);
`,
};

export default snippet;
