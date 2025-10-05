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
  prefix: 'sn-sleep',
  label: 'Sleep',
  description: 'Pause execution for a given milliseconds',
  locales: {
    'zh-CN': {
      label: '延时等待',
      description: '暂停执行指定毫秒数',
    },
  },
  content: `
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ms = 500;
await sleep(ms);
ctx.message.success(ctx.t('Waited {{ms}} ms', { ms }));
`,
};

export default snippet;
