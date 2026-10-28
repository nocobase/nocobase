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
await runtime.close();
let closeCalls=0;const closeCause=new Error('Owned backend close failed');
const ownedBackend=new testing.ControlledBackend({acquire:async()=>undefined,close:async()=>{closeCalls++;if(closeCalls===1)throw closeCause;}});
const owned=await core.createConcurrentRuntime({backend:ownedBackend,namespace:'owned'});
assert.equal('openSession' in ownedBackend,false);
await assert.rejects(core.createConcurrentRuntime({backend:ownedBackend,namespace:'duplicate'}),core.ConcurrentConfigurationError);
assert.equal(closeCalls,0);
const closing=await Promise.allSettled([owned.close(),owned.close()]);
assert.ok(closing.every(result=>result.status==='rejected'&&result.reason instanceof core.ConcurrentCloseError&&result.reason.cause===closeCause));
assert.equal(closing[0].reason,closing[1].reason);assert.equal(closeCalls,1);
await owned.close();await owned.close();assert.equal(closeCalls,2);
await assert.rejects(core.createConcurrentRuntime({backend:ownedBackend,namespace:'closed'}),core.ConcurrentConfigurationError);
const initializationError=new Error('Initialization failed');let startupCleanups=0;
const startupBackend={protocolVersion:1,initialize:async()=>{throw initializationError;},validateResource:async()=>{},acquire:async()=>undefined,close:async()=>{startupCleanups++;}};
await assert.rejects(core.createConcurrentRuntime({backend:startupBackend,namespace:'failed'}),error=>error===initializationError);
assert.equal(startupCleanups,1);
console.log(JSON.stringify({ownedBackendCloseCalls:closeCalls,concurrentCloseFailureWaiters:closing.length,startupCleanups}));
const flush=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
for(const releaseFails of [false,true]){
  const time=new testing.ManualTime();const cause=new Error('Lease timer registration failed');let registrations=0;let releases=0;
  const scheduler={setTimer(notify,delay){if(++registrations===1)throw cause;return time.setTimer(notify,delay);}};
  const backend=new testing.ControlledBackend({acquire:async()=>({notAfter:100,release:async()=>{if(++releases===1&&releaseFails)throw new Error('Retry release');}})});
  const runtime=await core.createConcurrentRuntime({backend,namespace:'grant-timer',clock:time,scheduler});
  const lock=await runtime.manager.createLock('r');await assert.rejects(lock.lock(),error=>error instanceof core.ConcurrentAcquireError&&error.cause===cause);
  assert.equal(releases,1);await runtime.close();await runtime.close();assert.equal(releases,releaseFails?2:1);assert.equal(time.pendingTimers,0);
}
for(const outcome of ['complete','timeout']){
  const time=new testing.ManualTime();const callbacks=[];const gate=testing.deferred();
  const runtime=await core.createConcurrentRuntime({backend:new testing.ControlledBackend({acquire:async()=>undefined,close:()=>gate.promise}),namespace:'close-deadline',clock:time,scheduler:{setTimer(notify,delay){callbacks.push({notify,delay});return time.setTimer(notify,delay);}}});
  let settled=false;const closing=runtime.close({timeoutMs:10}).then(()=>{settled=true;},error=>{settled=true;return error;});
  await flush();time.advance(9.25);callbacks[0].notify();await flush();assert.equal(settled,false);assert.equal(callbacks[1].delay,1);callbacks[0].notify();assert.equal(callbacks.length,2);
  if(outcome==='complete'){gate.resolve();assert.equal(await closing,undefined);}else{time.advance(0.75);callbacks[1].notify();assert.ok(await closing instanceof core.ConcurrentCloseError);gate.resolve();await flush();await runtime.close();}
  const count=callbacks.length;for(const callback of callbacks)callback.notify();assert.equal(callbacks.length,count);assert.equal(time.pendingTimers,0);
}
const closeMargins=[];
for(let i=0;i<200;i++){
  const gate=testing.deferred();const runtime=await core.createConcurrentRuntime({backend:new testing.ControlledBackend({acquire:async()=>undefined,close:()=>gate.promise}),namespace:'real-close'});
  const start=port.defaultClock.now();await assert.rejects(runtime.close({timeoutMs:3}),core.ConcurrentCloseError);closeMargins.push(port.defaultClock.now()-start-3);gate.resolve();await runtime.close();
}
assert.equal(closeMargins.length,200);assert.ok(Math.min(...closeMargins)>=0);
console.log(JSON.stringify({closeSchedulerSamples:200,earlyCloseWaits:closeMargins.filter(value=>value<0).length,minCloseMarginMs:Math.min(...closeMargins)}));

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

console.log(JSON.stringify({leaseBoundaryCases:await verifyLeaseBoundaries(()=>new testing.ControlledBackend({acquire:async(request,context)=>({notAfter:context.clock.now()+request.resource.ttl,release:async()=>{}})}),0)}));
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
writeFileSync(
  join(consumer, 'deadline-failure.mjs'),
  readFileSync(join(root, 'tests/fixtures/deadline-failure.mjs'), 'utf8'),
);
for (const mode of ['busy', 'grant', 'release-retry'])
  execFileSync(process.execPath, ['deadline-failure.mjs', mode], {
    cwd: consumer,
    stdio: 'inherit',
    timeout: 5000,
  });
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
