import { describe, expect, it } from 'vitest';
import { formatToolSlots } from '../src/lib/slots.ts';

describe('tool slot display', () => {
  it('words limits per tool in the protocol order', () => {
    expect(formatToolSlots({ codex: 1, claude: 2 })).toBe('claude=2, codex=1');
    expect(formatToolSlots(undefined)).toBe('');
  });
});
