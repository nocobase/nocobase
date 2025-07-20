/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { logicCalculate, calculators, Calculation } from '../logicCalculate';

describe('workflow > logic calculate', () => {
  it('should return true when calculation is null or undefined', () => {
    expect(logicCalculate(null)).toBe(true);
    expect(logicCalculate(undefined)).toBe(true);
  });

  it('should return true for empty calculation item', () => {
    expect(logicCalculate({})).toBe(true);
  });

  it('should throw error for unregistered calculator', () => {
    expect(() => logicCalculate({ calculator: 'foo', operands: [1, 1] })).toThrow(
      'no calculator function registered for "foo"',
    );
  });

  describe('single calculation', () => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    it.each([
      ['equal', 1, 1, true],
      ['equal', 1, '1', true],
      ['equal', 1, 2, false],
      ['equal', now, now.toISOString(), true],
      ['equal', now, now.getTime(), true],
      ['equal', now, now.getTime() + 1, false],
      ['equal', now, 'abc', false],
      ['==', 1, 1, true],
      ['notEqual', 1, 2, true],
      ['notEqual', 1, 1, false],
      ['notEqual', now, now.getTime(), false],
      ['notEqual', now, now.toISOString(), false],
      ['notEqual', now, 'abc', true],
      ['notEqual', now, true, true],
      ['notEqual', now, false, true],
      ['notEqual', now, null, true],
      ['notEqual', now, 0, true],
      ['notEqual', now, 1, true],
      ['!=', 1, 2, true],
      ['gt', 2, 1, true],
      ['gt', 1, 2, false],
      ['gt', now, now.getTime(), false],
      ['gt', now, now.toISOString(), false],
      ['gt', now, '', false],
      ['gt', now, true, false],
      ['gt', now, false, false],
      ['gt', now, null, false],
      ['gt', now, 0, true],
      ['gt', now, yesterday, true],
      ['gt', now, yesterday.toISOString(), true],
      ['gt', now, tomorrow, false],
      ['gt', now, tomorrow.toISOString(), false],
      ['>', 2, 1, true],
      ['gte', 2, 1, true],
      ['gte', 2, 2, true],
      ['gte', 1, 2, false],
      ['>=', 2, 2, true],
      ['lt', 1, 2, true],
      ['lt', 2, 1, false],
      ['lt', now, now.getTime(), false],
      ['lt', now, now.toISOString(), false],
      ['lt', now, '', false],
      ['lt', now, true, false],
      ['lt', now, false, false],
      ['lt', now, null, false],
      ['lt', now, 0, false],
      ['lt', now, 1, false],
      ['lt', now, yesterday, false],
      ['lt', now, yesterday.toISOString(), false],
      ['lt', now, tomorrow, true],
      ['lt', now, tomorrow.toISOString(), true],
      ['<', 1, 2, true],
      ['lte', 1, 2, true],
      ['lte', 2, 2, true],
      ['lte', 2, 1, false],
      ['<=', 2, 2, true],
      ['includes', [1, 2, 3], 2, true],
      ['includes', [1, 2, 3], 4, false],
      ['includes', 'abc', 'b', true],
      ['notIncludes', [1, 2, 3], 4, true],
      ['notIncludes', [1, 2, 3], 2, false],
      ['startsWith', 'abc', 'a', true],
      ['startsWith', 'abc', 'b', false],
      ['notStartsWith', 'abc', 'b', true],
      ['notStartsWith', 'abc', 'a', false],
      ['endsWith', 'abc', 'c', true],
      ['endsWith', 'abc', 'b', false],
      ['notEndsWith', 'abc', 'b', true],
      ['notEndsWith', 'abc', 'c', false],
    ])('%s (%s, %s) should be %s', (calculator, a, b, expected) => {
      expect(logicCalculate({ calculator, operands: [a, b] })).toBe(expected);
    });
  });

  describe('grouped calculations', () => {
    it('should handle "and" group', () => {
      const calculation: Calculation = {
        group: {
          type: 'and',
          calculations: [
            { calculator: 'equal', operands: [1, 1] },
            { calculator: 'gt', operands: [2, 1] },
          ],
        },
      };
      expect(logicCalculate(calculation)).toBe(true);

      calculation.group.calculations.push({ calculator: 'lt', operands: [1, 0] });
      expect(logicCalculate(calculation)).toBe(false);
    });

    it('should handle "or" group', () => {
      const calculation: Calculation = {
        group: {
          type: 'or',
          calculations: [
            { calculator: 'equal', operands: [1, 2] },
            { calculator: 'gt', operands: [1, 2] },
          ],
        },
      };
      expect(logicCalculate(calculation)).toBe(false);

      calculation.group.calculations.push({ calculator: 'lt', operands: [1, 2] });
      expect(logicCalculate(calculation)).toBe(true);
    });

    it('should handle empty calculations in group', () => {
      const andGroup: Calculation = {
        group: {
          type: 'and',
          calculations: [],
        },
      };
      expect(logicCalculate(andGroup)).toBe(true);

      const orGroup: Calculation = {
        group: {
          type: 'or',
          calculations: [],
        },
      };
      expect(logicCalculate(orGroup)).toBe(false);
    });
  });

  describe('nested grouped calculations', () => {
    it('should handle nested "and" and "or" groups', () => {
      const calculation: Calculation = {
        group: {
          type: 'and',
          calculations: [
            { calculator: 'equal', operands: [1, 1] },
            {
              group: {
                type: 'or',
                calculations: [
                  { calculator: 'gt', operands: [1, 2] },
                  { calculator: 'lt', operands: [1, 2] },
                ],
              },
            },
          ],
        },
      };
      expect(logicCalculate(calculation)).toBe(true);

      const calculation2: Calculation = {
        group: {
          type: 'and',
          calculations: [
            { calculator: 'equal', operands: [1, 1] },
            {
              group: {
                type: 'or',
                calculations: [
                  { calculator: 'gt', operands: [1, 2] },
                  { calculator: 'lt', operands: [2, 1] },
                ],
              },
            },
          ],
        },
      };
      expect(logicCalculate(calculation2)).toBe(false);
    });
  });

  describe('custom calculator', () => {
    beforeAll(() => {
      calculators.register('isOdd', (a) => a % 2 !== 0);
    });

    it('should support custom registered calculator', () => {
      expect(logicCalculate({ calculator: 'isOdd', operands: [3] })).toBe(true);
      expect(logicCalculate({ calculator: 'isOdd', operands: [2] })).toBe(false);
    });
  });
});
