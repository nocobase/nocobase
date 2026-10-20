import type { Row } from '../types.js';
import type { NamingStrategy } from '../../naming/strategy.js';

export interface ResultMap {
  hidden?: Set<string>;
  explicit: Map<string, string>;
  mapUnmatchedColumns: boolean;
  scalarDecoders?: Map<string, (value: unknown) => unknown>;
}

export function prepareResultRowMapper(
  resultMap: ResultMap,
  naming: NamingStrategy,
): (row: Row) => Row {
  const shouldCamelCaseUnmatched =
    resultMap.mapUnmatchedColumns && isUnderscoredNaming(naming);
  // Compile each column's mapping once per execution, including columns from
  // SELECT *. Keep the row's own keys so custom drivers can return sparse rows.
  const columns = new Map<
    string,
    { name: string; decode?: (value: unknown) => unknown } | null
  >();
  return (row) => {
    const result: Row = {};
    for (const key of Object.keys(row)) {
      let column = columns.get(key);
      if (column === undefined) {
        column = resultMap.hidden?.has(key)
          ? null
          : {
              name:
                resultMap.explicit.get(key) ??
                (shouldCamelCaseUnmatched ? camelCase(key) : key),
              decode: resultMap.scalarDecoders?.get(key),
            };
        columns.set(key, column);
      }
      if (column === null) continue;
      const value = column.decode ? column.decode(row[key]) : row[key];
      // Match Object.fromEntries: __proto__ is a data column, never a setter.
      if (column.name === '__proto__') {
        Object.defineProperty(result, column.name, {
          value,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      } else {
        result[column.name] = value;
      }
    }
    return result;
  };
}

function isUnderscoredNaming(naming: NamingStrategy): boolean {
  return naming.fieldToColumnName('createdAt') === 'created_at';
}

function camelCase(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}
