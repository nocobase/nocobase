import { appendFile } from 'node:fs/promises';
import { expect } from 'vitest';
import type { Harness } from './harness.js';

type QuerySource = {
  on(event: 'query', listener: (event: { sql: string }) => void): void;
  off(event: 'query', listener: (event: { sql: string }) => void): void;
};
/** Warm metadata first, then count actual read requests without recording SQL parameters or credentials. */
export async function measureUIReadCost(
  h: Harness,
  kind: 'native' | 'runner',
  requests: Record<string, () => Response | Promise<Response>>,
): Promise<void> {
  const client = await h.database.connection().client<QuerySource>();
  for (const [name, request] of Object.entries(requests)) {
    expect((await request()).status).toBe(200);
    const statements: string[] = [];
    const listener = ({ sql }: { sql: string }) => {
      statements.push(sql);
    };
    client.on('query', listener);
    const start = performance.now();
    try {
      expect((await request()).status).toBe(200);
    } finally {
      client.off('query', listener);
    }
    const report = {
      kind,
      request: name,
      selects: statements.filter((sql) => /^\s*(select|with)\b/iu.test(sql))
        .length,
      writes: statements.filter((sql) =>
        /^\s*(insert|update|delete)\b/iu.test(sql),
      ).length,
      transactions: statements.filter((sql) => /^\s*begin\b/iu.test(sql))
        .length,
      locks: statements.filter((sql) => /for update|lock table/iu.test(sql))
        .length,
      statements: statements.length,
      elapsedMs: Number((performance.now() - start).toFixed(2)),
    };
    expect(report).toMatchObject({ writes: 0, transactions: 0, locks: 0 });
    if (process.env.PM481_D_COST_REPORT)
      await appendFile(
        process.env.PM481_D_COST_REPORT,
        JSON.stringify(report) + '\n',
      );
  }
}
