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
  prefix: 'sn-open-page-or-drawer',
  label: 'Open view (page fallback drawer)',
  description: 'Navigate as page when available; fallback to drawer otherwise',
  locales: {
    'zh-CN': {
      label: '打开视图（优先页面，退化抽屉）',
      description: '优先以页面模式打开；当无路由导航时退化为抽屉',
    },
  },
  content: `
const uid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
const args = { viewUid: 'detail', foo: 'bar' };

if (ctx.view?.navigation) {
  await ctx.openView(uid, { mode: 'page', ...args });
} else {
  await ctx.openView(uid, { mode: 'drawer', ...args });
}
`,
};

export default snippet;
