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
  prefix: 'sn-act-destroy-selected',
  label: 'Destroy selected rows',
  description: 'Delete selected rows via resource.destroySelectedRows()',
  locales: {
    'zh-CN': {
      label: '删除选中行',
      description: '通过 resource.destroySelectedRows() 删除选中行',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select data'));
  return;
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted {{count}} rows', { count: rows.length }));
`,
};

export default snippet;
