import { describe, expect, it, vi } from 'vitest';
import { normalizePhysicalDataType } from '@nocobase/db';
import oracle from '../src/index.js';
import {
  OracleSchemaInspector,
  oracleTypes,
} from '../src/inspectors/oracle.js';

describe('oracle schema inspector', () => {
  it('is wired into the public driver descriptor', () => {
    expect(
      oracle.driver.createSchemaInspector?.({
        connectionName: 'main',
        config: {},
        resolveClient: async () => ({}) as never,
      } as never),
    ).toBeInstanceOf(OracleSchemaInspector);
  });

  it('reports the current Oracle user as the schema', async () => {
    const raw = vi.fn().mockResolvedValue([{ schema_name: 'APP' }]);
    const inspector = new OracleSchemaInspector({
      connectionName: 'main',
      resolveClient: async () => ({ raw }) as never,
    });

    await expect(inspector.listSchemas()).resolves.toEqual([
      { name: 'APP', default: true },
    ]);
  });

  it.each([
    ['VARCHAR2', 'USING_NLS_COMP', false],
    ['VARCHAR2', 'USING_NLS_SORT', false],
    ['NVARCHAR2', 'USING_NLS_SORT_CS', false],
    ['CHAR', null, false],
    ['NCHAR', 'BINARY', true],
    ['VARCHAR2', 'BINARY', true],
    ['NUMBER', null, true],
    [null, null, false],
  ] as const)(
    'preserves index comparison safety for %s with collation %s',
    async (dataType, collation, compatible) => {
      const raw = vi
        .fn()
        .mockResolvedValueOnce([{ schema_name: 'APP' }])
        .mockResolvedValueOnce([
          { schema_name: 'APP', table_name: 'ITEMS', object_kind: 'TABLE' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            index_name: 'ITEM_KEY',
            uniqueness: 'UNIQUE',
            index_type: 'NORMAL',
            valid: 1,
            column_position: 1,
            column_name: 'ID',
            data_type: dataType,
            collation,
            column_expression: null,
            descend: 'ASC',
            constraint_name: null,
            constraint_type: null,
          },
        ]);
      const inspector = new OracleSchemaInspector({
        connectionName: 'main',
        resolveClient: async () => ({ raw }) as never,
      });
      const collection = await inspector.getPhysicalCollection({
        tableName: 'ITEMS',
      });
      expect(collection?.indexes).toEqual([
        expect.objectContaining({
          name: 'ITEM_KEY',
          unique: true,
          valid: true,
          keys: [
            {
              columnName: 'ID',
              order: 'asc',
              ...(compatible ? {} : { columnEquality: false }),
            },
          ],
        }),
      ]);
    },
  );

  it('normalizes Oracle temporal and floating point types', () => {
    expect(
      normalizePhysicalDataType(oracleTypes, 'TIMESTAMP(9) WITH TIME ZONE'),
    ).toBe('datetimeTz');
    expect(normalizePhysicalDataType(oracleTypes, 'DATE')).toBe('datetime');
    expect(normalizePhysicalDataType(oracleTypes, 'FLOAT(126)')).toBe(
      'decimal',
    );
  });

  it.each([false, true])(
    'deduplicates shared index keys and preserves all constraints (reversed rows=%s)',
    async (reverse) => {
      const rows = [
        {
          column_position: 1,
          column_name: 'ID',
          data_type: 'VARCHAR2',
          collation: 'USING_NLS_COMP',
        },
        {
          column_position: 2,
          column_name: 'TENANT',
          data_type: 'NUMBER',
          collation: null,
        },
      ].flatMap((key) =>
        [
          { constraint_type: 'U', constraint_name: 'UNIQUE_KEY' },
          { constraint_type: 'P', constraint_name: 'PRIMARY_KEY' },
        ].map((constraint) => ({
          index_name: 'SHARED_INDEX',
          uniqueness: 'UNIQUE',
          index_type: 'NORMAL',
          valid: 1,
          column_expression: null,
          descend: 'ASC',
          ...key,
          ...constraint,
        })),
      );
      const raw = vi
        .fn()
        .mockResolvedValueOnce([{ schema_name: 'APP' }])
        .mockResolvedValueOnce([
          { schema_name: 'APP', table_name: 'ITEMS', object_kind: 'TABLE' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(reverse ? rows.reverse() : rows);
      const inspector = new OracleSchemaInspector({
        connectionName: 'main',
        resolveClient: async () => ({ raw }) as never,
      });
      const collection = await inspector.getPhysicalCollection({
        tableName: 'ITEMS',
      });
      expect(collection?.indexes).toEqual([
        expect.objectContaining({
          name: 'SHARED_INDEX',
          unique: true,
          valid: true,
          keys: [
            { columnName: 'ID', order: 'asc', columnEquality: false },
            { columnName: 'TENANT', order: 'asc' },
          ],
          backsConstraints: [
            { kind: 'primaryKey', name: 'PRIMARY_KEY' },
            { kind: 'unique', name: 'UNIQUE_KEY' },
          ],
        }),
      ]);
    },
  );
});
