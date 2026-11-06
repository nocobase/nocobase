import { expect, it } from 'vitest';
import * as server from '../../server/index.js';
import { concurrencyServiceToken } from '../../server/tokens.js';
import manifest from '../../package.json' with { type: 'json' };

it('exposes the original token, contracts and implementation tools through server only', () => {
  expect(server.concurrencyServiceToken).toBe(concurrencyServiceToken);
  expect(Object.keys(server).sort()).toEqual(
    [
      'ConcurrencyServiceProvider',
      'ManagedLeaseRegistry',
      'startAcquire',
      'concurrencyServiceToken',
      'createSynchronousExecutor',
      'default',
      'encodeResourceKey',
      'validateConcurrencyConfig',
    ].sort(),
  );
  expect(server).not.toHaveProperty('MutexConcurrencyInstance');
  expect(Object.keys(manifest.exports).sort()).toEqual([
    './config',
    './package.json',
    './server',
  ]);
  expect(Object.keys(manifest.publishConfig.exports).sort()).toEqual(
    Object.keys(manifest.exports).sort(),
  );
  expect(manifest.exports['./server'].import).toBe('./server/index.ts');
  expect(manifest.publishConfig.exports['./server'].import).toBe(
    './dist/server/index.js',
  );
});
