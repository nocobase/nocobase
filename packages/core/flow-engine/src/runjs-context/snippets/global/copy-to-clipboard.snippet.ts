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
  prefix: 'sn-copy',
  label: 'Copy to clipboard',
  description: 'Copy a string to clipboard and show a success message',
  content: `
await ctx.copyToClipboard(ctx.t('Text to copy'));
ctx.message.success(ctx.t('Copied to clipboard'));
`,
};
export default snippet;
