import knex from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../src/index.js';

function createRuntime() {
  const client = knex({ client: 'mysql2' });
  const runtime = mysql.driver.createRuntime!({
    dialect: 'mysql',
    sourceConfig: {} as never,
    config: {} as never,
    capabilities: mysql.driver.capabilities as never,
    getClient: () => client,
    resolveClient: async () => client,
  });
  return { client, runtime };
}

describe('mysql runtime strategy', () => {
  it('declares native numeric and temporal schema behavior', () => {
    const { client, runtime } = createRuntime();
    expect(runtime.numeric!.hasNativeResults).toBe(true);
    expect(
      runtime.schema!.columnType!({
        column: { type: 'datetimeTz' } as never,
        tablePrimaryKey: false,
        altering: false,
      }),
    ).toBe('datetime(3)');
    expect(
      runtime.schema!.columnType!({
        column: { type: 'time' } as never,
        tablePrimaryKey: false,
        altering: false,
      }),
    ).toBe('time(3)');
    expect(runtime.repository!.encodeBoolean!({} as never, true)).toBe(1);
    expect(
      runtime.repository!.temporalBinding!({
        client,
        field: {
          type: 'datetimeTz',
          db: { nativeType: 'timestamp' },
        } as never,
        value: '2026-09-06T12:30:00.000Z',
      }),
    ).toMatchObject({ sql: expect.stringContaining('convert_tz') });
  });

  it('gives a text column with a default the expression form, the only one MySQL takes', () => {
    const { client, runtime } = createRuntime();
    const schema = runtime.schema!;
    const describe = (column: object) => ({
      type: schema.columnType!({
        column: column as never,
        tablePrimaryKey: false,
        altering: false,
      }),
      default: schema.columnDefault!({
        client,
        column: column as never,
        altering: false,
      })?.toQuery(),
    });

    expect(describe({ type: 'text', defaultValue: "it's" })).toEqual({
      type: 'text',
      default: "('it\\'s')",
    });
    expect(
      describe({
        type: 'text',
        defaultValue: '',
        db: { nativeType: 'mediumtext' },
      }),
    ).toEqual({ type: 'mediumtext', default: "('')" });
    for (const column of [
      { type: 'text' },
      { type: 'text', defaultValue: null },
      { type: 'string', defaultValue: 'draft' },
    ])
      expect(describe(column)).toEqual({ type: undefined, default: undefined });
  });

  it('enforces MySQL TIMESTAMP range and renders UTC temporal projections', () => {
    const { client, runtime } = createRuntime();
    const field = {
      type: 'datetimeTz',
      db: { nativeType: 'timestamp' },
    } as never;
    expect(() =>
      runtime.repository!.temporalBinding!({
        client,
        field,
        value: '1969-12-31T23:59:59.000Z',
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_MUTATION' }));
    expect(() =>
      runtime.repository!.temporalBinding!({
        client,
        field,
        value: '2038-01-19T03:14:08.000Z',
      }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_MUTATION' }));

    const projection = runtime.repository!.temporalProjection!({
      client,
      field,
      reference: 'occurred_at',
    });
    expect(projection.toQuery()).toContain('date_format');
    expect(projection.toQuery()).toContain('convert_tz');
  });

  it('compiles JSON conditions and owns connection defaults and identity', () => {
    const { client, runtime } = createRuntime();
    const json = runtime.repository!.compileJsonCondition!({
      client,
      column: 'payload',
      node: {
        operator: '$jsonEq',
        jsonPath: ['profile', 'name'],
        value: 'Ada',
      } as never,
    });
    expect(json.toQuery()).toContain('json_extract');

    expect(
      mysql.driver.normalizeConnection?.(
        { dialect: 'mysql', database: 'app' } as never,
        {},
      ),
    ).toMatchObject({
      host: '127.0.0.1',
      port: 3306,
      database: 'app',
      username: 'root',
      charset: 'utf8mb4',
    });
    expect(
      mysql.driver.normalizeConnection?.(
        { dialect: 'mysql', socketPath: '/tmp/mysql.sock' } as never,
        {},
      ),
    ).not.toHaveProperty('host');
    expect(
      mysql.driver.resolveOwnershipTarget?.({
        dialect: 'mysql',
        socketPath: '/tmp/mysql.sock',
        database: 'app',
      }),
    ).toEqual([
      'mysql',
      undefined,
      undefined,
      '/tmp/mysql.sock',
      'app',
      undefined,
    ]);
  });
});

it('follows the connection when the driver returns JSON as text', () => {
  const form = (connection: unknown): unknown =>
    mysql.driver.createRuntime!({
      dialect: 'mysql',
      sourceConfig: {} as never,
      config: { connection } as never,
      capabilities: mysql.driver.capabilities as never,
      getClient: () => undefined as never,
      resolveClient: async () => undefined as never,
    }).repository?.jsonResults;

  // mysql2 parses a json column by default; `jsonStrings` turns that off and
  // reaches the driver through `driverOptions`.
  expect(form({})).toBe('parsed');
  expect(form({ jsonStrings: false })).toBe('parsed');
  expect(form({ jsonStrings: true })).toBe('text');
});
