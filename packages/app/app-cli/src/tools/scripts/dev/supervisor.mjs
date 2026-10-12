import { spawnSync } from 'node:child_process';
import { execa } from 'execa';
import { loadStandaloneAppEnv } from '@nocobase/app-server/node';

import { watchConfigFiles } from './config-watch.mjs';

// Keep dotenv values inside each worker so removed keys do not survive restarts.
export async function superviseDevelopment({
  rootDir,
  entry,
  baseEnv = process.env,
  execArgv = process.execArgv,
}) {
  const parentPid = process.ppid;
  // Package-manager version shims can add more than one parent above us.
  // Remember the original chain before any process can be reparented.
  const ancestors = new Set([parentPid]);
  if (process.platform !== 'win32') {
    const snapshot = spawnSync('ps', ['-axo', 'pid=,ppid='], {
      encoding: 'utf8',
    });
    if (snapshot.status === 0) {
      const parents = new Map(
        snapshot.stdout
          .trim()
          .split('\n')
          .map((line) => line.trim().split(/\s+/).map(Number)),
      );
      let ancestor = parents.get(parentPid);
      while (ancestor > 1 && !ancestors.has(ancestor)) {
        ancestors.add(ancestor);
        ancestor = parents.get(ancestor);
      }
    }
  }
  const parentExited = () =>
    process.ppid !== parentPid ||
    [...ancestors].some((pid) => {
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        return error.code === 'ESRCH';
      }
    });
  const inheritedEnv = { ...baseEnv };
  let child;
  let watcher;
  let timer;
  let stopping = false;
  let restarting = false;
  let terminating = false;
  let terminationStartedAt;
  const terminate = (reason = 'worker exited') => {
    if (terminating) return;
    terminating = true;
    terminationStartedAt = performance.now();
    console.log(`\n[dev] Stopping development processes (${reason})`);
    child?.kill();
  };
  // Terminal and package-manager signals can arrive more than once.
  const stop = (reason) => {
    if (stopping) return;
    stopping = true;
    clearTimeout(timer);
    watcher?.close();
    terminate(reason);
  };
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  for (const signal of signals) process.on(signal, stop);
  const parentWatch = setInterval(() => {
    if (!stopping && parentExited()) {
      stop('parent process exited');
    }
  }, 500);

  try {
    while (!stopping) {
      restarting = false;
      terminating = false;
      const env = loadStandaloneAppEnv({ rootDir, baseEnv: inheritedEnv });
      if (env.NOCOBASE_STRICT_STARTUP !== 'true') {
        watcher = watchConfigFiles(
          { directory: rootDir, filenames: new Set(['.env', '.env.local']) },
          (_event, filename) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              if (stopping || restarting) return;
              restarting = true;
              console.log(
                `[dev] ${filename} changed; restarting development processes`,
              );
              terminate('configuration changed');
            }, 100);
          },
        );
      }
      child = execa(process.execPath, [...execArgv, entry], {
        cwd: rootDir,
        env: inheritedEnv,
        extendEnv: false,
        killDescendants: true,
        forceKillAfterDelay: 1800,
        reject: false,
        buffer: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // Piped output lets Execa wait for descendants that keep the streams open,
      // even if their immediate parent has already exited.
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
      // Background runs may receive EOF; internal restart input must remain writable.
      process.stdin.pipe(child.stdin, { end: false });
      child.stdin.on('error', (error) => {
        if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED') {
          console.error('[dev] Failed to forward input', error);
        }
      });
      child.nodeChildProcess.once('exit', () => terminate());
      const result = await child;
      process.stdin.unpipe(child.stdin);
      // Reap descendants that closed their output before their parent exited.
      child.kill('SIGKILL');
      if (terminating) {
        console.log(
          `[dev] Development processes stopped (${((performance.now() - terminationStartedAt) / 1000).toFixed(1)}s)`,
        );
      }
      child = undefined;
      watcher?.close();
      watcher = undefined;
      clearTimeout(timer);
      if (stopping) return 0;
      if (!restarting) {
        if (result.failed && !result.signal && result.exitCode === undefined)
          console.error(
            '[dev] Failed to start development processes',
            result.shortMessage,
          );
        return result.exitCode ?? 1;
      }
    }
    return 0;
  } catch (error) {
    console.error('[dev] Development supervisor failed', error);
    child?.kill('SIGKILL');
    if (child) await child;
    return 1;
  } finally {
    clearInterval(parentWatch);
    clearTimeout(timer);
    watcher?.close();
    process.stdin.pause();
    for (const signal of signals) process.off(signal, stop);
  }
}
