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
  prefix: 'sn-act-del-confirm',
  label: 'Batch delete with confirmation',
  description: 'Delete selected rows after user confirmation',
  locales: {
    'zh-CN': {
      label: '批量删除（带确认）',
      description: '批量删除选中行，删除前弹窗确认',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select at least one row'));
  return;
}

// Show confirmation dialog
ctx.modal.confirm({
  title: ctx.t('Confirm deletion'),
  content: ctx.t('Are you sure you want to delete {{count}} records? This action cannot be undone.', {
    count: rows.length,
  }),
  onOk: async () => {
    try {
      await Promise.all(
        rows.map((row) =>
          ctx.api.request({
            url: \`\${ctx.resource.collectionName}:destroy\`,
            method: 'post',
            params: { filterByTk: row.id },
          })
        )
      );
      ctx.message.success(ctx.t('Successfully deleted {{count}} records', { count: rows.length }));
      await ctx.resource?.refresh?.();
    } catch (e) {
      ctx.message.error(ctx.t('Delete failed: {{msg}}', { msg: String(e?.message || e) }));
    }
  },
});
`,
};

export default snippet;
