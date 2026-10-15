import { describe, expect, it, vi } from 'vitest';
import { CollectionResolutionError } from '../../../src/collection/resolver/errors.js';
import {
  CollectionResolver,
  resolveCollection,
} from '../../../src/collection/resolver/resolver.js';
import type { CollectionResolutionContext } from '../../../src/collection/resolver/types.js';
import type { CollectionMetadataDocument } from '../../../src/index.js';
import type {
  PhysicalCollectionSchema,
  PhysicalSchemaAspect,
  PhysicalSchemaInspectionStatus,
} from '../../../src/schema/inspector/types.js';

describe('CollectionResolver', () => {
  it.each([false, true])(
    'preserves every shared backing-index restriction (legacy reference=%s)',
    (legacy) => {
      const references = [
        { kind: 'unique' as const, name: 'unique_key' },
        { kind: 'primaryKey' as const, name: 'primary_key' },
      ];
      const result = resolveCollection({
        physical: physicalCollection({
          columns: [column('id', 1), column('tenant', 2)],
          primaryKey: { name: 'primary_key', columns: ['tenant', 'id'] },
          uniqueConstraints: [
            { name: 'unique_key', columns: ['id', 'tenant'] },
          ],
          indexes: [
            {
              name: 'shared_index',
              keys: [
                { columnName: 'id', columnEquality: false },
                { columnName: 'tenant' },
              ],
              unique: true,
              valid: false,
              ...(legacy ? { backsConstraint: references[0] } : {}),
              backsConstraints: references,
            },
          ],
        }),
        context: emptyContext(),
      });
      expect(result.collection.constraints).toEqual([
        {
          type: 'primary',
          name: 'primary_key',
          fields: ['tenant', 'id'],
          db: { columnEquality: false, valid: false },
        },
        {
          type: 'unique',
          name: 'unique_key',
          fields: ['id', 'tenant'],
          db: { columnEquality: false, valid: false },
        },
      ]);
      expect(result.collection.indexes).toEqual([]);
    },
  );

  describe.each(['primaryKey', 'unique'] as const)(
    '%s backing index identity',
    (kind) => {
      it.each([
        { referenceName: 'constraint_key', keys: ['id', 'tenant'] },
        { referenceName: 'constraint_key', keys: ['id', 'tenant', 'extra'] },
        { referenceName: undefined, keys: ['id', 'tenant'] },
      ])(
        'preserves safety metadata with $keys and name=$referenceName',
        ({ referenceName, keys }) => {
          const constraint = {
            name: 'constraint_key',
            columns: ['tenant', 'id'],
          };
          const result = resolveCollection({
            physical: physicalCollection({
              columns: [
                column('tenant', 1),
                column('id', 2),
                column('extra', 3),
              ],
              ...(kind === 'primaryKey'
                ? { primaryKey: constraint }
                : { uniqueConstraints: [constraint] }),
              indexes: [
                {
                  name: 'backing_index',
                  keys: keys.map((columnName) => ({
                    columnName,
                    columnEquality: false,
                  })),
                  unique: keys.length === 2,
                  valid: false,
                  backsConstraint: { kind, name: referenceName },
                },
              ],
            }),
            context: emptyContext(),
          });
          expect(result.collection.constraints).toContainEqual(
            expect.objectContaining({
              type: kind === 'primaryKey' ? 'primary' : 'unique',
              name: constraint.name,
              fields: ['tenant', 'id'],
              db: { columnEquality: false, valid: false },
            }),
          );
        },
      );
    },
  );

  it('keeps safety metadata on the named constraint when two constraints use the same columns', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        columns: [column('id', 1)],
        uniqueConstraints: [
          { name: 'safe_key', columns: ['id'] },
          { name: 'unsafe_key', columns: ['id'] },
        ],
        indexes: [
          {
            name: 'safe_index',
            keys: [{ columnName: 'id' }],
            unique: true,
            backsConstraint: { kind: 'unique', name: 'safe_key' },
          },
          {
            name: 'unsafe_index',
            keys: [{ columnName: 'id', columnEquality: false }],
            unique: true,
            valid: false,
            backsConstraint: { kind: 'unique', name: 'unsafe_key' },
          },
        ],
      }),
      context: emptyContext(),
    });
    expect(result.collection.constraints).toEqual([
      { type: 'unique', name: 'safe_key', fields: ['id'] },
      {
        type: 'unique',
        name: 'unsafe_key',
        fields: ['id'],
        db: { columnEquality: false, valid: false },
      },
    ]);
  });

  it.each(['primaryKey', 'unique'] as const)(
    'preserves invalid %s backing indexes',
    (kind) => {
      const result = resolveCollection({
        physical: physicalCollection({
          columns: [column('id', 1)],
          ...(kind === 'primaryKey'
            ? { primaryKey: { columns: ['id'] } }
            : { uniqueConstraints: [{ columns: ['id'] }] }),
          indexes: [
            {
              name: 'key',
              keys: [{ columnName: 'id' }],
              unique: true,
              valid: false,
              backsConstraint: { kind },
            },
          ],
        }),
        context: emptyContext(),
      });
      expect(result.collection.constraints).toContainEqual(
        expect.objectContaining({
          type: kind === 'primaryKey' ? 'primary' : 'unique',
          fields: ['id'],
          db: { valid: false },
        }),
      );
    },
  );

  it.each([true, false])(
    'only promotes valid=%s indexes whose predicate is implied by non-null keys',
    (valid) => {
      const result = resolveCollection({
        physical: physicalCollection({
          columns: [column('id', 1)],
          indexes: [
            {
              name: 'key',
              keys: [{ columnName: 'id' }],
              unique: true,
              valid,
              partial: true,
              predicate: 'id IS NOT NULL',
              predicateSatisfiedByNonNullKeys: true,
            },
          ],
        }),
        context: emptyContext(),
      });
      expect(result.collection.constraints).toHaveLength(valid ? 1 : 0);
    },
  );

  it.each([false, 'immediate', 'deferred'] as const)(
    'preserves %s primary key deferrability',
    (deferrable) => {
      const result = resolveCollection({
        physical: physicalCollection({
          columns: [column('id', 1)],
          primaryKey: {
            columns: ['id'],
            deferrable: deferrable !== false,
            initiallyDeferred: deferrable === 'deferred',
          },
        }),
        context: emptyContext(),
      });
      expect(result.collection.constraints).toContainEqual({
        type: 'primary',
        fields: ['id'],
        deferrable,
      });
    },
  );

  it.each([
    ['integer', true, true],
    [undefined, true, false],
    ['integer', false, false],
  ] as const)(
    'validates bigInt auto-increment storage with affinity %s and autoIncrement %s',
    (affinity, autoIncrement, compatible) => {
      const resolve = () =>
        resolveCollection({
          physical: physicalCollection({
            tableName: 'items',
            columns: [
              column('id', 1, {
                dataType: 'integer',
                nativeType: 'INTEGER',
                affinity,
                autoIncrement,
              }),
            ],
          }),
          metadata: {
            version: 1,
            name: 'items',
            fields: { id: { type: 'bigInt' } },
          },
          context: emptyContext(),
        });
      if (compatible)
        expect(resolve().collection.fields).toContainEqual(
          expect.objectContaining({ name: 'id', type: 'bigInt' }),
        );
      else expect(resolve).toThrow(CollectionResolutionError);
    },
  );

  it.each([
    ['date', 'datetime', 'DATE', undefined, true],
    ['date', 'datetime', 'timestamp', undefined, false],
    ['time', 'string', 'varchar2(16)', 16, true],
    ['time', 'string', 'varchar2(4)', 4, false],
    ['datetimeTz', 'datetime', 'datetime(3)', undefined, true],
    ['datetimeTz', 'datetime', 'timestamp without time zone', undefined, false],
    ['datetime', 'datetimeTz', 'timestamp with time zone', undefined, false],
    ['datetimeTz', 'text', 'TEXT', undefined, true],
    ['datetimeTz', 'integer', 'integer', undefined, false],
    ['datetimeTz', 'datetimeTz', 'datetimeoffset(3)', undefined, true],
  ] as const)(
    'validates supplemental %s against %s storage %s',
    (logical, physical, nativeType, length, compatible) => {
      const resolve = () =>
        resolveCollection({
          physical: physicalCollection({
            tableName: 'items',
            columns: [
              column('value', 1, { dataType: physical, nativeType, length }),
            ],
          }),
          metadata: {
            version: 1,
            name: 'items',
            fields: { value: { type: logical } },
          },
          context: emptyContext(),
        });
      if (compatible)
        expect(resolve().collection.fields).toContainEqual(
          expect.objectContaining({ name: 'value', type: logical }),
        );
      else expect(resolve).toThrow(CollectionResolutionError);
    },
  );

  it.each([
    ['integer', 'decimal', true],
    ['bigInt', 'decimal', true],
    ['boolean', 'integer', true],
    ['boolean', 'decimal', true],
    ['boolean', 'string', false],
    ['json', 'text', true],
    ['json', 'string', true],
    ['json', 'integer', false],
  ] as const)(
    'validates supplemental %s against physical %s',
    (logical, physical, compatible) => {
      const resolve = () =>
        resolveCollection({
          physical: physicalCollection({
            tableName: 'items',
            columns: [
              column('value', 1, {
                dataType: physical,
                scale: 0,
                nativeType: physical === 'decimal' ? 'NUMBER(38,0)' : physical,
              }),
            ],
          }),
          metadata: {
            version: 1,
            name: 'items',
            fields: { value: { type: logical } },
          },
          context: emptyContext(),
        });
      if (compatible)
        expect(resolve().collection.fields).toContainEqual(
          expect.objectContaining({ name: 'value', type: logical }),
        );
      else expect(resolve).toThrow(CollectionResolutionError);
    },
  );

  it('exposes a portable logical unique constraint for a plain unique index', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'users',
        columns: [column('id', 1), column('email', 2)],
        primaryKey: { name: 'users_pkey', columns: ['id'] },
        indexes: [
          {
            name: 'users_email_unique',
            keys: [{ columnName: 'email' }],
            unique: true,
          },
        ],
      }),
      context: emptyContext(),
    });

    expect(result.collection.constraints).toContainEqual({
      type: 'unique',
      fields: ['email'],
      name: 'users_email_unique',
      mode: 'index',
    });
  });

  it.each([{ predicate: 'active = 1' }, { partial: true }, { valid: false }])(
    'does not promote a restricted unique index: %j',
    (facts) => {
      const result = resolveCollection({
        physical: physicalCollection({
          tableName: 'users',
          columns: [column('id', 1), column('email', 2)],
          primaryKey: { columns: ['id'] },
          indexes: [
            {
              name: 'users_email_unique',
              keys: [{ columnName: 'email' }],
              unique: true,
              ...facts,
            },
          ],
        }),
        context: emptyContext(),
      });
      expect(result.collection.constraints).toEqual([
        { type: 'primary', fields: ['id'] },
      ]);
      expect(result.collection.indexes).toMatchObject([
        { name: 'users_email_unique', db: { unique: true, ...facts } },
      ]);
    },
  );

  it('merges valid optimistic lock metadata into a resolved table Collection', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'orders',
        columns: [
          column('id', 1),
          column('version', 2, { dataType: 'integer', nullable: false }),
        ],
      }),
      metadata: {
        version: 1,
        name: 'orders',
        optimisticLock: { field: 'version', strategy: 'increment' },
      },
      context: emptyContext(),
    });

    expect(result.collection.optimisticLock).toEqual({
      field: 'version',
      strategy: 'increment',
    });
  });

  it.each([
    ['missing direct Field', 'missing', 'integer', false, 'table'],
    ['non-integer Field', 'version', 'string', false, 'table'],
    ['nullable Field', 'version', 'integer', true, 'table'],
    ['view Collection', 'version', 'integer', false, 'view'],
  ] as const)(
    'rejects optimistic locking with a %s',
    (_label, field, dataType, nullable, kind) => {
      expect(() =>
        resolveCollection({
          physical: physicalCollection({
            kind,
            tableName: 'orders',
            columns: [
              column('id', 1),
              column('version', 2, { dataType, nullable }),
            ],
          }),
          metadata: {
            version: 1,
            name: 'orders',
            optimisticLock: { field, strategy: 'increment' },
          },
          context: emptyContext(),
        }),
      ).toThrowError(
        expect.objectContaining({
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID',
            }),
          ]),
        }),
      );
    },
  );

  it('maps physical facts and supplemental metadata without duplicating constraints', () => {
    const context: CollectionResolutionContext = {
      resolvePhysicalCollection: vi.fn((identity) =>
        identity.schema === 'crm' && identity.tableName === 'crm_customers'
          ? {
              name: 'customers',
              naming: { underscored: true, tablePrefix: 'crm_' },
            }
          : undefined,
      ),
    };
    const physical = physicalCollection({
      kind: 'partitionedTable',
      schema: 'sales',
      tableName: 'app_orders',
      comment: 'Physical orders',
      columns: [
        column('normalized_email', 4, {
          dataType: 'string',
          nativeType: 'varchar(255)',
          length: 255,
          generated: { expression: 'lower(email)', stored: true },
        }),
        column('id', 1, {
          dataType: 'bigInt',
          nativeType: 'int8',
          nativeTypeSchema: 'pg_catalog',
          autoIncrement: true,
        }),
        column('customer_id', 2, {
          dataType: 'bigInt',
          nativeType: 'int8',
          nullable: false,
        }),
        column('amount', 3, {
          dataType: 'decimal',
          nativeType: 'numeric(12,2)',
          precision: 12,
          scale: 2,
          default: { expression: '0::numeric', value: 0 },
          comment: 'Physical amount',
        }),
      ],
      primaryKey: { name: 'orders_pkey', columns: ['id'] },
      uniqueConstraints: [
        {
          name: 'orders_amount_key',
          columns: ['amount'],
          deferrable: true,
          initiallyDeferred: true,
        },
      ],
      indexes: [
        {
          name: 'orders_pkey',
          keys: [{ columnName: 'id' }],
          unique: true,
          backsConstraint: { kind: 'primaryKey', name: 'orders_pkey' },
        },
        {
          name: 'orders_search_idx',
          keys: [
            { columnName: 'customer_id', order: 'desc', nulls: 'last' },
            { expression: 'lower(normalized_email)', order: 'asc' },
          ],
          includeColumns: ['amount'],
          unique: true,
          method: 'btree',
          predicate: 'amount > 0',
        },
      ],
      foreignKeys: [
        {
          name: 'orders_customer_fkey',
          columns: ['customer_id'],
          referencedCollection: {
            schema: 'crm',
            tableName: 'crm_customers',
          },
          referencedColumns: ['id'],
          onDelete: 'setNull',
          onUpdate: 'setDefault',
          deferrable: true,
          initiallyDeferred: false,
        },
      ],
      checkConstraints: [
        { name: 'orders_amount_check', expression: 'amount >= 0' },
      ],
      inspection: inspection({ comments: 'unsupported' }, [
        {
          code: 'COMMENTS_UNSUPPORTED',
          aspect: 'comments',
          message: 'Comments are not available.',
        },
      ]),
    });
    const metadata: CollectionMetadataDocument = {
      version: 1,
      name: 'orders',
      naming: { tablePrefix: 'app_' },
      title: 'Orders',
      fields: {
        amount: { title: 'Amount', description: 'Order total.' },
      },
      relations: {
        customer: {
          targetKey: 'id',
          foreignKey: 'customerId',
          type: 'belongsTo',
          target: 'customers',
          sourceKey: 'id',
          title: 'Customer',
        },
      },
    };

    const result = new CollectionResolver().resolve({
      physical,
      metadata,
      naming: { underscored: true, tablePrefix: 'ignored_' },
      context,
    });

    expect(context.resolvePhysicalCollection).toHaveBeenCalledWith({
      schema: 'crm',
      tableName: 'crm_customers',
    });
    expect(result.collection).toMatchObject({
      kind: 'table',
      name: 'orders',
      naming: { underscored: true, tablePrefix: 'app_' },
      title: 'Orders',
      db: {
        schema: 'sales',
        comment: 'Physical orders',
        physicalKind: 'partitionedTable',
      },
    });
    expect(result.collection.fields?.map((field) => field.name)).toEqual([
      'id',
      'customerId',
      'amount',
      'normalizedEmail',
      'customer',
    ]);
    expect(
      result.collection.fields?.find((field) => field.name === 'id'),
    ).toMatchObject({
      type: 'bigInt',
      nullable: true,
      autoIncrement: true,
      db: { nativeType: 'int8', nativeTypeSchema: 'pg_catalog' },
    });
    expect(
      result.collection.fields?.find((field) => field.name === 'amount'),
    ).toMatchObject({
      type: 'decimal',
      defaultValue: 0,
      precision: 12,
      scale: 2,
      title: 'Amount',
      description: 'Order total.',
      db: {
        nativeType: 'numeric(12,2)',
        comment: 'Physical amount',
        defaultExpression: '0::numeric',
      },
    });
    expect(
      result.collection.fields?.find(
        (field) => field.name === 'normalizedEmail',
      ),
    ).toMatchObject({
      db: { generated: { expression: 'lower(email)', stored: true } },
    });
    expect(
      result.collection.fields?.find((field) => field.name === 'customer'),
    ).toMatchObject({
      type: 'belongsTo',
      target: 'customers',
      sourceKey: 'id',
      foreignKey: 'customerId',
      title: 'Customer',
    });
    expect(result.collection.constraints).toEqual([
      { type: 'primary', name: 'orders_pkey', fields: ['id'] },
      {
        type: 'unique',
        name: 'orders_amount_key',
        fields: ['amount'],
        deferrable: 'deferred',
      },
      {
        type: 'foreignKey',
        name: 'orders_customer_fkey',
        fields: ['customerId'],
        references: { collection: 'customers', fields: ['id'] },
        onDelete: 'set null',
        onUpdate: 'set default',
        deferrable: 'immediate',
      },
      {
        type: 'check',
        name: 'orders_amount_check',
        expression: 'amount >= 0',
      },
    ]);
    expect(result.collection.indexes).toEqual([
      {
        name: 'orders_search_idx',
        fields: ['customerId'],
        expressions: ['lower(normalized_email)'],
        type: 'btree',
        order: { customerId: 'desc' },
        db: {
          unique: true,
          keys: [
            { field: 'customerId', order: 'desc', nulls: 'last' },
            { expression: 'lower(normalized_email)', order: 'asc' },
          ],
          includeFields: ['amount'],
          predicate: 'amount > 0',
        },
      },
    ]);
    expect(result.inspection).toBe(physical.inspection);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'COLLECTION_INSPECTION_UNSUPPORTED',
        aspect: 'comments',
      }),
      {
        code: 'COLLECTION_INSPECTION_WARNING',
        sourceCode: 'COMMENTS_UNSUPPORTED',
        aspect: 'comments',
        message: 'Comments are not available.',
      },
    ]);
  });

  it('infers deterministic names without metadata and preserves a complete View definition', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        kind: 'view',
        tableName: 'app_active_orders',
        columns: [column('order_no', 1)],
        viewDefinition: 'select order_no from app_orders',
      }),
      naming: { tablePrefix: 'app_' },
      context: emptyContext(),
    });

    expect(result.collection).toMatchObject({
      kind: 'view',
      name: 'activeOrders',
      fields: [{ name: 'orderNo' }],
      view: { asRaw: { sql: 'select order_no from app_orders' } },
    });
  });

  it('keeps partial non-column facts as warnings without guessing missing facts', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'orders',
        columns: [column('id', 1)],
        inspection: inspection({ indexes: 'partial' }),
      }),
      context: emptyContext(),
    });

    expect(result.collection.name).toBe('orders');
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'COLLECTION_INSPECTION_PARTIAL',
        aspect: 'indexes',
      }),
    );
  });

  it('preserves physical identifiers when underscored naming is disabled', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'tbl_order_items',
        columns: [column('order_no', 1)],
      }),
      naming: { underscored: false, tablePrefix: 'tbl_' },
      context: emptyContext(),
    });

    expect(result.collection.name).toBe('order_items');
    expect(result.collection.fields?.[0]?.name).toBe('order_no');
  });

  it('aggregates incomplete columns, drift, naming, relation, and physical reference issues', () => {
    const physical = physicalCollection({
      tableName: 'wrong_orders',
      columns: [column('customer_id', 1)],
      primaryKey: { columns: ['missing_id'] },
      indexes: [
        {
          name: 'bad_index',
          keys: [{ columnName: 'missing_column' }],
          unique: false,
        },
      ],
      foreignKeys: [
        {
          columns: ['customer_id'],
          referencedCollection: { schema: 'crm', tableName: 'customers' },
          referencedColumns: ['id'],
        },
      ],
      inspection: inspection({ columns: 'partial' }),
    });
    const metadata: CollectionMetadataDocument = {
      version: 1,
      name: 'orders',
      fields: { missing: { title: 'Missing' } },
      relations: {
        customerId: {
          targetKey: 'id',
          foreignKey: 'customerIdId',
          type: 'belongsTo',
          target: 'customers',
        },
        owner: {
          targetKey: 'id',
          type: 'belongsTo',
          target: 'users',
          sourceKey: 'missingSource',
          foreignKey: 'missingForeignKey',
        },
      },
    };

    expect(() =>
      resolveCollection({ physical, metadata, context: emptyContext() }),
    ).toThrow(CollectionResolutionError);

    try {
      resolveCollection({ physical, metadata, context: emptyContext() });
    } catch (error) {
      const codes = (error as CollectionResolutionError).issues.map(
        (item) => item.code,
      );
      expect(codes).toEqual(
        expect.arrayContaining([
          'COLLECTION_SCHEMA_INCOMPLETE',
          'COLLECTION_SCHEMA_DRIFT',
          'COLLECTION_FIELD_CONFLICT',
          'COLLECTION_RELATION_INVALID',
          'COLLECTION_PHYSICAL_REFERENCE_INVALID',
        ]),
      );
    }
  });

  it('rejects physical identifiers that cannot round trip through naming', () => {
    expect(() =>
      resolveCollection({
        physical: physicalCollection({
          tableName: 'Orders',
          columns: [column('ID', 1)],
        }),
        context: emptyContext(),
      }),
    ).toThrowError(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'COLLECTION_NAME_CONFLICT' }),
        ]),
      }),
    );
  });

  it('rejects inconsistent target identities and foreign key column counts', () => {
    const physical = physicalCollection({
      columns: [column('tenant_id', 1), column('customer_id', 2)],
      foreignKeys: [
        {
          columns: ['tenant_id', 'customer_id'],
          referencedCollection: {
            schema: 'crm',
            tableName: 'crm_customers',
          },
          referencedColumns: ['id'],
        },
      ],
    });

    expect(() =>
      resolveCollection({
        physical,
        context: {
          resolvePhysicalCollection: () => ({
            name: 'accounts',
            naming: { underscored: true, tablePrefix: 'crm_' },
          }),
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: 'COLLECTION_PHYSICAL_REFERENCE_INVALID',
            message: expect.stringContaining('local columns'),
          }),
          expect.objectContaining({
            code: 'COLLECTION_PHYSICAL_REFERENCE_INVALID',
            message: expect.stringContaining('does not map'),
          }),
        ]),
      }),
    );
  });
});

