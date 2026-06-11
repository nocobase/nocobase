/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeKeywords } from '../normalizeKeywords';

describe('normalizeKeywords', () => {
  it('keeps decimal values for number fields', () => {
    expect(normalizeKeywords(['1.25'], 'number')).toEqual(['1.25']);
  });

  it('keeps large integer and id values as strings', () => {
    expect(normalizeKeywords(['9007199254740993'], 'integer')).toEqual(['9007199254740993']);
    expect(normalizeKeywords(['9007199254740993', '1.25', ' abc '], 'id')).toEqual(['9007199254740993']);
  });

  it('rejects decimal input for integer fields', () => {
    expect(normalizeKeywords(['1.25', '42'], 'integer')).toEqual(['42']);
  });

  it('parses percent fields as numbers and trims text fields', () => {
    expect(normalizeKeywords([' 1.25 ', 'abc'], 'percent')).toEqual([1.25]);
    expect(normalizeKeywords([' foo ', ''], 'input')).toEqual(['foo']);
  });
});
