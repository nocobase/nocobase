import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const coreRoot = dirname(
  dirname(fileURLToPath(import.meta.resolve('@nocobase/concurrency'))),
);
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const coreMetadata = JSON.parse(
  readFileSync(join(coreRoot, 'package.json'), 'utf8'),
);
if (!process.argv[2] || !process.argv[3])
  throw new Error(
    'Usage: node tests/verify-packed.mjs <artifact-directory> <host-cohort.json>',
  );
const artifacts = resolve(process.argv[2]);
const cohort = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'));
for (const peer of Object.keys(metadata.peerDependencies)) {
  if (typeof cohort[peer] !== 'string')
    throw new Error('Missing fixed host peer tarball: ' + peer);
}
mkdirSync(artifacts, { recursive: true });
for (const [directory, manifest] of [
  [root, metadata],
  [coreRoot, coreMetadata],
]) {
  const tarball = join(
    artifacts,
    `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
  );
  execFileSync('pnpm', ['pack', '--out', tarball], {
    cwd: directory,
    stdio: 'inherit',
  });
  cohort[manifest.name] = tarball;
}
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-plugin-consumer-'));
const version = (name) =>
  JSON.parse(
    readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'),
  ).version;
const overrides = Object.fromEntries(
  Object.entries(cohort).map(([name, file]) => [name, `file:${resolve(file)}`]),
);
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify(
    {
      name: 'packed-concurrency-consumer',
      private: true,
      type: 'module',
      packageManager: `pnpm@${execFileSync('pnpm', ['--version'], { cwd: root, encoding: 'utf8' }).trim()}`,
      dependencies: {
        ...overrides,
        typescript: version('typescript'),
        '@types/node': version('@types/node'),
      },
    },
    null,
    2,
  ),
);
writeFileSync(
  join(consumer, 'pnpm-workspace.yaml'),
  JSON.stringify({ packages: [], autoInstallPeers: false, overrides }),
);
execFileSync('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], {
  cwd: consumer,
  stdio: 'inherit',
});
writeFileSync(
  join(consumer, 'consumer.ts'),
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8'),
);
writeFileSync(
  join(consumer, 'augmentation.ts'),
  readFileSync(join(root, 'tests/types/concurrency-augmentation.ts'), 'utf8'),
);
writeFileSync(
  join(consumer, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      target: 'ES2022',
      module: 'NodeNext',
      noEmit: true,
      skipLibCheck: false,
      types: ['node'],
    },
    include: ['*.ts'],
  }),
);
execFileSync(
  process.execPath,
  [join(consumer, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'run.mjs'),
  `
import assert from 'node:assert/strict';
import { mock } from 'node:test';

import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { ConcurrencyServiceProvider, concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';
import * as core from '@nocobase/concurrency';
import { ManagedLeaseRegistry, startAcquire, createSynchronousExecutor, encodeResourceKey } from '@nocobase/app-plugin-concurrency/server';
for (const entry of ['@nocobase/concurrency', '@nocobase/app-plugin-concurrency/server']) {
  assert.match(import.meta.resolve(entry), /node_modules.*dist/);
}
const pluginUrl = import.meta.resolve('@nocobase/app-plugin-concurrency/server');
assert.equal(await import(import.meta.resolve('@nocobase/concurrency', pluginUrl)), core);
assert.equal((await import(import.meta.resolve('@nocobase/app-plugin-concurrency/server', pluginUrl))).concurrencyServiceToken, concurrencyServiceToken);
for (const path of ['@nocobase/app-plugin-concurrency/server/mutex/instance', '@nocobase/app-plugin-concurrency/server/leases', '@nocobase/app-plugin-concurrency/server/acquire', '@nocobase/app-plugin-concurrency/server/mutex/lock', '@nocobase/app-plugin-concurrency/server/extensions']) {
  assert.throws(() => import.meta.resolve(path), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
}
assert.equal(typeof createSynchronousExecutor, 'function');
const config = new AppConfig();
await config.loadAll();
config.mergeDefaults({ app: { name: 'packed', publicBasePath: '/packed', internalBasePath: '', publicApiUrl: '/packed/api' }, concurrency: { default: 'memory', memory: { adapter: 'mutex', ttl: 3 } } });
const app = new Application({ config, paths: createAppPaths({ rootDir: process.cwd() }), nodeEnv: 'development' });
app.addServiceProvider(ConcurrencyServiceProvider);
await app.start();
const service = app.container.resolve(concurrencyServiceToken);
try {
  const [left, right] = await Promise.all([service.getManager(), service.getManager('memory')]);
  assert.equal(left, right);
  assert.equal('shutdown' in left, false);
  const lock = await left.createLock('shared');
  const executor = await right.createSynchronous('shared');
  const held = await lock.lock();
  assert.deepEqual(await executor.tryRun(() => 0), { acquired: false });
  const cancel = new AbortController();
  const waiting = lock.lock({ signal: cancel.signal });
  cancel.abort();
  await assert.rejects(waiting, core.ConcurrentAbortError);
  await held.release();
  assert.equal(await executor.run(() => 42), 42);
  const registry = new ManagedLeaseRegistry();
  let released = 0;
  const task = startAcquire(registry, { signal: new AbortController().signal, acquire: async () => async () => { released++; } });
  const lease = await task.result;
  await task.completion;
  await lease.release(); await lease.release(); assert.equal(released, 1);
  registry.register(async () => { released++; });
  await registry.releaseAll();
  registry.clear();
  assert.equal(released, 2);
  assert.equal('acquire' in registry, false);
  assert.equal('settlePending' in registry, false);
  const cancelled = new AbortController();
  const native = Promise.withResolvers();
  const cleanup = Promise.withResolvers();
  const cleaning = Promise.withResolvers();
  const late = startAcquire(registry, { signal: cancelled.signal, acquire: () => native.promise });
  const aborted = assert.rejects(late.result, core.ConcurrentAbortError);
  await Promise.resolve();
  cancelled.abort();
  await aborted;
  let completed = false;
  void late.completion.then(() => { completed = true; });
  native.resolve(async () => { cleaning.resolve(); await cleanup.promise; });
  await cleaning.promise;
  assert.equal(completed, false);
  cleanup.resolve();
  await late.completion;
  assert.equal(completed, true);
  assert.match(encodeResourceKey('namespace', 'name'), /^nb-concurrency:v2:/);
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
    const ttlLock = await left.createLock('ttl', { ttl: 1 });
    const ttlExecutor = await right.createSynchronous('ttl', { ttl: 2 });
    const holder = await ttlLock.lock();
    const finish = Promise.withResolvers();
    const started = Promise.withResolvers();
    let entered = false;
    const running = ttlExecutor.run(() => { entered = true; started.resolve(); return finish.promise; });
    await flush();
    mock.timers.tick(10000);
    await flush();
    assert.equal(entered, false);
    await holder.release();
    await started.promise;
    let nextEntered = false;
    const next = ttlLock.lock().then(lease => { nextEntered = true; return lease; });
    mock.timers.tick(10000);
    await flush();
    assert.equal(nextEntered, false);
    finish.resolve('actual');
    assert.equal(await running, 'actual');
    const successor = await next;
    await holder.release();
    const busy = ttlLock.tryLock(10);
    await flush();
    mock.timers.tick(10);
    assert.equal(await busy, undefined);
    await successor.release();
  } finally { mock.timers.reset(); }
} finally { await app.shutdown(); }
await assert.rejects(service.getManager(), core.ConcurrentAbortError);
console.log(JSON.stringify({ server: import.meta.resolve('@nocobase/app-plugin-concurrency/server'), helpers: ['ManagedLeaseRegistry', 'startAcquire', 'createSynchronousExecutor', 'encodeResourceKey'] }));
`,
);
execFileSync(
  process.execPath,
  ['--experimental-import-meta-resolve', 'run.mjs'],
  { cwd: consumer, stdio: 'inherit' },
);
const evidence = {
  consumer,
  cohort: Object.fromEntries(
    Object.entries(cohort).map(([name, path]) => [
      name,
      {
        path,
        sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
      },
    ]),
  ),
};
writeFileSync(
  join(artifacts, 'plugin-concurrency-evidence.json'),
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence));
