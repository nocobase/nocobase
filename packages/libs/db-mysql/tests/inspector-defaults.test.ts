import { describe, expect, it } from 'vitest';
import { parseColumnDefault } from '@nocobase/db';
import {
  mysqlDefaultLiteral,
  mysqlReportsDeclaredDefaults,
} from '../src/inspectors/mysql.js';

const MYSQL = '8.4.6';
const MARIADB = '11.8.9-MariaDB-ubu2404';

describe('mysqlDefaultLiteral', () => {
  it('reduces an expression default to the SQL literal the shared parser reads', () => {
    const literal = mysqlDefaultLiteral({
      column_default: `_utf8mb4\\'{"enabled":true}\\'`,
      extra: 'DEFAULT_GENERATED',
      data_type: 'text',
      server_version: MYSQL,
    });
    expect(literal).toBe(`'{"enabled":true}'`);
    expect(parseColumnDefault(literal)).toEqual({
      expression: `'{"enabled":true}'`,
      value: '{"enabled":true}',
    });
  });

  it('undoes both escaping layers of a text default, as information_schema reports them', () => {
    // A default written as ('it\'s here') is stored as _utf8mb4'it\'s here', which information_schema escapes again.
    const quoted = mysqlDefaultLiteral({
      column_default: String.raw`_utf8mb4\'it\\\'s here\'`,
      extra: 'DEFAULT_GENERATED',
      data_type: 'text',
      server_version: MYSQL,
    });
    expect(quoted).toBe(`'it''s here'`);
    expect(parseColumnDefault(quoted)).toMatchObject({ value: "it's here" });

    // ('C:\\temp') holds a single backslash: C:\temp.
    const backslash = mysqlDefaultLiteral({
      column_default: String.raw`_utf8mb4\'C:\\\\temp\'`,
      extra: 'DEFAULT_GENERATED',
      data_type: 'text',
      server_version: MYSQL,
    });
    expect(parseColumnDefault(backslash)).toMatchObject({
      value: String.raw`C:\temp`,
    });

    expect(
      parseColumnDefault(
        mysqlDefaultLiteral({
          column_default: String.raw`_utf8mb4\'\'`,
          extra: 'DEFAULT_GENERATED',
          data_type: 'text',
          server_version: MYSQL,
        }),
      ),
    ).toMatchObject({ value: '' });
  });

  it('quotes the bare literal default of a character, enum or temporal column', () => {
    // information_schema reports `default 'it''s \\ x'` as the bare text it's \ x, neither quoted nor escaped.
    for (const [dataType, raw] of [
      ['varchar', 'draft'],
      ['char', 'NULL'],
      ['varchar', '42'],
      ['varchar', String.raw`it's \ x`],
      ['varchar', ''],
      ['varchar', 'CURRENT_TIMESTAMP'],
      ['enum', 'paid'],
      ['set', 'a,b'],
      ['date', '2020-01-02'],
      ['time', '10:00:00'],
    ] as const) {
      expect(
        parseColumnDefault(
          mysqlDefaultLiteral({
            column_default: raw,
            extra: '',
            data_type: dataType,
            server_version: MYSQL,
          }),
        ),
        `${dataType} ${raw}`,
      ).toMatchObject({ value: raw });
    }
  });

  it('leaves numeric literals, expressions and non-string values alone', () => {
    for (const [dataType, raw, value] of [
      ['int', '0', 0],
      ['decimal', '1.50', 1.5],
      ['tinyint', '1', 1],
    ] as const) {
      expect(
        parseColumnDefault(
          mysqlDefaultLiteral({
            column_default: raw,
            extra: '',
            data_type: dataType,
            server_version: MYSQL,
          }),
        ),
      ).toEqual({ expression: raw, value });
    }
    for (const [dataType, raw, extra] of [
      ['datetime', 'CURRENT_TIMESTAMP(3)', 'DEFAULT_GENERATED'],
      ['timestamp', 'CURRENT_TIMESTAMP', ''],
      ['bit', "b'1'", ''],
      ['varbinary', '0x6162', ''],
    ] as const) {
      const literal = mysqlDefaultLiteral({
        column_default: raw,
        extra,
        data_type: dataType,
        server_version: MYSQL,
      });
      expect(literal).toBe(raw);
      expect(parseColumnDefault(literal)).not.toHaveProperty('value');
    }
    expect(
      mysqlDefaultLiteral({
        column_default: null,
        extra: '',
        data_type: 'int',
        server_version: MYSQL,
      }),
    ).toBeNull();
    expect(
      mysqlDefaultLiteral({
        column_default: `_utf8mb4\\'x\\'`,
        extra: 'auto_increment',
        data_type: 'int',
        server_version: MYSQL,
      }),
    ).toBe(`_utf8mb4\\'x\\'`);
  });

  it('treats any temporal default that does not start like a date or time as an expression', () => {
    for (const [dataType, raw] of [
      ['datetime', 'now()'],
      ['date', 'curdate()'],
      ['datetime', 'current_timestamp(6)'],
    ] as const) {
      expect(
        mysqlDefaultLiteral({
          column_default: raw,
          extra: '',
          data_type: dataType,
          server_version: MYSQL,
        }),
      ).toBe(raw);
    }
    expect(
      parseColumnDefault(
        mysqlDefaultLiteral({
          column_default: '-01:30:00',
          extra: '',
          data_type: 'time',
          server_version: MYSQL,
        }),
      ),
    ).toMatchObject({ value: '-01:30:00' });
  });

  it('passes MariaDB defaults through, as it reports them in the form they were declared', () => {
    // What MariaDB 11.8 reports in information_schema.columns.column_default, with EXTRA empty throughout.
    for (const [dataType, raw, expected] of [
      ['varchar', "'draft'", { value: 'draft' }],
      ['varchar', "'it''s'", { value: "it's" }],
      ['varchar', String.raw`'back\\slash'`, { value: String.raw`back\slash` }],
      ['text', String.raw`'it\'s here'`, { value: "it's here" }],
      ['varchar', "'NULL'", { value: 'NULL' }],
      ['varchar', "'42'", { value: '42' }],
      ['enum', "'b'", { value: 'b' }],
      ['date', "'2026-01-01'", { value: '2026-01-01' }],
      ['text', "'hi'", { value: 'hi' }],
      ['int', '5', { value: 5 }],
    ] as const) {
      expect(
        parseColumnDefault(
          mysqlDefaultLiteral({
            column_default: raw,
            extra: '',
            data_type: dataType,
            server_version: MARIADB,
          }),
        ),
        `${dataType} ${raw}`,
      ).toMatchObject(expected);
    }
    for (const [dataType, raw] of [
      ['varchar', 'uuid()'],
      ['datetime', 'current_timestamp(3)'],
    ] as const) {
      expect(
        parseColumnDefault(
          mysqlDefaultLiteral({
            column_default: raw,
            extra: '',
            data_type: dataType,
            server_version: MARIADB,
          }),
        ),
      ).toEqual({ expression: raw });
    }
    // A nullable column declared without a default reports the bare word NULL, where MySQL reports SQL NULL.
    expect(
      mysqlDefaultLiteral({
        column_default: 'NULL',
        extra: '',
        data_type: 'varchar',
        server_version: MARIADB,
      }),
    ).toBeNull();
  });
});

