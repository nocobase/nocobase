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

  it('optional when no required and allows empty string', () => {
    const schema = jioToJoiSchema({ type: 'string' });
    expect(schema.validate('').error).toBeUndefined();
  });
});
