/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSCollectionActionRunJSContext'],
  prefix: 'sn-act-selected-count',
  label: '选中行计数',
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select data'));
} else {
  ctx.message.success(ctx.t('Selected {{count}} rows', { count: rows.length }));
}
`,
};
