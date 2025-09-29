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
  prefix: 'sn-copy-record',
  label: 'Copy record JSON',
  description: 'Copy current ctx.record JSON to clipboard',
  content: `
await ctx.copyToClipboard(JSON.stringify(ctx.record ?? {}, null, 2));
ctx.message.success(ctx.t('Record JSON copied to clipboard'));
`,
};
export default snippet;
