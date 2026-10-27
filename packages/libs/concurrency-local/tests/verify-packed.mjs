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
const artifacts = resolve(
  process.argv[2] ??
    mkdtempSync(join(tmpdir(), 'concurrency-local-artifacts-')),
);
mkdirSync(artifacts, { recursive: true });
const coreTarball = join(
  artifacts,
  `nocobase-concurrency-${coreMetadata.version}.tgz`,
);
const localTarball = join(
  artifacts,
  `nocobase-concurrency-local-${metadata.version}.tgz`,
);
execFileSync('pnpm', ['pack', '--out', coreTarball], {
  cwd: coreRoot,
  stdio: 'inherit',
});
execFileSync('pnpm', ['pack', '--out', localTarball], {
  cwd: root,
  stdio: 'inherit',
});
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-local-consumer-'));
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'packed-local-consumer',
    private: true,
    type: 'module',
  }),
);
const tsVersion = JSON.parse(
  readFileSync(join(root, 'node_modules/typescript/package.json'), 'utf8'),
).version;
execFileSync(
  'npm',
  [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    coreTarball,
    localTarball,
    `typescript@${tsVersion}`,
  ],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'consumer.ts'),
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8').replaceAll(
    '../src/index.ts',
    '@nocobase/concurrency-local',
  ),
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
    },
    include: ['consumer.ts'],
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
import {setImmediate} from 'node:timers/promises';
import * as core from '@nocobase/concurrency';
import * as port from '@nocobase/concurrency/backend';
import * as testing from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '@nocobase/concurrency-local';
for(const entry of ['@nocobase/concurrency','@nocobase/concurrency/backend','@nocobase/concurrency/testing','@nocobase/concurrency-local']) assert.match(import.meta.resolve(entry),/node_modules.*dist/);
for(const name of ['ConcurrentConfigurationError','ConcurrentAcquireError','ConcurrentAbortError','ConcurrentLeaseLostError','ConcurrentReleaseError','ConcurrentCloseError']) {assert.equal(core[name],port[name]);assert.equal(core[name],testing[name]);}
const contract = await testing.runBackendContract({createBackend:()=>new LocalConcurrentBackend()});
const faults = await testing.runCoreFaultContract();
const backend = new LocalConcurrentBackend();
const a = await core.createConcurrentRuntime({backend,namespace:'packed'});
const b = await core.createConcurrentRuntime({backend,namespace:'packed'});
const lock = await a.manager.createLock('r');
const executor = await b.manager.createSynchronous('r');
const lease = await lock.lock();assert.deepEqual(await executor.tryRun(()=>1),{acquired:false});await lease.release();
let active=0;let max=0;
const executors = [await a.manager.createSynchronous('r'),executor];
await Promise.all(Array.from({length:20},(_,i)=>executors[i%2].run(async({signal})=>{signal.throwIfAborted();active++;max=Math.max(max,active);await setImmediate();active--;})));
assert.equal(max,1);
assert.equal(await executor.run(()=>42),42);
await a.close();await b.close();await backend.close();
console.log(JSON.stringify({contract,faults,multiManagerMaxActive:max}));
`,
);
execFileSync(process.execPath, ['run.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
const evidence = {
  consumer,
  status: 'passed',
  artifacts: [coreTarball, localTarball].map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  })),
};
writeFileSync(
  join(artifacts, 'evidence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
