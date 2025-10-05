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
  prefix: 'sn-log-record',
  label: 'Log record JSON',
  description: 'Log current ctx.record as formatted JSON',
  locales: {
    'zh-CN': {
      label: '打印记录 JSON',
      description: '将 ctx.record 以 JSON 格式输出到控制台',
    },
  },
  content: `
console.log(ctx.t('Current record JSON:'), JSON.stringify(ctx.record ?? {}, null, 2));
ctx.message.success(ctx.t('Printed to console'));
`,
};
export default snippet;
