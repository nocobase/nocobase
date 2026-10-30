import { spawn } from 'node:child_process';
import { pbkdf2Sync } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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
}
