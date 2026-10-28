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
if (metadata.name !== '@nocobase/concurrency-mutex')
  throw new Error('Unexpected mutex package name');
const coreMetadata = JSON.parse(
  readFileSync(join(coreRoot, 'package.json'), 'utf8'),
);
const artifacts = resolve(
  process.argv[2] ??
    mkdtempSync(join(tmpdir(), 'concurrency-mutex-artifacts-')),
);
mkdirSync(artifacts, { recursive: true });
const coreTarball = join(
  artifacts,
  `nocobase-concurrency-${coreMetadata.version}.tgz`,
);
const mutexTarball = join(
  artifacts,
  `nocobase-concurrency-mutex-${metadata.version}.tgz`,
);
execFileSync('pnpm', ['pack', '--out', coreTarball], {
  cwd: coreRoot,
  stdio: 'inherit',
});
execFileSync('pnpm', ['pack', '--out', mutexTarball], {
  cwd: root,
  stdio: 'inherit',
});
const consumer = mkdtempSync(join(tmpdir(), 'concurrency-mutex-consumer-'));
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'packed-mutex-consumer',
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
    mutexTarball,
    `typescript@${tsVersion}`,
  ],
  { cwd: consumer, stdio: 'inherit' },
);
writeFileSync(
  join(consumer, 'consumer.ts'),
  readFileSync(join(root, 'tests/consumer.ts'), 'utf8').replaceAll(
    '../src/index.ts',
    '@nocobase/concurrency-mutex',
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
import { LocalConcurrentBackend } from '@nocobase/concurrency-mutex';
for(const entry of ['@nocobase/concurrency','@nocobase/concurrency/backend','@nocobase/concurrency/testing','@nocobase/concurrency-mutex']) assert.match(import.meta.resolve(entry),/node_modules.*dist/);
const installed = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../package.json', import.meta.resolve('@nocobase/concurrency-mutex')), 'utf8'));
assert.equal(installed.name,'@nocobase/concurrency-mutex');
assert.equal(installed.peerDependencies['@nocobase/concurrency'], '^' + ${JSON.stringify(coreMetadata.version)});
for(const name of ['ConcurrentConfigurationError','ConcurrentAcquireError','ConcurrentAbortError','ConcurrentLeaseLostError','ConcurrentReleaseError','ConcurrentCloseError']) {assert.equal(core[name],port[name]);assert.equal(core[name],testing[name]);}
const contract = await testing.runBackendContract({createBackend:()=>new LocalConcurrentBackend()});
const faults = await testing.runCoreFaultContract();
for(const method of ['lock','run']){
  const time=new testing.ManualTime();const callbacks=[];
  const scheduler={setTimer(notify,delay){callbacks.push({notify,delay});return time.setTimer(notify,delay);}};
  const backend=new LocalConcurrentBackend({retryIntervalMs:1});const options={backend,namespace:'early-deadline',clock:time,scheduler};
  const owner=await core.createConcurrentRuntime(options);
  const held=await (await owner.manager.createLock('r',{ttl:100})).lock();
  const lock=await owner.manager.createLock('r');const executor=await owner.manager.createSynchronous('r');
  const flush=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
  const work=method==='lock'?lock.tryLock(10).then(async lease=>{assert.ok(lease);await lease.release();}):executor.tryRun(()=>42,10).then(result=>assert.deepEqual(result,{acquired:true,value:42}));
  await flush();const timer=callbacks.find(callback=>callback.delay===10);assert.ok(timer);time.advance(8.25);timer.notify();await flush();time.advance(0.75);await held.release();time.flush();await work;
  const queued=method==='lock'?lock.tryLock(10):executor.tryRun(()=>{throw new Error('Must not run');},10);time.advance(10);assert.deepEqual(await queued,method==='lock'?undefined:{acquired:false});
  const next=await lock.tryLock();assert.ok(next);await next.release();
  await owner.close();assert.equal(time.pendingTimers,0);
}
const flush=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
for(const method of ['lock','run']){
  const time=new testing.ManualTime();let calls=0;const cause=new Error('Core lease timer failed');
  const scheduler={setTimer(notify,delay){if(++calls===2)throw cause;return time.setTimer(notify,delay);}};
  const runtime=await core.createConcurrentRuntime({backend:new LocalConcurrentBackend(),namespace:'grant-timer',clock:time,scheduler});
  const lock=await runtime.manager.createLock('r',{ttl:100});const executor=await runtime.manager.createSynchronous('r',{ttl:100});
  await assert.rejects(method==='lock'?lock.lock():executor.run(()=>{throw new Error('Must not enter runner');}),error=>error instanceof core.ConcurrentAcquireError&&error.cause===cause);
  time.advance(101);time.flush();await flush();await runtime.close();await runtime.close();assert.equal(time.pendingTimers,0);
}
{
  const time=new testing.ManualTime();const callbacks=[];const gate=testing.deferred();const entered=testing.deferred();
  const runtime=await core.createConcurrentRuntime({backend:new LocalConcurrentBackend(),namespace:'close-timer',clock:time,scheduler:{setTimer(notify,delay){callbacks.push({notify,delay});return time.setTimer(notify,delay);}}});
  const executor=await runtime.manager.createSynchronous('r',{ttl:100});const work=executor.run(async()=>{entered.resolve();await gate.promise;});await entered.promise;
  let settled=false;const closing=runtime.close({timeoutMs:10}).then(()=>{settled=true;},error=>{settled=true;return error;});const timer=callbacks.find(callback=>callback.delay===10);assert.ok(timer);
  time.advance(9.25);timer.notify();await flush();assert.equal(settled,false);gate.resolve();await work;assert.equal(await closing,undefined);
  const count=callbacks.length;for(const callback of callbacks)callback.notify();assert.equal(callbacks.length,count);assert.equal(time.pendingTimers,0);
}
console.log(JSON.stringify({confirmedGrantTimerFailureCases:2,realRunnerCloseAt9_25Ms:'passed'}));
for(const method of ['lock','run']){
  const time=new testing.ManualTime();const cause=new Error('First backend timer failed');let calls=0;
  const runtime=await core.createConcurrentRuntime({backend:new LocalConcurrentBackend(),namespace:'backend-timer',clock:time,scheduler:{setTimer(notify,delay){if(++calls===1)throw cause;return time.setTimer(notify,delay);}}});
  const lock=await runtime.manager.createLock('r',{ttl:100});const executor=await runtime.manager.createSynchronous('r',{ttl:100});
  await assert.rejects(method==='lock'?lock.lock():executor.run(()=>{throw new Error('Must not enter runner');}),error=>error instanceof core.ConcurrentAcquireError&&error.cause===cause);
  const lease=await lock.tryLock();assert.ok(lease);await lease.release();time.advance(101);time.flush();await runtime.close();await runtime.close();assert.equal(time.pendingTimers,0);
}
console.log(JSON.stringify({initialBackendTimerFailureCases:2}));

async function verifyLeaseBoundaries(createBackend, backendTimers) {
  let finalization=0;let startup=0;
  for(const method of ['run','tryRun'])for(const phase of ['before','after'])for(const businessFails of [false,true])for(const releaseFails of [false,true]){
    const time=new testing.ManualTime();const cause=new Error('Final lease clock failed');const business=new Error('Independent business failure');let failClock=false;let releases=0;
    const clock={now(){if(failClock){failClock=false;throw cause;}return time.now();}};
    const backend=createBackend();const acquire=backend.acquire.bind(backend);
    backend.acquire=async request=>{const grant=await acquire(request);if(!grant)return undefined;return{notAfter:grant.notAfter,release:async()=>{const call=++releases;try{if(releaseFails&&call===1)throw new Error('Release failed');await grant.release();}finally{if(phase==='after'&&call===1)failClock=true;}}};};
    const runtime=await core.createConcurrentRuntime({backend,namespace:'finalize',clock,scheduler:time,logger(){throw new Error('Diagnostic failure');}});
    const executor=await runtime.manager.createSynchronous('r',{ttl:100});const runner=()=>{if(phase==='before')failClock=true;if(businessFails)throw business;return 42;};
    const error=await(method==='run'?executor.run(runner):executor.tryRun(runner)).then(()=>null,error=>error);
    assert.equal(releases,1);if(businessFails)assert.equal(error,business);else{assert.ok(error instanceof core.ConcurrentLeaseLostError);assert.equal(error.cause,cause);}
    time.advance(101);time.flush();await runtime.close();await runtime.close();assert.equal(releases,releaseFails?2:1);assert.equal(time.pendingTimers,0);finalization++;
  }
  for(const method of ['lock','tryLock','boundedLock','run','tryRun','boundedRun'])for(const releaseFails of [false,true]){
    const time=new testing.ManualTime();const cause=new Error('Nested monitor failed');const callbacks=[];let ttlTimers=0;let releases=0;let entered=0;
    const scheduler={setTimer(notify,delay){callbacks.push(notify);if(delay===100){const call=++ttlTimers;if(call===backendTimers+1)notify();if(call===backendTimers+2)throw cause;}return time.setTimer(notify,delay);}};
    const backend=createBackend();const acquire=backend.acquire.bind(backend);
    backend.acquire=async request=>{const grant=await acquire(request);if(!grant)return undefined;return{notAfter:grant.notAfter,release:async()=>{if(++releases===1&&releaseFails)throw new Error('Release failed');await grant.release();}};};
    const runtime=await core.createConcurrentRuntime({backend,namespace:'startup-loss',clock:time,scheduler});const lock=await runtime.manager.createLock('r',{ttl:100});const executor=await runtime.manager.createSynchronous('r',{ttl:100});const runner=()=>{entered++;return 42;};
    const work=method==='lock'?lock.lock():method==='tryLock'?lock.tryLock():method==='boundedLock'?lock.tryLock(10):method==='run'?executor.run(runner):method==='tryRun'?executor.tryRun(runner):executor.tryRun(runner,10);
    const error=await work.then(()=>null,error=>error);assert.equal(entered,0);assert.ok(error instanceof core.ConcurrentLeaseLostError);assert.equal(error.cause,cause);assert.equal(releases,1);
    time.advance(101);time.flush();await runtime.close();await runtime.close();assert.equal(releases,releaseFails?2:1);assert.equal(time.pendingTimers,0);const count=callbacks.length;for(const notify of callbacks)notify();assert.equal(callbacks.length,count);assert.equal(time.pendingTimers,0);startup++;
  }
  return {finalization,startup};
}

console.log(JSON.stringify({leaseBoundaryCases:await verifyLeaseBoundaries(()=>new LocalConcurrentBackend(),1)}));
const ordinary = [];
for (const method of ['lock', 'run']) {
  const time = new testing.ManualTime();
  const local = new LocalConcurrentBackend({retryIntervalMs: 10000});
  const options = {backend: local, namespace: 'packed-wait', clock: time, scheduler: time};
  const owner = await core.createConcurrentRuntime(options);
  const held = await (await owner.manager.createLock('r', {ttl: 120000})).lock();
  let settled = false;
  const work = method === 'lock'
    ? (await owner.manager.createLock('r')).lock().then(async lease => {settled=true;await lease.release();})
    : (await owner.manager.createSynchronous('r')).run(() => {settled=true;});
  const flush = async () => {for(let i=0;i<50;i++) await Promise.resolve();};
  await flush();time.advance(60000);time.flush();await flush();
  assert.equal(settled,false);
  await held.release();time.advance(10000);time.flush();await work;
  assert.equal(settled,true);
  await owner.close();
  assert.equal(time.pendingTimers,0);ordinary.push(method);
}
const backend = new LocalConcurrentBackend();
const a = await core.createConcurrentRuntime({backend,namespace:'packed'});
await assert.rejects(core.createConcurrentRuntime({backend,namespace:'other'}),core.ConcurrentConfigurationError);
assert.equal('createSemaphore' in a.manager,false);
assert.equal('capabilities' in a,false);
const lock = await a.manager.createLock('r');
const executor = await a.manager.createSynchronous('r');
const lease = await lock.lock();assert.deepEqual(await executor.tryRun(()=>1),{acquired:false});await lease.release();
let active=0;let max=0;
const executors = [await a.manager.createSynchronous('r'),executor];
await Promise.all(Array.from({length:20},(_,i)=>executors[i%2].run(async({signal})=>{signal.throwIfAborted();active++;max=Math.max(max,active);await setImmediate();active--;})));
assert.equal(max,1);
assert.equal(await executor.run(()=>42),42);
await a.close();await a.close();
await assert.rejects(core.createConcurrentRuntime({backend,namespace:'closed'}),core.ConcurrentConfigurationError);
await assert.rejects(backend.validateResource({namespace:'packed',name:'r',kind:'lock',ttl:30000}),core.ConcurrentAcquireError);
console.log(JSON.stringify({contract,faults,ordinaryWaitsBeyond30Seconds:ordinary,sameRuntimeMaxActive:max}));
`,
);
writeFileSync(
  join(consumer, 'retry-failure.mjs'),
  readFileSync(join(root, 'tests/fixtures/retry-failure.mjs'), 'utf8'),
);
for (const mode of ['timer', 'abort', 'deadline'])
  execFileSync(process.execPath, ['retry-failure.mjs', mode], {
    cwd: consumer,
    stdio: 'inherit',
    timeout: 5000,
  });
execFileSync(process.execPath, ['run.mjs'], {
  cwd: consumer,
  stdio: 'inherit',
});
const evidence = {
  consumer,
  status: 'passed',
  artifacts: [coreTarball, mutexTarball].map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  })),
};
writeFileSync(
  join(artifacts, 'evidence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
