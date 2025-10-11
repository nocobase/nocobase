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
  prefix: 'sn-nav-push',
  label: 'View navigation: push',
  description: 'Navigate within current view (if supported)',
  content: `
// Push a new sub-view (if navigation is available)
ctx.view?.navigation?.push({ viewUid: 'detail', filterByTk: 1 });
// To go back: ctx.view?.navigation?.back();
`,
};
export default snippet;
