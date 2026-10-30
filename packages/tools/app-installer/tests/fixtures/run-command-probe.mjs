import childProcess, { spawn } from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { pbkdf2Sync } from 'node:crypto';
import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Writable } from 'node:stream';
// eslint-disable-next-line vitest/no-import-node-test -- This standalone Node subprocess cannot import Vitest's worker runtime.
import { mock } from 'node:test';
import { installInterruptHandlers } from '../../src/lib/interrupt.ts';
import { runCommand } from '../../src/lib/run-command.ts';

const [mode, dir] = process.argv.slice(2);
const pidFile = path.join(dir, 'leaf.pid');
const beatFile = path.join(dir, 'heartbeat');

if (mode === 'leaf') {
  if (process.env.SLOW_START === '1') {
    // Exercise cold initialization longer than the command's 1000 ms timeout.
    const initializedAt = performance.now() + 1100;
    while (performance.now() < initializedAt)
      pbkdf2Sync('probe', 'startup', 10_000, 32, 'sha256');
  }
  if (process.env.RESISTANT === '1') process.on('SIGTERM', () => {});
  const beat = () => appendFileSync(beatFile, '.');
  beat();
  setInterval(beat, 10);
  writeFileSync(pidFile, String(process.pid));
  process.send?.('ready');
} else if (mode === 'leader') {
  // No exit handler: TERM must close the direct child before a resistant leaf exits.
  const earlyExit = process.env.EARLY_EXIT === '1';
  const child = spawn(process.execPath, [import.meta.filename, 'leaf', dir], {
    stdio:
      process.env.INHERIT === '1'
        ? ['inherit', 'inherit', 'inherit', 'ipc']
        : ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  child.once('message', () => {
    // Forward readiness only after the leaf has written its PID and heartbeat.
    process.stdout.write(`ready:${child.pid}\n`, () => {
      if (earlyExit) process.exit(7);
    });
  });
  setInterval(() => {}, 1000);
} else {
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
      [import.meta.filename, 'leader', dir],
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
}
