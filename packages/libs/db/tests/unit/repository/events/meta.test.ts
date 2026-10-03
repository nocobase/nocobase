import { describe, expect, it } from 'vitest';
import {
  defineRepositoryEventMeta,
  normalizeRepositoryEventMeta,
} from '../../../../src/repository/events/meta.js';

describe('Repository event meta', () => {
  it('builds entries and reads them back by namespace', () => {
    const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');
    const trace = defineRepositoryEventMeta<string>('trace');
    const meta = normalizeRepositoryEventMeta(
      [audit({ actorId: 'u1' }), trace('t-1')],
      'tasks',
    )!;

    expect(audit.namespace).toBe('audit');
    expect(audit.read({ meta })).toEqual({ actorId: 'u1' });
    expect(trace.read({ meta })).toBe('t-1');
    expect(defineRepositoryEventMeta('other').read({ meta })).toBeUndefined();
    expect(Object.isFrozen(meta)).toBe(true);
  });

  it('leaves a call without meta alone and rejects malformed meta', () => {
    const audit = defineRepositoryEventMeta<string>('audit');
    expect(normalizeRepositoryEventMeta(undefined, 'tasks')).toBeUndefined();
    expect(() =>
      normalizeRepositoryEventMeta([audit('a'), audit('b')], 'tasks'),
    ).toThrow(
      expect.objectContaining({ code: 'INVALID_MUTATION', path: ['meta', 1] }),
    );
    expect(() =>
      normalizeRepositoryEventMeta(
        [{ namespace: 'audit', value: 1 } as never],
        'tasks',
      ),
    ).toThrow(expect.objectContaining({ code: 'INVALID_MUTATION' }));
    expect(() => defineRepositoryEventMeta('')).toThrow(TypeError);
  });
});
