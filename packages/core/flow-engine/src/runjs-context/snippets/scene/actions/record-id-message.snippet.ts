/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSRecordActionRunJSContext'],
  prefix: 'sn-act-record-id',
  label: 'Show record id',
  content: `
if (!ctx.record) {
  ctx.message.error(ctx.t('Record not found'));
} else {
  ctx.message.success(ctx.t('Record ID: {{id}}', { id: ctx.filterByTk ?? ctx.record?.id }));
}
`,
};
