import { describe, expect, it } from 'vitest';
import type { CollectionDefinition } from '../../../../src/collection/types.js';
import type { DatabaseDriverRuntime } from '../../../../src/database/runtime.js';
import { bulkStrategy } from '../../../../src/repository/internal/events/strategy.js';
import type { RepositoryMutationSubscription } from '../../../../src/repository/internal/events/registry.js';

const items = {
  name: 'items',
  fields: [{ name: 'id', type: 'string', nullable: false }],
  constraints: [{ type: 'primary', fields: ['id'] }],
} as unknown as CollectionDefinition;

const keyed: RepositoryMutationSubscription = {
  id: undefined,
  sequence: 1,
  collections: new Set(['items']),
  keys: true,
  values: false,
  listeners: { afterCommit: () => undefined },
};

function runtimeWith(
  repository: Record<string, unknown>,
): DatabaseDriverRuntime {
  return { repository } as unknown as DatabaseDriverRuntime;
}

describe('bulkStrategy', () => {
  it('inserts with RETURNING only where the dialect declares it', () => {
    expect(bulkStrategy(items, [keyed], 'createMany', undefined)).toBe(
      'insert-per-row',
    );
    expect(
      bulkStrategy(
        items,
        [keyed],
        'createMany',
        runtimeWith({ insertManyReturning: true }),
      ),
    ).toBe('insert-returning');
  });

  it('inserts row by row where the dialect falls back for the Collection, RETURNING or not', () => {
    const runtime = runtimeWith({
      insertManyReturning: true,
      createManyFallback: (collection: CollectionDefinition) =>
        collection.name === 'items',
    });
    expect(bulkStrategy(items, [keyed], 'createMany', runtime)).toBe(
      'insert-per-row',
    );
    expect(
      bulkStrategy(
        { ...items, name: 'others' } as CollectionDefinition,
        [keyed],
        'createMany',
        runtime,
      ),
    ).toBe('insert-returning');
  });

  it('keeps a single statement when no subscription needs keys', () => {
    expect(
      bulkStrategy(items, [{ ...keyed, keys: false }], 'updateMany', undefined),
    ).toBe('single-statement');
    expect(bulkStrategy(items, [keyed], 'deleteMany', undefined)).toBe(
      'lock-then-write-by-key',
    );
  });
});
