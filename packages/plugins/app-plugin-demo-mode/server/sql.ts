/**
 * What one SQL text does, judged from the statement keywords alone: the guard has no parser and needs none, because it
 * only has to tell reads from writes and name the table a plain write targets.
 */
export interface SqlWrite {
  /** The statement keyword, lower-cased, such as `insert` or `create`. */
  readonly statement: string;
  /** The physical table a single-table write targets, lower-cased and without schema; absent for DDL and the like. */
  readonly table?: string;
}

/** Statements that never change data. Anything else counts as a write, so an unknown statement fails closed. */
const READ_STATEMENTS = new Set([
  'select',
  'values',
  'table',
  'show',
  'describe',
  'desc',
  'explain',
  'pragma',
  'set',
  'reset',
  'begin',
  'start',
  'commit',
  'end',
  'rollback',
  'savepoint',
  'release',
]);

const IDENTIFIER = String.raw`(?:"(?:[^"]|"")+"|\x60[^\x60]+\x60|\[[^\]]+\]|[\w$]+)`;
const QUALIFIED = String.raw`${IDENTIFIER}(?:\s*\.\s*${IDENTIFIER})*`;
const WRITE_TARGET = new RegExp(
  String.raw`\b(?:insert(?:\s+or\s+\w+)?\s+into|replace\s+into|merge\s+into|update(?:\s+or\s+\w+)?(?:\s+only)?|delete\s+from|truncate(?:\s+table)?)\s+(${QUALIFIED})`,
  'iu',
);
const WRITE_KEYWORD = /\b(?:insert|update|delete|merge|replace|upsert)\b/iu;

/**
 * Returns the writes in `sql`, one per statement that changes something; an empty list means the text only reads.
 * String literals and comments are removed first, so a keyword inside a value or a comment does not count.
 */
export function classifySql(sql: string): readonly SqlWrite[] {
  const writes: SqlWrite[] = [];
  for (const statement of splitStatements(stripLiterals(sql))) {
    const keyword = /^[\s(]*([a-z]+)/iu.exec(statement)?.[1]?.toLowerCase();
    if (!keyword) continue;
    // A common table expression reads unless one of its parts writes; PostgreSQL allows `WITH x AS (DELETE …)`.
    if (keyword === 'with') {
      if (WRITE_KEYWORD.test(statement))
        writes.push(describeWrite('with', statement));
      continue;
    }
    if (READ_STATEMENTS.has(keyword)) continue;
    writes.push(describeWrite(keyword, statement));
  }
  return writes;
}

function describeWrite(statement: string, sql: string): SqlWrite {
  const target = WRITE_TARGET.exec(sql)?.[1];
  const table = target ? lastIdentifier(target) : undefined;
  return table ? { statement, table } : { statement };
}

function lastIdentifier(qualified: string): string {
  const parts = qualified.match(new RegExp(IDENTIFIER, 'gu')) ?? [qualified];
  const last = parts[parts.length - 1] ?? qualified;
  const unquoted = /^["\x60[]/u.test(last)
    ? last.slice(1, -1).replaceAll('""', '"')
    : last;
  return unquoted.toLowerCase();
}

/** Replaces string literals with `''` and drops comments, keeping quoted identifiers, which name tables. */
function stripLiterals(sql: string): string {
  let result = '';
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];
    if (char === "'") {
      index += 1;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") index += 2;
        else if (sql[index] === "'") break;
        else index += 1;
      }
      index += 1;
      result += "''";
    } else if (char === '-' && next === '-') {
      while (index < sql.length && sql[index] !== '\n') index += 1;
    } else if (char === '/' && next === '*') {
      const end = sql.indexOf('*/', index + 2);
      index = end === -1 ? sql.length : end + 2;
      result += ' ';
    } else {
      result += char;
      index += 1;
    }
  }
  return result;
}

function splitStatements(sql: string): string[] {
  return sql.split(';').filter((statement) => statement.trim() !== '');
}
