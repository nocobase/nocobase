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
  prefix: 'sn-debounce',
  label: 'Debounce function',
  description: 'Create a debounced function to limit execution frequency',
  locales: {
    'zh-CN': {
      label: '防抖函数',
      description: '创建防抖函数以限制执行频率',
    },
  },
  content: `
// Create a debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Example usage: Debounced search function
const debouncedSearch = debounce(async (searchTerm) => {
  console.log(ctx.t('Searching for:'), searchTerm);
  const res = await ctx.api.request({
    url: 'users:list',
    method: 'get',
    params: {
      pageSize: 10,
      filter: {
        nickname: { $includes: searchTerm },
      },
    },
  });
  console.log(ctx.t('Search results:'), res?.data?.data);
}, 500); // Wait 500ms after user stops typing

// Trigger the debounced function
debouncedSearch('example');
`,
};

export default snippet;
