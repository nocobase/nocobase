/** Small RFC 4180 reader: quoted commas, newlines and escaped quotes are data. */
export function readCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closed = false;
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw new Error('INVALID_CSV');
      quoted = true;
      continue;
    }
    if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell);
      cell = '';
      closed = false;
      if (c !== ',') {
        if (c === '\r' && source[i + 1] === '\n') i++;
        if (row.some((v) => v !== '')) rows.push(row);
        row = [];
      }
      continue;
    }
    if (closed) throw new Error('INVALID_CSV');
    cell += c;
  }
  if (quoted) throw new Error('INVALID_CSV');
  row.push(cell);
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}
/** Spreadsheet formula protection applies after whitespace, with ordinary RFC quoting. */
export function writeCsv(rows: readonly (readonly unknown[])[]): string {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s =
            v == null
              ? ''
              : typeof v === 'string'
                ? v
                : typeof v === 'number' ||
                    typeof v === 'boolean' ||
                    typeof v === 'bigint'
                  ? String(v)
                  : '';
          if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(','),
    )
    .join('\r\n');
}
