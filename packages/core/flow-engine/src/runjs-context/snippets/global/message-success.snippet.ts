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
  prefix: 'sn-msg',
  label: 'Message success',
  description: 'Show a success toast message',
  locales: {
    'zh-CN': {
      label: '成功消息提示',
      description: '显示一条成功提示消息',
    },
  },
  content: `
ctx.message.success(ctx.t('Operation succeeded'));
`,
};
export default snippet;
