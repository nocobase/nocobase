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
  prefix: 'sn-act-batch-update',
  label: 'Batch update selected rows',
  description: 'Update a specific field for all selected rows',
  locales: {
    'zh-CN': {
      label: '批量更新选中行',
      description: '批量更新选中行的指定字段',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select at least one row'));
  return;
}

try {
  // Update status field to 'approved' for all selected rows
  await Promise.all(
    rows.map((row) =>
      ctx.api.request({
        url: \`\${ctx.resource.collectionName}:update\`,
        method: 'post',
        params: { filterByTk: row.id },
        data: { status: 'approved' },
      })
    )
  );

  ctx.message.success(ctx.t('Successfully updated {{count}} records', { count: rows.length }));
  // Refresh the table
  await ctx.resource?.refresh?.();
} catch (e) {
  ctx.message.error(ctx.t('Update failed: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};

export default snippet;
