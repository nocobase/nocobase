import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const artifactDir = resolve(
  process.argv[2] ?? mkdtempSync(join(tmpdir(), 'concurrency-artifacts-')),
);
mkdirSync(artifactDir, { recursive: true });
const tarball = join(
  artifactDir,
  `nocobase-concurrency-${metadata.version}.tgz`,
);
execFileSync('pnpm', ['pack', '--out', tarball], {
  cwd: root,
  stdio: 'inherit',
});
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-consumer-'));
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'concurrency-packed-consumer',
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
    tarball,
    `typescript@${tsVersion}`,
  ],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'consumer.ts'),
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8')
    .replaceAll('../src/index.ts', '@nocobase/concurrency')
    .replaceAll('../src/backend/index.ts', '@nocobase/concurrency/backend')
    .replaceAll('../src/testing/index.ts', '@nocobase/concurrency/testing'),
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
import * as core from '@nocobase/concurrency';
import * as port from '@nocobase/concurrency/backend';
import * as testing from '@nocobase/concurrency/testing';
for (const entry of ['@nocobase/concurrency', '@nocobase/concurrency/backend', '@nocobase/concurrency/testing']) {
  assert.match(import.meta.resolve(entry), /node_modules.*concurrency.*dist/);
}
for (const name of ['ConcurrentConfigurationError','ConcurrentAcquireError','ConcurrentAbortError','ConcurrentLeaseLostError','ConcurrentReleaseError','ConcurrentCloseError']) {
  assert.equal(core[name], port[name]); assert.equal(core[name], testing[name]);
}
const held = new Map();
const result = await testing.runBackendContract({ createBackend: () => new testing.ControlledBackend({
  acquire: async (request, context) => {
    const key = JSON.stringify([request.resource.namespace,request.resource.kind,request.resource.name]);
    if (held.has(key)) return undefined;
    held.set(key, request.token);
    return { notAfter: context.clock.now() + request.resource.ttl, release: async () => { if (held.get(key) === request.token) held.delete(key); } };
  },
}) });
assert.equal(held.size, 0);
const backend = new testing.ControlledBackend({ acquire: async (request, context) => ({ notAfter: context.clock.now()+request.resource.ttl, release: async () => {} }) });
const runtime = await core.createConcurrentRuntime({ backend, namespace: 'example' });
assert.equal('createSemaphore' in runtime.manager,false);
assert.equal('createReadWriteLock' in runtime.manager,false);
assert.equal('capabilities' in runtime,false);
assert.equal(await (await runtime.manager.createSynchronous('report')).run(({signal}) => { signal.throwIfAborted(); return 42; }), 42);
await runtime.close(); await backend.close();
const preTime = new testing.ManualTime();
const preBackend = new testing.ControlledBackend({acquire:async()=>{throw new Error('Must not acquire');}});
const preRuntime = await core.createConcurrentRuntime({backend:preBackend,namespace:'queued',clock:preTime,scheduler:preTime});
const preLock = await preRuntime.manager.createLock('r');
const preExecutor = await preRuntime.manager.createSynchronous('r');
const preLockWork = preLock.tryLock(10);preTime.advance(10);assert.equal(await preLockWork,undefined);
const preRunWork = preExecutor.tryRun(()=>{throw new Error('Must not run');},10);preTime.advance(10);assert.deepEqual(await preRunWork,{acquired:false});
assert.equal(preBackend.requests.length,0);await preRuntime.close();assert.equal(preTime.pendingTimers,0);
let earlyNotifications=0;const abortMargins=[];let deadline;
const realScheduler={setTimer(callback,delay){return port.defaultScheduler.setTimer(()=>{if(deadline!==undefined&&port.defaultClock.now()<deadline)earlyNotifications++;callback();},delay);}};
const realBackend=new testing.ControlledBackend({acquire:async(request,context)=>{assert.equal(request.wait.kind,'bounded');deadline=request.wait.deadline;await new Promise(resolve=>request.signal.addEventListener('abort',()=>{abortMargins.push(context.clock.now()-request.wait.deadline);resolve();},{once:true}));return undefined;}});
const realRuntime=await core.createConcurrentRuntime({backend:realBackend,namespace:'default-timer',scheduler:realScheduler});
const realLock=await realRuntime.manager.createLock('r');
for(let i=0;i<100;i++)assert.equal(await realLock.tryLock(10),undefined);
await realRuntime.close();assert.equal(abortMargins.length,100);assert.ok(Math.min(...abortMargins)>=0);
console.log(JSON.stringify({defaultSchedulerSamples:100,earlyNotifications,minAbortMarginMs:Math.min(...abortMargins)}));
console.log(JSON.stringify({ backend: result, faults: await testing.runCoreFaultContract() }));
`,
);
execFileSync(process.execPath, ['run.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
const evidence = {
  tarball,
  sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
  consumer,
  version: metadata.version,
  status: 'passed',
};
writeFileSync(
  join(artifactDir, 'evidence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
