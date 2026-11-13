import type { DownloadTokenRecord, DownloadTokenStore } from '../src/index.js';
/** Test-only persistence with atomic compare-and-set and snapshot reads, without a database dependency. */
export function memoryTokens() {
  const records = new Map<string, DownloadTokenRecord>();
  const store: DownloadTokenStore = {
    transaction: async (fn) =>
      fn({
        insert: async (record) => {
          records.set(record.id, { ...record });
        },
        findByHash: async (hash) => {
          const row = [...records.values()].find((r) => r.tokenHash === hash);
          return row ? { ...row } : undefined;
        },
        updateIfDownloads: async (id, expected, values) => {
          const row = records.get(id);
          if (!row || row.downloads !== expected) return false;
          records.set(id, { ...row, ...values });
          return true;
        },
      }),
  };
  return { records, store };
}
