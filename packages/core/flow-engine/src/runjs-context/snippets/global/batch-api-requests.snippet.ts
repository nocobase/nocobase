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
  prefix: 'sn-batch-api',
  label: 'Batch API requests with Promise.all',
  description: 'Execute multiple API requests in parallel and wait for all to complete',
  locales: {
    'zh-CN': {
      label: '批量 API 请求',
      description: '并行执行多个 API 请求并等待全部完成',
    },
  },
  content: `
// Example: Fetch multiple users by primary key in parallel
const ids = [1, 2, 3, 4, 5];

try {
  const results = await Promise.all(
    ids.map((id) =>
      ctx.api.request({
        url: 'users:get',
        method: 'get',
        params: { filterByTk: id },
      })
    )
  );

  const records = results.map((res) => res?.data?.data).filter(Boolean);

  ctx.message.success(
    ctx.t('Successfully fetched {{count}} records', { count: records.length })
  );

  console.log(ctx.t('Fetched records:'), records);
} catch (e) {
  ctx.message.error(ctx.t('Batch request failed: {{msg}}', { msg: String(e?.message || e) }));
}
`,
};

export default snippet;