function physicalCollection(
  overrides: Partial<PhysicalCollectionSchema> = {},
): PhysicalCollectionSchema {
  return {
    schema: 'public',
    tableName: 'orders',
    kind: 'table',
    columns: [],
    uniqueConstraints: [],
    indexes: [],
    foreignKeys: [],
    checkConstraints: [],
    inspection: inspection(),
    ...overrides,
  };
}

describe('json Field defaults', () => {
  it('decodes a json column default into the document the Builder was given', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'settings',
        columns: [
          column('id', 1),
          column('options', 2, {
            dataType: 'json',
            nativeType: 'json',
            nullable: false,
            default: {
              expression: `'{"storage":"local"}'`,
              value: '{"storage":"local"}',
            },
          }),
          column('tags', 3, {
            dataType: 'json',
            nativeType: 'jsonb',
            default: { expression: `'[]'::jsonb`, value: '[]' },
          }),
          column('label', 4, {
            default: {
              expression: `'{"not":"json"}'`,
              value: '{"not":"json"}',
            },
          }),
        ],
      }),
      context: emptyContext(),
    });

    const field = (name: string) =>
      result.collection.fields?.find((entry) => entry.name === name);
    expect(field('options')).toMatchObject({
      type: 'json',
      defaultValue: { storage: 'local' },
      db: { defaultExpression: `'{"storage":"local"}'` },
    });
    expect(field('tags')).toMatchObject({ defaultValue: [] });
    // A string column keeps its text: only json columns are decoded.
    expect(field('label')).toMatchObject({ defaultValue: '{"not":"json"}' });
    expect(result.warnings).toEqual([]);
  });

  it('decodes the default of a text column that metadata declares as json', () => {
    // MSSQL and Oracle have no native json type: the column is text and only
    // the Field metadata makes it a json Field.
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'settings',
        columns: [
          column('id', 1),
          column('options', 2, {
            dataType: 'text',
            nativeType: 'nvarchar(max)',
            default: {
              expression: `('{"enabled":true}')`,
              value: '{"enabled":true}',
            },
          }),
        ],
      }),
      metadata: {
        version: 1,
        name: 'settings',
        fields: { options: { type: 'json' } },
      },
      context: emptyContext(),
    });

    expect(
      result.collection.fields?.find((entry) => entry.name === 'options'),
    ).toMatchObject({ type: 'json', defaultValue: { enabled: true } });
    expect(result.warnings).toEqual([]);
  });

  it('keeps the physical text and warns when a json default is not valid JSON', () => {
    const result = resolveCollection({
      physical: physicalCollection({
        tableName: 'settings',
        columns: [
          column('id', 1),
          column('options', 2, {
            dataType: 'json',
            nativeType: 'json',
            default: { expression: `'{broken'`, value: '{broken' },
          }),
        ],
      }),
      context: emptyContext(),
    });

    const options = result.collection.fields?.find(
      (entry) => entry.name === 'options',
    );
    expect(options).not.toHaveProperty('defaultValue');
    expect(options?.db).toMatchObject({ defaultExpression: `'{broken'` });
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'COLLECTION_JSON_DEFAULT_INVALID',
        aspect: 'columns',
        path: ['fields', 'options', 'defaultValue'],
      }),
    ]);
  });
});

function column(
  columnName: string,
  ordinalPosition: number,
  overrides: Partial<PhysicalCollectionSchema['columns'][number]> = {},
): PhysicalCollectionSchema['columns'][number] {
  return {
    columnName,
    ordinalPosition,
    dataType: 'string',
    nativeType: 'varchar(255)',
    nullable: true,
    autoIncrement: false,
    ...overrides,
  };
}

function inspection(
  overrides: Partial<
    Record<PhysicalSchemaAspect, PhysicalSchemaInspectionStatus>
  > = {},
  warnings: PhysicalCollectionSchema['inspection']['warnings'] = [],
): PhysicalCollectionSchema['inspection'] {
  return {
    aspects: {
      columns: 'complete',
      primaryKey: 'complete',
      uniqueConstraints: 'complete',
      indexes: 'complete',
      foreignKeys: 'complete',
      checkConstraints: 'complete',
      comments: 'complete',
      viewDefinition: 'complete',
      ...overrides,
    },
    warnings,
  };
}

function emptyContext(): CollectionResolutionContext {
  return { resolvePhysicalCollection: () => undefined };
}
