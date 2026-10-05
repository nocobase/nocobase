import { describe, expect, it } from 'vitest';
import { parseColumnDefault } from '@nocobase/db';
import { mysqlDefaultLiteral } from '../src/inspectors/mysql.js';

describe('mysqlDefaultLiteral', () => {
  it('reduces an expression default to the SQL literal the shared parser reads', () => {
    const literal = mysqlDefaultLiteral({
      column_default: `_utf8mb4\\'{"enabled":true}\\'`,
      extra: 'DEFAULT_GENERATED',
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
    });
    expect(quoted).toBe(`'it''s here'`);
    expect(parseColumnDefault(quoted)).toMatchObject({ value: "it's here" });

    // ('C:\\temp') holds a single backslash: C:\temp.
    const backslash = mysqlDefaultLiteral({
      column_default: String.raw`_utf8mb4\'C:\\\\temp\'`,
      extra: 'DEFAULT_GENERATED',
    });
    expect(parseColumnDefault(backslash)).toMatchObject({
      value: String.raw`C:\temp`,
    });

    expect(
      parseColumnDefault(
        mysqlDefaultLiteral({
          column_default: String.raw`_utf8mb4\'\'`,
          extra: 'DEFAULT_GENERATED',
        }),
      ),
    ).toMatchObject({ value: '' });
  });

  it('leaves literal defaults and non-string values alone', () => {
    expect(mysqlDefaultLiteral({ column_default: 'pending', extra: '' })).toBe(
      'pending',
    );
    expect(mysqlDefaultLiteral({ column_default: null, extra: '' })).toBeNull();
    expect(
      mysqlDefaultLiteral({
        column_default: `_utf8mb4\\'x\\'`,
        extra: 'auto_increment',
      }),
    ).toBe(`_utf8mb4\\'x\\'`);
  });
});
