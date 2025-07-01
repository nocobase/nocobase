/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isFieldInterfaceMatch } from '../data-source';

describe('isFieldInterfaceMatch', () => {
  it('should return true when fieldInterfaces is "*" (string)', () => {
    expect(isFieldInterfaceMatch('*', 'a')).toBe(true);
  });

  it('should return false when fieldInterfaces is a string not matching target', () => {
    expect(isFieldInterfaceMatch('b', 'a')).toBe(false);
  });

  it('should return true when fieldInterfaces is a string matching target', () => {
    expect(isFieldInterfaceMatch('a', 'a')).toBe(true);
  });

  it('should return false when fieldInterfaces is array not containing target', () => {
    expect(isFieldInterfaceMatch(['b', 'c'], 'a')).toBe(false);
  });

  it('should return true when fieldInterfaces is array containing target', () => {
    expect(isFieldInterfaceMatch(['a', 'b'], 'a')).toBe(true);
  });

  it('should return true when fieldInterfaces is array containing "*"', () => {
    expect(isFieldInterfaceMatch(['*', 'b'], 'a')).toBe(true);
  });

  it('should return false when fieldInterfaces is null', () => {
    expect(isFieldInterfaceMatch(null, 'a')).toBe(false);
  });

  it('should return false when fieldInterfaces is undefined', () => {
    expect(isFieldInterfaceMatch(undefined, 'a')).toBe(false);
  });

  it('should return false when targetInterface is empty string', () => {
    expect(isFieldInterfaceMatch('a', '')).toBe(false);
    expect(isFieldInterfaceMatch(['a', 'b'], '')).toBe(false);
    expect(isFieldInterfaceMatch('*', '')).toBe(true); // '*' 匹配任何字符串，包括空字符串
  });
});
