import { createReadStream } from 'node:fs';
import { BackupError } from './errors.js';
import type { BackupReader, BackupTable } from './types.js';

const identifier = /`(?:[^`]|``)*`/;
const tableStructure = new RegExp(
  '^-- Table structure for table (' + identifier.source + ')$',
);
const dataSection = new RegExp(
  '^-- Dumping data for table (' + identifier.source + ')$',
);
const insert = new RegExp(
  '^INSERT INTO (' +
    identifier.source +
    ') \\((' +
    identifier.source +
    '(?:,\\s*' +
    identifier.source +
    ')*)\\) VALUES ',
);
const decodeIdentifier = (value: string) =>
  value.slice(1, -1).replaceAll('``', '`');
const mysqlEscapes = new Map([
  ['0', '\0'],
  ['b', '\b'],
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
  ['Z', '\x1a'],
]);

interface Range {
  start: number;
  end: number;
}

async function* dumpLines(
  file: string,
  range?: Range,
): AsyncGenerator<{ line: string; start: number; end: number }> {
  const stream = createReadStream(file, range);
  let parts: Buffer[] = [];
  let offset = range?.start ?? 0;
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    let start = 0;
    let newline = chunk.indexOf(10, start);
    while (newline !== -1) {
      parts.push(chunk.subarray(start, newline));
      const bytes = Buffer.concat(parts);
      const next = offset + bytes.length + 1;
      const length = bytes.at(-1) === 13 ? bytes.length - 1 : bytes.length;
      yield {
        line: bytes.toString('utf8', 0, length),
        start: offset,
        end: next - 1,
      };
      offset = next;
      parts = [];
      start = newline + 1;
      newline = chunk.indexOf(10, start);
    }
    if (start < chunk.length) parts.push(chunk.subarray(start));
  }
  if (parts.length) {
    const bytes = Buffer.concat(parts);
    yield {
      line: bytes.toString('utf8'),
      start: offset,
      end: offset + bytes.length - 1,
    };
  }
}

function invalidDump(): BackupError {
  return new BackupError(
    'BACKUP_MYSQL_SNAPSHOT_INVALID',
    'A MySQL dump cannot be read as a database snapshot.',
  );
}

/** Parses the INSERT literal syntax emitted by mysqldump/mariadb-dump with --complete-insert. */
class Values {
  private position = 0;
  constructor(private readonly sql: string) {}

  consume(symbol: string): boolean {
    while (this.sql[this.position] === ' ') this.position += 1;
    if (this.sql[this.position] !== symbol) return false;
    this.position += 1;
    return true;
  }

  expect(symbol: string): void {
    if (!this.consume(symbol)) throw invalidDump();
  }

  literal(selected: boolean): string | null {
    let position = this.position;
    while (this.sql[position] === ' ') position += 1;
    const start = position;
    // An introducer may prefix a string or hexadecimal literal.
    if (this.sql[position] === '_') {
      while (/[\w]/.test(this.sql[position] ?? '')) position += 1;
      while (this.sql[position] === ' ') position += 1;
    }
    const valueStart = position;
    if (this.sql[position] === "'") {
      let value = '';
      let segment = ++position;
      while (position < this.sql.length) {
        const char = this.sql[position++];
        if (char === '\\') {
          if (position === this.sql.length) throw invalidDump();
          const escape = this.sql[position++];
          if (selected)
            value +=
              this.sql.slice(segment, position - 2) +
              (mysqlEscapes.get(escape) ?? escape);
          segment = position;
        } else if (char === "'") {
          if (this.sql[position] === "'") {
            if (selected) value += this.sql.slice(segment, position - 1) + "'";
            segment = ++position;
          } else {
            this.position = position;
            return selected
              ? value + this.sql.slice(segment, position - 1)
              : null;
          }
        }
      }
      throw invalidDump();
    }
    while (
      position < this.sql.length &&
      this.sql[position] !== ',' &&
      this.sql[position] !== ')'
    )
      position += 1;
    this.position = position;
    if (valueStart === position) throw invalidDump();
    if (!selected) return null;
    const token = this.sql.slice(valueStart, position).trim();
    if (token === 'NULL') return null;
    if (/^0x(?:[\da-f]{2})*$/i.test(token))
      return Buffer.from(token.slice(2), 'hex').toString('utf8');
    if (
      !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token) ||
      start !== valueStart
    )
      throw invalidDump();
    return token;
  }
}

function* insertRows(
  line: string,
  table: string,
  columns: readonly string[],
): Generator<Record<string, unknown>> {
  const matches = insert.exec(line);
  if (!matches || decodeIdentifier(matches[1]) !== table) throw invalidDump();
  const names = [
    ...matches[2].matchAll(new RegExp(identifier.source, 'g')),
  ].map(([value]) => decodeIdentifier(value));
  const wanted = new Set(columns);
  if (columns.some((column) => !names.includes(column))) throw invalidDump();
  const literals = new Values(line.slice(matches[0].length));
  do {
    literals.expect('(');
    const values: [string, unknown][] = [];
    for (const [index, name] of names.entries()) {
      if (index) literals.expect(',');
      const selected = wanted.has(name);
      const value = literals.literal(selected);
      if (selected) values.push([name, value]);
    }
    literals.expect(')');
    yield Object.fromEntries(values);
  } while (literals.consume(','));
  literals.expect(';');
}

/** Index data sections once, then seek to each requested table instead of rescanning the dump. */
export async function mysqlDumpReader(
  file: string,
  database: string,
): Promise<BackupReader> {
  const tables = new Map<string, Range | undefined>();
  let current: string | undefined;
  let inInsert = false;
  for await (const { line, start, end } of dumpLines(file)) {
    const definition = tableStructure.exec(line);
    if (definition) tables.set(decodeIdentifier(definition[1]), undefined);
    const data = dataSection.exec(line);
    if (data) current = decodeIdentifier(data[1]);
    if (line === 'UNLOCK TABLES;') current = undefined;
    if (
      current !== undefined &&
      (inInsert || line.startsWith('INSERT INTO '))
    ) {
      inInsert = !line.endsWith(';');
      const range = tables.get(current);
      tables.set(current, { start: range?.start ?? start, end });
    }
  }
  function checkSchema(table: BackupTable): void {
    if (table.schema && table.schema !== database) {
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A MySQL backup only contains the configured database.',
      );
    }
  }
  return {
    async hasTable(table) {
      checkSchema(table);
      return tables.has(table.name);
    },
    async *readRows(table, columns) {
      checkSchema(table);
      if (!columns.length) return;
      if (!tables.has(table.name)) throw invalidDump();
      const range = tables.get(table.name);
      if (!range) return;
      let statement: string[] = [];
      for await (const { line } of dumpLines(file, range)) {
        if (!statement.length && !line.startsWith('INSERT INTO ')) continue;
        statement.push(line);
        if (line.endsWith(';')) {
          yield* insertRows(statement.join(' '), table.name, columns);
          statement = [];
        }
      }
      if (statement.length) throw invalidDump();
    },
  };
}
