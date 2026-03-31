/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parsedValue } from '../parsedValue';

describe('parsedValue', () => {
  it('should correctly parse simple templates', () => {
    const value = '{{name}} is {{age}} years old';
    const variables = { name: 'Zhang San', age: 18 };
    expect(parsedValue(value, variables)).toBe('Zhang San is 18 years old');
  });

  it('should correctly parse that the template has just one variable', () => {
    const value = '{{name}}';
    const variables = { name: 'Zhang San' };
    expect(parsedValue(value, variables)).toBe('Zhang San');
  });

  it('should handle nested objects', () => {
    const value = "{{user.name}}'s email is {{user.email}}";
    const variables = { user: { name: 'Li Si', email: 'lisi@example.com' } };
    expect(parsedValue(value, variables)).toBe("Li Si's email is lisi@example.com");
  });

  it('should handle arrays', () => {
    const value = '{{fruits.0}} and {{fruits.1}}';
    const variables = { fruits: ['apple', 'banana'] };
    expect(parsedValue(value, variables)).toBe('apple and banana');
  });

  it('should handle undefined variables', () => {
    const value = '{{name}} and {{undefinedVar}}';
    const variables = { name: 'Wang Wu' };
    expect(parsedValue(value, variables)).toBe('Wang Wu and ');
  });
});
