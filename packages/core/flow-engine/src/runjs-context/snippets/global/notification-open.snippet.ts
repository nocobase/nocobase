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
  prefix: 'sn-notify',
  label: 'Open notification',
  description: 'Open an AntD notification with custom content',
  locales: {
    'zh-CN': {
      label: '打开通知',
      description: '展示一条自定义内容的通知',
    },
  },
  content: `
ctx.notification.open({
  message: ctx.t('Notification title'),
  description: ctx.t('This is a notification description'),
});
`,
};

export default snippet;
