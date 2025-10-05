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
  prefix: 'sn-try',
  label: 'Try/catch template',
  description: 'Async try/catch template with toast message',
  locales: {
    'zh-CN': {
      label: '异步 try/catch 模板',
      description: '带消息提示的异步 try/catch 模板',
    },
  },
  content: `
try {
  // await some async work
} catch (e) {
  ctx.message.error(ctx.t('Operation failed: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};

export default snippet;
