import type { Knex } from 'knex';
import type { FilterConditionNode, FilterLiteral } from '@nocobase/db';

export function compileMysqlJsonCondition(
  client: Knex,
  column: string,
  node: FilterConditionNode,
): Knex.Raw {
  if (node.operator === '$jsonDbNull')
    return client.raw('?? is null', [column]);
  const path =
    '$' +
    (node.jsonPath ?? [])
      .map((part) =>
        typeof part === 'number' ? `[${part}]` : `.${JSON.stringify(part)}`,
      )
      .join('');
  const source = client.raw('json_extract(??, ?)', [column, path]);
  const type = client.raw('lower(json_type(?))', [source]);
  const jsonNull = client.raw("? = 'null'", [type]);
  if (node.operator === '$jsonNull') return jsonNull;
  if (node.operator === '$jsonAnyNull')
    return client.raw('(?? is null or ?)', [column, jsonNull]);
  if (node.operator === '$jsonEmpty' || node.operator === '$jsonNotEmpty') {
    const length = client.raw('json_length(?)', [source]);
    return client.raw(
      `(? = 'array' and ? ${node.operator === '$jsonEmpty' ? '=' : '>'} 0)`,
      [type, length],
    );
  }
  // MariaDB stores JSON as text and has no `cast(… as json)`, so the MySQL form `? = cast(? as json)` does not parse
  // there, and comparing the text would make object key order matter. Both servers compare array elements as JSON
  // values in json_overlaps — object keys in any order, array elements in order, `1` neither `"1"` nor `true` — so each
  // side is wrapped in a one-element array to compare them as values. MariaDB compares two array elements that are
  // themselves arrays only as far as the second one goes, so `[1, 2]` overlaps `[1]` and every array overlaps `[]`;
  // checking the overlap in both directions makes it equality on both servers. A path that is missing yields SQL NULL,
  // which json_array would turn into a JSON null, so it is excluded first.
  const present = client.raw('? is not null', [source]);
  const same = (value: FilterLiteral): Knex.Raw => {
    const actual = client.raw('json_array(?)', [source]);
    const expected = JSON.stringify([value]);
    return client.raw('(json_overlaps(?, ?) and json_overlaps(?, ?))', [
      actual,
      expected,
      expected,
      actual,
    ]);
  };
  if (node.operator === '$jsonEq')
    return client.raw('(? and ?)', [
      present,
      same(node.value as FilterLiteral),
    ]);
  if (node.operator === '$jsonNe')
    return client.raw('(? and not ?)', [
      present,
      same(node.value as FilterLiteral),
    ]);
  const has = (value: FilterLiteral): Knex.Raw =>
    client.raw("(? = 'array' and json_overlaps(?, ?))", [
      type,
      source,
      JSON.stringify([value]),
    ]);
  if (node.operator === '$jsonHas') return has(node.value as FilterLiteral);
  const values = node.value as readonly FilterLiteral[];
  const all = node.operator === '$jsonHasEvery';
  if (values.length === 0)
    return client.raw(all ? "? = 'array'" : '1 = 0', all ? [type] : []);
  return client.raw(
    `(${values.map(() => '?').join(all ? ' and ' : ' or ')})`,
    values.map(has),
  );
}
