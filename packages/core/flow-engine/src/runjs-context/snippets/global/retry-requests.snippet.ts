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
  prefix: 'sn-retry',
  label: 'Retry failed requests',
  description: 'Automatically retry failed API requests with exponential backoff',
  locales: {
    'zh-CN': {
      label: '重试失败请求',
      description: '自动重试失败的 API 请求（指数退避）',
    },
  },
  content: `
// Retry function with exponential backoff
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const waitTime = delay * Math.pow(2, i);
      console.log(ctx.t('Retry attempt {{attempt}}/{{max}} after {{wait}}ms', {
        attempt: i + 1,
        max: maxRetries,
        wait: waitTime,
      }));

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

// Example usage
try {
  const result = await retry(
    async () => {
      const res = await ctx.api.request({
        url: 'users:list',
        method: 'get',
      });
      return res?.data?.data;
    },
    3, // Max 3 retries
    1000 // Initial delay 1s
  );

  ctx.message.success(ctx.t('Request succeeded with {{count}} records', { count: Array.isArray(result) ? result.length : 0 }));
  console.log(ctx.t('Result:'), result);
} catch (e) {
  ctx.message.error(ctx.t('Request failed after retries: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};

export default snippet;