describe('mysqlReportsDeclaredDefaults', () => {
  it('recognizes MariaDB from 10.2.7, behind the replication prefix too', () => {
    const read = (versions: readonly string[]): Record<string, boolean> =>
      Object.fromEntries(
        versions.map((version) => [
          version,
          mysqlReportsDeclaredDefaults(version),
        ]),
      );
    expect(
      read([
        '11.8.9-MariaDB-ubu2404',
        '10.2.7-MariaDB',
        '10.6.12-MariaDB-log',
        '5.5.5-10.11.6-MariaDB-0+deb12u1',
      ]),
    ).toEqual({
      '11.8.9-MariaDB-ubu2404': true,
      '10.2.7-MariaDB': true,
      '10.6.12-MariaDB-log': true,
      '5.5.5-10.11.6-MariaDB-0+deb12u1': true,
    });
    expect(
      read([
        '8.4.6',
        '5.7.44-log',
        '10.2.6-MariaDB',
        '10.1.48-MariaDB',
        '5.7.25-OceanBase_CE-v4.4.2.1',
      ]),
    ).toEqual({
      '8.4.6': false,
      '5.7.44-log': false,
      '10.2.6-MariaDB': false,
      '10.1.48-MariaDB': false,
      '5.7.25-OceanBase_CE-v4.4.2.1': false,
    });
  });
});
