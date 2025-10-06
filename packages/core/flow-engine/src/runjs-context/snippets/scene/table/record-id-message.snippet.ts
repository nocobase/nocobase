/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['JSRecordActionRunJSContext'],
  prefix: 'sn-act-record-id',
  label: 'Show record id',
  description: 'Display current record primary key in a toast',
  locales: {
    'zh-CN': {
      label: '显示记录 ID',
      description: '通过消息提示展示当前记录主键',
    },
  },
  content: `
if (!ctx.record) {
  ctx.message.error(ctx.t('Record not found'));
} else {
  ctx.message.success(ctx.t('Record ID: {{id}}', { id: ctx.filterByTk ?? ctx.record?.id }));
}
`,
};

export default snippet;
