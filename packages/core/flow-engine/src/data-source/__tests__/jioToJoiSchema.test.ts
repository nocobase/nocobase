/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import Joi from 'joi';
import { jioToJoiSchema } from '../jioToJoiSchema';

describe('jioToJoiSchema', () => {
  it('creates string schema with email rule and required', () => {
    const schema = jioToJoiSchema({
      type: 'string',
      rules: [
        { name: 'email', args: { tlds: { allow: true } } }, // will be normalized to { allow: false }
        { name: 'required' },
      ],
    });
    expect(Joi.isSchema(schema)).toBe(true);
    const r1 = schema.validate('user@example.com');
    expect(r1.error).toBeUndefined();
    const r2 = schema.validate('not-email');
    expect(r2.error).toBeTruthy();
  });

  it('creates number schema with min/max/length from args.limit', () => {
    const schema = jioToJoiSchema({
      type: 'number',
      rules: [
        { name: 'min', args: { limit: 2 } },
        { name: 'max', args: { limit: 5 } },
      ],
    });
    expect(schema.validate(3).error).toBeUndefined();
    expect(schema.validate(1).error).toBeTruthy();
    expect(schema.validate(6).error).toBeTruthy();
  });

  it('pattern accepts regex string or RegExp', () => {
    const s1 = jioToJoiSchema({ type: 'string', rules: [{ name: 'pattern', args: { regex: '^ab' } }] });
    const s2 = jioToJoiSchema({ type: 'string', rules: [{ name: 'pattern', args: { regex: /^ab/ } }] });
    expect(s1.validate('abc').error).toBeUndefined();
    expect(s1.validate('zz').error).toBeTruthy();
    expect(s2.validate('abc').error).toBeUndefined();
    expect(s2.validate('zz').error).toBeTruthy();
  });

  describe('number precision', () => {
    const schema = jioToJoiSchema({ type: 'number', rules: [{ name: 'precision', args: { limit: 2 } }] });

    it.each([39.2234, -39.2234, 0.001, 1e-7])('rejects %s without rounding', (value) => {
      const result = schema.validate(value);
      expect(result.error?.details[0]).toMatchObject({ type: 'number.precision', context: { limit: 2 } });
      expect(result.value).toBe(value);
    });

    it.each([39.22, -39.22, 39.2, 39, 0, 0.01, '', null, undefined])('accepts %s', (value) => {
      expect(schema.validate(value).error).toBeUndefined();
    });

    it('supports zero precision', () => {
      const integerSchema = jioToJoiSchema({ type: 'number', rules: [{ name: 'precision', args: { limit: 0 } }] });
      expect(integerSchema.validate(39).error).toBeUndefined();
      expect(integerSchema.validate(39.2).error?.details[0].type).toBe('number.precision');
    });

    it('validates numeric strings without rounding them', () => {
      expect(schema.validate('39.22')).toEqual({ value: 39.22 });
      expect(schema.validate('39.2200')).toEqual({ value: 39.22 });
      expect(schema.validate('39.2234').error?.details[0].type).toBe('number.precision');
      expect(schema.validate('1e-7').error?.details[0].type).toBe('number.precision');
      expect(schema.validate('not a number').error?.details[0].type).toBe('number.base');
    });

    it('preserves required and min/max validation', () => {
      const requiredSchema = jioToJoiSchema({
        type: 'number',
        rules: [
          { name: 'precision', args: { limit: 2 } },
          { name: 'min', args: { limit: 1 } },
          { name: 'max', args: { limit: 10 } },
          { name: 'required' },
        ],
      });
      expect(requiredSchema.validate(undefined).error?.details[0].type).toBe('any.required');
      expect(requiredSchema.validate('').error).toBeDefined();
      expect(requiredSchema.validate(null).error).toBeDefined();
      expect(requiredSchema.validate(0.99).error?.details[0].type).toBe('number.min');
      expect(requiredSchema.validate(10.01).error?.details[0].type).toBe('number.max');
      expect(requiredSchema.validate(1.23).error).toBeUndefined();
    });

    it('preserves numeric string conversion when precision is not configured', () => {
      const numberSchema = jioToJoiSchema({ type: 'number', rules: [{ name: 'min', args: { limit: 1 } }] });
      expect(numberSchema.validate('39.2234')).toEqual({ value: 39.2234 });
    });
  });

  it('optional when no required and allows empty string', () => {
    const schema = jioToJoiSchema({ type: 'string' });
    expect(schema.validate('').error).toBeUndefined();
  });
});
