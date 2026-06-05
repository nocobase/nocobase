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
  prefix: 'sn-act-selected-count',
  label: 'Selected count',
  description: 'Show number of selected rows in list action',
  locales: {
    'zh-CN': {
      label: '选中数量',
      description: '提示当前选中行的数量',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select data'));
} else {
  ctx.message.success(ctx.t('Selected {{count}} rows', { count: rows.length }));
}
`,
};

export default snippet;
