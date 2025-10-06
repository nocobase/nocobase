/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['JSRecordActionRunJSContext', 'JSCollectionActionRunJSContext'],
  prefix: 'sn-act-run',
  label: 'Run action',
  description: 'Invoke ctx.runAction with basic parameters',
  locales: {
    'zh-CN': {
      label: '执行动作',
      description: '调用 ctx.runAction 执行动作',
    },
  },
  content: `
await ctx.runAction('someAction', { foo: 'bar' });
ctx.message.success(ctx.t('Action executed'));
`,
};

export default snippet;
