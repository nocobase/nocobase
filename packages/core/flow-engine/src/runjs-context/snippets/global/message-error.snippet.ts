/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';
const snippet: SnippetModule = {
  contexts: ['*'],
  prefix: 'sn-msg-error',
  label: 'Message error',
  description: 'Show an error toast message',
  locales: {
    'zh-CN': {
      label: '错误消息提示',
      description: '显示一条错误提示消息',
    },
  },
  content: `
ctx.message.error(ctx.t('Operation failed'));
`,
};
export default snippet;
