import { describe, expect, it } from 'vitest';

import { UsageError } from '../src/lib/command.ts';
import { formatToolSlots, parseSlotsFlag } from '../src/lib/slots.ts';

describe('--slots', () => {
  it('takes a total, limits per coding tool, or both', () => {
    expect(parseSlotsFlag('3')).toEqual({ slots: 3 });
    expect(parseSlotsFlag('claude=2,codex=1')).toEqual({
      toolSlots: { claude: 2, codex: 1 },
    });
    expect(parseSlotsFlag(' 3, claude = 2 ,codex=1')).toEqual({
      slots: 3,
      toolSlots: { claude: 2, codex: 1 },
    });
  });

  it('refuses what it cannot read', () => {
    for (const value of [
      '0',
      '33',
      'two',
      '3,4',
      'vim=1',
      'claude=0',
      'claude=1,claude=2',
      'claude=',
      '',
    ])
      expect(() => parseSlotsFlag(value)).toThrow(UsageError);
  });

  it('words limits per tool in the protocol order', () => {
    expect(formatToolSlots({ codex: 1, claude: 2 })).toBe('claude=2, codex=1');
    expect(formatToolSlots(undefined)).toBe('');
  });
});
