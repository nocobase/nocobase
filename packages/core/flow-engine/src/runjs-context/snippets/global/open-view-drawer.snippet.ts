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
  prefix: 'sn-open-drawer',
  label: 'Open view (drawer)',
  description: 'Open a view in drawer via ctx.openView',
  locales: {
    'zh-CN': {
      label: '打开视图（抽屉）',
      description: '通过 ctx.openView 以抽屉方式打开视图',
    },
  },
  content: `
// Open a view as drawer and pass arguments at top-level
const popupUid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
await ctx.openView(popupUid, {
  mode: 'drawer',
  title: ctx.t('Sample drawer'),
  size: 'large',
});
`,
};
export default snippet;
