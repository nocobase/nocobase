import { describe, expect, it } from 'vitest';

import { getAvatarInitials } from '../src/index.js';

describe('getAvatarInitials', () => {
  it.each([
    ['周建国', '建国'],
    ['欧阳娜娜', '娜娜'],
    ['李雷', '李雷'],
    ['周 建国', '建国'],
    [' 周\t建\n国　', '建国'],
    ['周', '周'],
    ['山田太郎', '太郎'],
    ['さくら', 'くら'],
    ['カタカナ', 'カナ'],
    ['김 민수', '민수'],
    ['A周BC', 'BC'],
    ['𠮷野家', '野家'],
    ['野𠮷', '野𠮷'],
    ['Li Lei', 'LL'],
    ['Ada Byron Lovelace', 'AB'],
    ['alice', 'A'],
    ['alice@example.test', 'A'],
    ['', '?'],
    ['   ', '?'],
  ])('%s → %s', (name, expected) => {
    expect(getAvatarInitials(name)).toBe(expected);
  });

  it('preserves email fallback rules even for international email addresses', () => {
    expect(getAvatarInitials('周建国@example.test', { cjk: false })).toBe('周');
  });

  it('lets callers retain their existing non-CJK abbreviation', () => {
    expect(getAvatarInitials('Li Lei', { fallback: 'L' })).toBe('L');
    expect(getAvatarInitials('周建国', { fallback: '周' })).toBe('建国');
    expect(getAvatarInitials('', { fallback: '?' })).toBe('?');
  });
});
