import { describe, expect, it } from 'vitest';
import type {
  CollectionDefinition,
  FilterAst,
  FilterNode,
} from '../../../src/index.js';
import { unchangedFilterSelector } from '../../../src/repository/internal/identity.js';

const collection: CollectionDefinition = {
  name: 'items',
  constraints: [
    { type: 'primary', fields: ['id'] },
    { type: 'unique', fields: ['tenantId', 'code'] },
  ],
  optimisticLock: { field: 'version', strategy: 'increment' },
};
const eq = (field: string, value: string | number | null): FilterNode => ({
  kind: 'condition',
  path: [field],
  operator: '$eq',
  value,
});
const and = (...items: FilterNode[]): FilterAst => ({
  kind: 'filter',
  version: 1,
  root: { kind: 'group', logic: 'and', items },
});

describe('Conditional update identity', () => {
  it('does not trust a disabled or unvalidated constraint', () => {
    expect(
      unchangedFilterSelector(
        {
          ...collection,
          constraints: [
            { type: 'primary', fields: ['id'], db: { valid: false } },
          ],
        },
        and(eq('id', 'A')),
        {},
      ),
    ).toBeUndefined();
  });
  it.each([
    undefined,
    'no action',
    'restrict',
    'cascade',
    'set null',
    'set default',
  ] as const)(
    'accounts for the %s update action on a locating field',
    (onUpdate) => {
      const definition: CollectionDefinition = {
        ...collection,
        constraints: [
          ...collection.constraints!,
          {
            type: 'foreignKey',
            fields: ['id'],
            references: { collection: 'parents', fields: ['id'] },
            onUpdate,
          },
        ],
      };
      const selected = unchangedFilterSelector(
        definition,
        and(eq('id', 'A')),
        {},
      );
      if (
        onUpdate === 'cascade' ||
        onUpdate === 'set null' ||
        onUpdate === 'set default'
      ) {
        expect(selected).toBeUndefined();
      } else {
        expect(selected).toMatchObject({ fields: ['id'], values: { id: 'A' } });
      }
      // A different, stable key can still qualify even if another field cascades.
      expect(
        unchangedFilterSelector(
          definition,
          and(eq('id', 'A'), eq('tenantId', 'T'), eq('code', 'C')),
          {},
        ),
      ).toMatchObject({ fields: selected ? ['id'] : ['tenantId', 'code'] });
    },
  );

  it('does not locate updates through generated fields or incompatible comparisons', () => {
    const filter = and(eq('id', 'A'));
    expect(
      unchangedFilterSelector(
        {
          ...collection,
          fields: [
            {
              name: 'id',
              type: 'string',
              db: { generated: { expression: 'lower(name)' } },
            },
          ],
        },
        filter,
        { name: 'New' },
      ),
    ).toBeUndefined();
    expect(
      unchangedFilterSelector(
        {
          ...collection,
          constraints: [
            { type: 'primary', fields: ['id'], db: { columnEquality: false } },
          ],
        },
        filter,
        {},
      ),
    ).toBeUndefined();
  });

  it.each([true, 'immediate', 'deferred'] as const)(
    'does not assume uniqueness while a %s constraint can be deferred',
    (deferrable) => {
      expect(
        unchangedFilterSelector(
          {
            ...collection,
            constraints: [{ type: 'unique', fields: ['id'], deferrable }],
          },
          and(eq('id', 'A')),
          {},
        ),
      ).toBeUndefined();
    },
  );

  it('requires every component of a non-null unconditional key', () => {
    expect(
      unchangedFilterSelector(collection, and(eq('tenantId', 'T1')), {}),
    ).toBeUndefined();
    expect(
      unchangedFilterSelector(
        collection,
        and(eq('tenantId', 'T1'), eq('code', null)),
        {},
      ),
    ).toBeUndefined();
    expect(
      unchangedFilterSelector(
        collection,
        and(eq('tenantId', 'T1'), eq('code', 'A')),
        {},
      ),
    ).toMatchObject({
      fields: ['tenantId', 'code'],
      values: { tenantId: 'T1', code: 'A' },
    });
    expect(
      unchangedFilterSelector(
        {
          name: 'items',
          constraints: [
            { type: 'unique', fields: ['id'], predicate: { active: true } },
          ],
        },
        and(eq('id', 'A')),
        {},
      ),
    ).toBeUndefined();
  });

  it('does not infer uniqueness from OR, relations, JSON paths or insensitive comparisons', () => {
    for (const filter of [
      {
        ...and(),
        root: {
          kind: 'group' as const,
          logic: 'or' as const,
          items: [eq('id', 'A'), eq('id', 'B')],
        },
      },
      and({
        kind: 'group',
        logic: 'or',
        items: [eq('id', 'A'), eq('id', 'B')],
      }),
      and(eq('id', 'A'), {
        kind: 'relation',
        path: ['tasks'],
        quantifier: 'exists',
      }),
      and({
        kind: 'condition',
        path: ['id'],
        operator: '$eq',
        mode: 'insensitive',
        value: 'A',
      }),
      and({
        kind: 'condition',
        path: ['id'],
        operator: '$eq',
        jsonPath: ['value'],
        value: 'A',
      }),
    ])
      expect(unchangedFilterSelector(collection, filter, {})).toBeUndefined();
  });

  it('finds mandatory equalities in nested AND without promoting OR branches', () => {
    expect(
      unchangedFilterSelector(
        collection,
        and(
          { kind: 'group', logic: 'and', items: [eq('id', 'A')] },
          {
            kind: 'group',
            logic: 'or',
            items: [eq('code', 'one'), eq('code', 'two')],
          },
        ),
        {},
      ),
    ).toMatchObject({ fields: ['id'], values: { id: 'A' } });
  });

  it('uses only keys that remain stable after the write and version increment', () => {
    const filter = and(eq('id', 'A'), eq('tenantId', 'T1'), eq('code', 'one'));
    expect(
      unchangedFilterSelector(collection, filter, { id: 'B' }),
    ).toMatchObject({ fields: ['tenantId', 'code'] });
    expect(
      unchangedFilterSelector(collection, filter, { id: 'B', code: 'two' }),
    ).toBeUndefined();
    expect(
      unchangedFilterSelector(
        {
          ...collection,
          constraints: [{ type: 'primary', fields: ['id', 'version'] }],
        },
        and(eq('id', 'A'), eq('version', 1)),
        {},
      ),
    ).toBeUndefined();
  });
});
