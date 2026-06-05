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
  prefix: 'sn-act-iterate',
  label: 'Iterate selected rows',
  description: 'Loop through selected rows and process each record',
  locales: {
    'zh-CN': {
      label: '遍历选中行',
      description: '遍历选中行并处理每条记录',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(ctx.t('Selected row:'), row);
}
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
`,
};

export default snippet;
