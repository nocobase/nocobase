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
  label: '打印记录JSON',
  description: 'Log current ctx.record as formatted JSON',
  content: `
console.log(ctx.t('Current record JSON:'), JSON.stringify(ctx.record ?? {}, null, 2));
ctx.message.success(ctx.t('Printed to console'));
`,
};
export default snippet;
