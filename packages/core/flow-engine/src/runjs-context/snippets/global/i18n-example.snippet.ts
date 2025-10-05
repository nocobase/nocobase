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
  prefix: 'sn-i18n-example',
  label: 'I18n example',
  description: 'Manage translations using ctx.i18n and render localized text',
  locales: {
    'zh-CN': {
      label: 'I18n 示例',
      description: '通过 ctx.i18n 管理多语言并渲染本地化文本',
    },
  },
  content: `
const zhCN = {
  hello: '你好',
  welcome_user: '欢迎，{{user}}！',
};
const enUS = {
  hello: 'Hello',
  welcome_user: 'Welcome, {{user}}!',
};

ctx.i18n.addResourceBundle('zh-CN', 'demo', zhCN, true, true);
ctx.i18n.addResourceBundle('en-US', 'demo', enUS, true, true);

ctx.element.innerHTML = ctx.t('welcome_user', { user: ctx.auth?.user?.nickname || 'User', ns: 'demo' });
`,
};

export default snippet;
