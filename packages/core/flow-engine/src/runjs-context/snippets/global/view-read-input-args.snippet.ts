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
  prefix: 'sn-view-inputArgs',
  label: 'Read view inputArgs',
  description: 'Read parameters passed to current view via ctx.view.inputArgs',
  locales: {
    'zh-CN': {
      label: '读取视图参数 inputArgs',
      description: '在子视图中通过 ctx.view.inputArgs 读取父视图传入的参数',
    },
  },
  content: `
const args = ctx.view?.inputArgs || {};
console.log('inputArgs:', args);
ctx.message?.success?.(ctx.t('Received: {{keys}}', { keys: Object.keys(args).join(', ') }));
`,
};

export default snippet;
