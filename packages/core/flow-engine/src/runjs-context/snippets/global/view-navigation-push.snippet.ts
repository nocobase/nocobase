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
  prefix: 'sn-nav-navigate',
  label: 'View navigation: navigate',
  description: 'Navigate within current view using navigation.navigateTo/back',
  locales: {
    'zh-CN': {
      label: '视图导航：navigate',
      description: '使用 navigation.navigateTo/back 在当前视图内导航',
    },
  },
  content: `
// Navigate within the current view when navigation is available
if (ctx.view?.navigation) {
  ctx.view.navigation.navigateTo({ viewUid: 'detail', filterByTk: 1 });
  // To go back:
  // ctx.view.navigation.back();
} else {
  ctx.message?.warning?.(ctx.t('Navigation is not available in this view'));
}
`,
};
export default snippet;
