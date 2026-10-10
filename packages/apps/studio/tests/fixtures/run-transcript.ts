import type { RunEvent } from '@nocobase/agent-protocol';

/** A long transcript with visible messages separating runs of hidden events. */
export function mixedRunEvents(): RunEvent[] {
  const types = [
    'text',
    'input',
    'toolUse',
    'toolResult',
    'permission',
    'thinking',
    'status',
    'usage',
    'checkout',
    'error',
  ] as const;
  return Array.from({ length: 200 }, (_, index) => ({
    seq: index + 1,
    at: '2026-10-01T00:00:00.000Z',
    type: types[index % types.length]!,
    content: `Recorded event ${index + 1}`,
    ...(types[index % types.length] === 'toolUse'
      ? { tool: 'Bash', input: { command: `echo ${index + 1}` } }
      : {}),
  }));
}
