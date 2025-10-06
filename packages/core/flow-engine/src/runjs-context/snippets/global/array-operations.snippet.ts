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
  prefix: 'sn-array-ops',
  label: 'Array operations (filter, sort, unique)',
  description: 'Common array operations: filter, sort, remove duplicates',
  locales: {
    'zh-CN': {
      label: '数组操作（过滤、排序、去重）',
      description: '常用的数组操作：过滤、排序、去重',
    },
  },
  content: `
const data = [
  { id: 1, name: 'Alice', age: 25, status: 'active' },
  { id: 2, name: 'Bob', age: 30, status: 'inactive' },
  { id: 3, name: 'Charlie', age: 25, status: 'active' },
  { id: 2, name: 'Bob', age: 30, status: 'inactive' }, // duplicate
];

// Filter: Get only active users
const activeUsers = data.filter((item) => item.status === 'active');

// Sort: Sort by age descending, then by name ascending
const sorted = [...data].sort((a, b) => {
  if (a.age !== b.age) return b.age - a.age;
  return a.name.localeCompare(b.name);
});

// Remove duplicates by ID
const unique = data.filter(
  (item, index, self) => index === self.findIndex((t) => t.id === item.id)
);

// Group by status
const grouped = data.reduce((acc, item) => {
  const key = item.status;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});

console.log(ctx.t('Active users:'), activeUsers);
console.log(ctx.t('Sorted:'), sorted);
console.log(ctx.t('Unique:'), unique);
console.log(ctx.t('Grouped:'), grouped);
`,
};

export default snippet;
