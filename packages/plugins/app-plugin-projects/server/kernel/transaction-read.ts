import type { DatabaseConnection } from '@nocobase/db';

/** Memoize a read only until its connection commits or rolls back. Root reads stay uncached. */
export function transactionRead<T>() {
  const transactions = new WeakMap<
    DatabaseConnection,
    Map<string, Promise<T>>
  >();
  return (
    conn: DatabaseConnection,
    key: string,
    read: () => Promise<T>,
  ): Promise<T> => {
    let values = transactions.get(conn);
    if (!values) {
      values = new Map();
      transactions.set(conn, values);
      const clear = () => {
        transactions.delete(conn);
      };
      // Outside a transaction afterCommit runs immediately, removing this entry.
      conn.afterCommit(clear);
      if (!transactions.has(conn)) return read();
      conn.afterRollback(clear);
    }
    const existing = values.get(key);
    if (existing) return existing;
    const pending = read();
    values.set(key, pending);
    void pending.catch(() => {
      if (values.get(key) === pending) values.delete(key);
    });
    return pending;
  };
}
