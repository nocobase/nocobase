/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '../SchemaComponentProvider';

describe('compile(expression)', () => {
  it('should evaluate safe expression correctly', () => {
    const result = Registry.compile('a + b', { a: 1, b: 2 });
    expect(result).toBe(3);
  });

  it('should block constructor.constructor XSS attempts', () => {
    const dangerous = `const c = constructor;c.constructor("console.log('XSS')")()`;
    const result = Registry.compile(dangerous, {});
    expect(result).toBe(`{{${dangerous}}}`);
  });

  it('should block constructor.constructor XSS attempts', () => {
    const dangerous = `constructor.constructor("console.log('XSS')")()`;
    const result = Registry.compile(dangerous, {});
    expect(result).toBe(`{{${dangerous}}}`);
  });

  it('should block new Function', () => {
    const dangerous = `new Function('return 1+1')()`;
    const result = Registry.compile(dangerous, {});
    expect(result).toBe(`{{${dangerous}}}`);
  });

  it('should cache result if expression starts with t(', () => {
    const expr = `t('hello')`;
    const spy = vi.fn(() => 'translated');
    const result = Registry.compile(expr, { t: spy });
    const result2 = Registry.compile(expr, { t: () => 'different' });

    expect(result).toBe(result2); // cached
  });
});
