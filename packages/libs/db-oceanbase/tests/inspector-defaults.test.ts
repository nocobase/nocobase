import { describe, expect, it } from 'vitest';
import { parseColumnDefault } from '@nocobase/db';
import {
  oceanbaseDefaultLiteral,
  oceanbaseExpressionDefaultColumns,
} from '../src/inspectors/mysql.js';

describe('oceanbaseDefaultLiteral', () => {
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
      ['date', '2020-01-02'],
    ] as const) {
      expect(
        parseColumnDefault(
          oceanbaseDefaultLiteral(
            { column_default: raw, data_type: dataType },
            false,
          ),
        ),
        `${dataType} ${raw}`,
      ).toMatchObject({ value: raw });
    }
  });

  it('leaves numeric literals, CURRENT_TIMESTAMP and non-string values alone', () => {
    expect(
      parseColumnDefault(
        oceanbaseDefaultLiteral(
          { column_default: '1.50', data_type: 'decimal' },
          false,
        ),
      ),
    ).toEqual({ expression: '1.50', value: 1.5 });
    for (const dataType of ['datetime', 'timestamp']) {
      const literal = oceanbaseDefaultLiteral(
        { column_default: 'CURRENT_TIMESTAMP', data_type: dataType },
        false,
      );
      expect(literal).toBe('CURRENT_TIMESTAMP');
      expect(parseColumnDefault(literal)).not.toHaveProperty('value');
    }
    expect(
      oceanbaseDefaultLiteral(
        { column_default: null, data_type: 'int' },
        false,
      ),
    ).toBeNull();
  });

  it('leaves an expression default alone, as the DDL declared it', () => {
    for (const [dataType, raw] of [
      ['varchar', 'uuid()'],
      ['varchar', "concat('a','b')"],
      ['enum', "lower('B')"],
    ] as const) {
      expect(
        parseColumnDefault(
          oceanbaseDefaultLiteral(
            { column_default: raw, data_type: dataType },
            true,
          ),
        ),
      ).toEqual({ expression: raw });
    }
    // Without the DDL a temporal function default still reads as an expression: no literal starts with a letter.
    expect(
      oceanbaseDefaultLiteral(
        { column_default: 'curdate()', data_type: 'date' },
        false,
      ),
    ).toBe('curdate()');
  });
});

describe('oceanbaseExpressionDefaultColumns', () => {
  it('finds the columns declared with DEFAULT (…) in what SHOW CREATE TABLE returns', () => {
    // As OceanBase 4.4 returns it, quotes inside string literals backslash-escaped.
    const ddl = [
      'CREATE TABLE `we``ird` (',
      "  `a``b` varchar(40) DEFAULT 'it\\'s DEFAULT (x)' COMMENT 'has DEFAULT (y)',",
      "  `e` enum('DEFAULT (z)','b') DEFAULT 'b',",
      "  `g` varchar(40) GENERATED ALWAYS AS (concat(`e`,'x')) VIRTUAL,",
      "  `n` varchar(40) NOT NULL DEFAULT (lower('ABC')),",
      '  `u` varchar(40) DEFAULT (uuid()),',
      "  `l` varchar(40) DEFAULT 'uuid()',",
      "  `bs` varchar(40) DEFAULT 'back\\\\slash',",
      "  `emp` varchar(40) DEFAULT '',",
      '  `ts` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),',
      '  PRIMARY KEY (`n`)',
      ') ORGANIZATION INDEX DEFAULT CHARSET = utf8mb4',
    ].join('\n');
    expect([...oceanbaseExpressionDefaultColumns(ddl)].sort()).toEqual([
      'n',
      'u',
    ]);
  });
});
