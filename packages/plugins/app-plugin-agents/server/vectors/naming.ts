/** Names the SQL stores share: an index's table, and the metadata keys a filter may name. */

/** The table of an index. */
export function tableOf(index: string): string {
  const name = index.toLowerCase().replace(/[^a-z0-9_]/gu, '_');
  if (!name || name.length > 59)
    throw new Error(`The vector index name ${index} is not usable.`);
  return `agv_${name}`;
}

/** A metadata key a filter may name, as it is: only plain keys are taken, so it can be written into SQL. */
export function keyOf(key: string): string {
  if (!/^[A-Za-z0-9_.-]{1,64}$/u.test(key))
    throw new Error(`The metadata key ${key} cannot be filtered on.`);
  return key;
}
