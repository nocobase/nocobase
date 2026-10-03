import { describe, expect, it } from 'vitest';
import { RepositoryMutationRegistry } from '../../../../src/repository/internal/events/registry.js';

describe('RepositoryMutationRegistry', () => {
  it('matches subscriptions by any of their Collections, in registration order', () => {
    const registry = new RepositoryMutationRegistry();
    expect(registry.empty).toBe(true);
    const listener = { afterCommit: () => undefined };
    const tasks = registry.subscribe(
      { id: 'tasks', collections: ['tasks'] },
      listener,
    );
    registry.subscribe(
      {
        id: 'both',
        collections: ['projects', 'tasks'],
        keys: false,
        values: true,
      },
      listener,
    );

    expect(
      registry
        .matching(new Set(['tasks']))
        .map((subscription) => [
          subscription.id,
          subscription.keys,
          subscription.values,
        ]),
    ).toEqual([
      ['tasks', true, false],
      ['both', false, true],
    ]);
    expect(registry.matching(new Set(['users']))).toEqual([]);

    tasks();
    expect(registry.matching(new Set(['tasks'])).map((s) => s.id)).toEqual([
      'both',
    ]);
  });

  it('rejects a subscription that could never receive anything', () => {
    const registry = new RepositoryMutationRegistry();
    const listener = { afterCommit: () => undefined };
    expect(() => registry.subscribe({ collections: [] }, listener)).toThrow(
      TypeError,
    );
    expect(() => registry.subscribe({ collections: [''] }, listener)).toThrow(
      TypeError,
    );
    expect(() => registry.subscribe({ collections: ['tasks'] }, {})).toThrow(
      TypeError,
    );
    expect(registry.empty).toBe(true);
  });
});
