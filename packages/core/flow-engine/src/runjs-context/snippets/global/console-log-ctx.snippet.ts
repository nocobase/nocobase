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
  prefix: 'sn-log-ctx',
  label: 'Log ctx',
  description: 'Log the whole ctx object to console',
  locales: {
    'zh-CN': {
      label: '打印 ctx',
      description: '将整个 ctx 对象输出到控制台',
    },
  },
  content: `
console.log('ctx =>', ctx);
ctx.message?.success?.(ctx.t('ctx printed'));
`,
};

export default snippet;
