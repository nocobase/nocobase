/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getStrength } from '../utils';

describe('getStrength', () => {
  it('should return 0', () => {
    expect(getStrength('')).toBe(0);
  });

  it('should return 20', () => {
    expect(getStrength('123456')).toBe(20);
  });

  it('should return 40', () => {
    expect(getStrength('z123')).toBe(40);
  });

  it('should return 60', () => {
    expect(getStrength('z12345')).toBe(60);
  });

  it('should return 80', () => {
    expect(getStrength('z12345678')).toBe(80);
  });

  it('should return 100', () => {
    expect(getStrength('z1234567890')).toBe(100);
  });

  it('should return 0 for empty value', () => {
    expect(getStrength('')).toBe(0);
  });

  it('should return 20 for a single digit', () => {
    expect(getStrength('1')).toBe(20);
  });

  it('should return 20 for a single lowercase letter', () => {
    expect(getStrength('a')).toBe(20);
  });

  it('should return 20 for a single uppercase letter', () => {
    expect(getStrength('A')).toBe(20);
  });

  it('should return 20 for a single symbol', () => {
    expect(getStrength('@')).toBe(20);
  });

  it('should return 60 for a combination of lowercase letters and digits', () => {
    expect(getStrength('a1b2c3')).toBe(60);
  });

  it('should return 60 for a combination of uppercase letters and digits', () => {
    expect(getStrength('A1B2C3')).toBe(60);
  });

  it('should return 80 for a combination of lowercase letters and symbols', () => {
    expect(getStrength('a@b#c$d%')).toBe(80);
  });

  it('should return 80 for a combination of uppercase letters and symbols', () => {
    expect(getStrength('A@B#C$D%')).toBe(80);
  });

  it('should return 100 for a combination of lowercase letters, uppercase letters, and digits', () => {
    expect(getStrength('aA1bB2cC3')).toBe(100);
  });

  it('should return 100 for a combination of lowercase letters, uppercase letters, and symbols', () => {
    expect(getStrength('aA@bB#cC$dD%')).toBe(100);
  });

  it('should return 100 for a combination of lowercase letters, digits, and symbols', () => {
    expect(getStrength('a1@b2#c3$d4%')).toBe(100);
  });

  it('should return 100 for a combination of uppercase letters, digits, and symbols', () => {
    expect(getStrength('A1@B2#C3$D4%')).toBe(100);
  });

  it('should return 100 for a strong password with a combination of lowercase letters, uppercase letters, digits, and symbols', () => {
    expect(getStrength('aA1@bB2#cC3$dD4%')).toBe(100);
  });
});
