import { spawn } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { installInterruptHandlers } from '../../src/lib/interrupt.ts';
import { runCommand } from '../../src/lib/run-command.ts';

const [mode, dir] = process.argv.slice(2);
const pidFile = path.join(dir, 'leaf.pid');
const beatFile = path.join(dir, 'heartbeat');

if (mode === 'leaf') {
  if (process.env.RESISTANT === '1') process.on('SIGTERM', () => {});
  const beat = () => appendFileSync(beatFile, '.');
  beat();
  setInterval(beat, 10);
  writeFileSync(pidFile, String(process.pid));
} else if (mode === 'leader') {
  // No exit handler: TERM must close the direct child before a resistant leaf exits.
  spawn(process.execPath, [import.meta.filename, 'leaf', dir], {
    stdio: process.env.INHERIT === '1' ? 'inherit' : 'ignore',
  });
  if (process.env.EARLY_EXIT === '1') process.exit(7);
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
  const start = performance.now();
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
        },
        timeoutMs: mode.includes('interrupt') ? undefined : 1000,
      },
    ).then(
      () => ({ resolved: true }),
      (error) => ({
        message: error.message,
        code: error.code,
        exitCode: error.exitCode,
      }),
    );
    const readyDeadline = performance.now() + 2500;
    while (!existsSync(pidFile) && performance.now() < readyDeadline)
      await delay(10);
    const pid = Number(readFileSync(pidFile, 'utf8'));
    if (mode.includes('interrupt')) process.emit('SIGINT', 'SIGINT');
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
        atReturn,
        after,
        bytesAtReturn,
        bytesAfter,
        recovery: recovery.stdout,
      }),
    );
  } finally {
    remove();
    // The supervisor kills and waitpid-reaps every adopted child, including on assertion or driver failure.
  }
}
