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
  prefix: 'sn-deep-clone',
  label: 'Deep clone object',
  description: 'Create a deep copy of an object or array',
  locales: {
    'zh-CN': {
      label: '深度克隆对象',
      description: '创建对象或数组的深拷贝',
    },
  },
  content: `
// Deep clone function (handles nested objects and arrays)
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Example usage
const original = {
  name: 'John',
  details: {
    age: 30,
    hobbies: ['reading', 'coding'],
  },
};

const cloned = deepClone(original);

// Modify cloned object
cloned.details.age = 31;
cloned.details.hobbies.push('gaming');

console.log(ctx.t('Original:'), original);
console.log(ctx.t('Cloned:'), cloned);
// Original object remains unchanged
`,
};

export default snippet;
