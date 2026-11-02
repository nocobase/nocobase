import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Writable } from 'node:stream';
// eslint-disable-next-line vitest/no-import-node-test -- This standalone Node subprocess cannot import Vitest's worker runtime.
import { mock } from 'node:test';
import { installInterruptHandlers } from '../../src/lib/interrupt.ts';
import { runCommand } from '../../src/lib/run-command.ts';

const [mode, dir] = process.argv.slice(2);
const pidFile = path.join(dir, 'leaf.pid');
const beatFile = path.join(dir, 'heartbeat');

const remove = installInterruptHandlers({ write: () => true });
const snapshot = (pid) => {
  try {
    const fields = readFileSync(`/proc/${pid}/stat`, 'utf8')
      .split(') ')[1]
      .split(' ');
    return {
      state: fields[0],
      ppid: Number(fields[1]),
      pgid: Number(fields[2]),
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'absent' };
    throw error;
  }
};
const preparationStart = performance.now();
const ready = Promise.withResolvers();
const nativeSetTimeout = globalThis.setTimeout;
const nativeClearTimeout = globalThis.clearTimeout;
const timed = !mode.includes('interrupt');
let readinessTimer;
let output = '';
let leafPid;
let leaderExited = !mode.includes('early-exit');
const prepared = () => {
  if (leafPid && leaderExited) ready.resolve(leafPid);
};
if (!leaderExited) {
  const spawnLeader = childProcess.spawn;
  // Observe the real exit event without changing spawn arguments or streams.
  mock.method(childProcess, 'spawn', (...args) => {
    const child = spawnLeader(...args);
    child.once('exit', () => {
      leaderExited = true;
      prepared();
    });
    return child;
  });
  syncBuiltinESMExports();
}
if (timed) {
  // Freeze only the initial timeout during fixture preparation. Restore real
  // timers before stopping so TERM/KILL grace and observations stay real.
  mock.timers.enable({ apis: ['setTimeout'] });
  const schedule = globalThis.setTimeout;
  globalThis.setTimeout = (callback, ms, ...args) => {
    globalThis.setTimeout = schedule;
    return schedule(() => {
      mock.timers.reset();
      // Restore live ESM bindings such as timers/promises before observation.
      syncBuiltinESMExports();
      callback(...args);
    }, ms);
  };
}
try {
  const pending = runCommand(
    process.execPath,
    [
      fileURLToPath(new URL('./run-command-tree.mjs', import.meta.url)),
      'leader',
      dir,
    ],
    {
      env: {
        ...process.env,
        RESISTANT: mode.includes('resistant') ? '1' : '0',
        INHERIT: mode.includes('inherited') ? '1' : '0',
        EARLY_EXIT: mode.includes('early-exit') ? '1' : '0',
        SLOW_START: mode.includes('slow-start') ? '1' : '0',
      },
      timeoutMs: timed ? 1000 : undefined,
      echo: new Writable({
        write(chunk, _encoding, next) {
          output += chunk.toString();
          const match = output.match(/ready:(\d+)\n/);
          if (match) {
            leafPid = Number(match[1]);
            prepared();
          }
          next();
        },
      }),
    },
  ).then(
    () => ({ resolved: true }),
    (error) => ({
      message: error.message,
      code: error.code,
      exitCode: error.exitCode,
    }),
  );
  mock.restoreAll();
  syncBuiltinESMExports();
  readinessTimer = nativeSetTimeout(
    () => ready.reject(new Error('The probe leaf did not become ready.')),
    2500,
  );
  const pid = await ready.promise;
  nativeClearTimeout(readinessTimer);
  if (Number(readFileSync(pidFile, 'utf8')) !== pid)
    throw new Error('The ready leaf does not match its PID file.');
  const preparationMs = performance.now() - preparationStart;
  const start = performance.now();
  if (timed) mock.timers.tick(1000);
  else process.emit('SIGINT', 'SIGINT');
  const outcome = await pending;
  const elapsedMs = performance.now() - start;
  const atReturn = snapshot(pid);
  const bytesAtReturn = statSync(beatFile).size;
  // An observation interval detects continued writes; it never gates stopping or repairs a failed snapshot.
  await delay(100);
  const after = snapshot(pid);
  const bytesAfter = statSync(beatFile).size;
  const recovery = await runCommand(process.execPath, [
    '-e',
    'process.stdout.write("recovered")',
  ]);
  console.log(
    JSON.stringify({
      mode,
      outcome,
      elapsedMs,
      preparationMs,
      atReturn,
      after,
      bytesAtReturn,
      bytesAfter,
      recovery: recovery.stdout,
    }),
  );
} finally {
  nativeClearTimeout(readinessTimer);
  mock.timers.reset();
  mock.restoreAll();
  syncBuiltinESMExports();
  remove();
  // The supervisor kills and waitpid-reaps every adopted child, including on assertion or driver failure.
}
