/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSCollectionActionRunJSContext } from '../../../contexts/JSCollectionActionRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSCollectionActionRunJSContext],
  prefix: 'sn-act-export',
  label: 'Export selected rows as JSON',
  description: 'Download selected rows as a JSON file',
  locales: {
    'zh-CN': {
      label: '导出选中行为 JSON',
      description: '将选中的行导出为 JSON 文件下载',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select at least one row'));
  return;
}

// Create JSON file and download
const jsonStr = JSON.stringify(rows, null, 2);
const blob = new Blob([jsonStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = \`export-\${new Date().toISOString().split('T')[0]}.json\`;
link.click();
URL.revokeObjectURL(url);

ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
`,
};

export default snippet;
