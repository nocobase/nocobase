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
  versions: ['*'],
  prefix: 'sn-open-dialog',
  label: 'Open view (dialog)',
  description: 'Open a view in dialog via ctx.openView',
  content: `
const popupUid = 'your-popup-uid';
await ctx.openView(popupUid, {
  mode: 'dialog',
  viewUid: 'detail',
  inputArgs: { foo: 'bar' },
});
`,
};
export default snippet;
