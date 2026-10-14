// @vitest-environment node
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
import {
  resolveConfigWatch,
  watchConfigFiles,
} from '../../src/tools/scripts/dev/config-watch.mjs';

const source = readFileSync(
  new URL('../../src/tools/scripts/dev/index.mjs', import.meta.url),
  'utf8',
);

it('reloads configuration in a real tsx worker after parent stdin reaches EOF', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'dev-background-restart-'));
  const input = new PassThrough();
  let child: ChildProcessWithoutNullStreams | undefined;
  const states: Array<{ pid: number; origin: string }> = [];
  let output = '';
  const context = {
    strictStartup: false,
    path,
    rootDir: root,
    serverEnv: {},
    pluginWatchIncludes: [],
    process: { stdin: input },
    console,
    setTimeout,
    clearTimeout,
    shuttingDown: false,
    envRestartTimer: undefined,
    envWatcher: undefined as { close(): void } | undefined,
    dependencyWatchers: [],
    resolveDependencyWatch: () => [],
    DEPENDENCY_SETTLE_MS: 10,
    resolveConfigWatch,
    watchConfigFiles,
    spawnDevProcess: () => {
      child = spawn(
        process.execPath,
        [
          createRequire(import.meta.url).resolve('tsx/cli'),
          'watch',
          '--clear-screen=false',
          path.join(root, 'server.mjs'),
        ],
        { cwd: root, stdio: 'pipe' },
      );
      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString();
        const lines = output.split('\n');
        output = lines.pop() ?? '';
        for (const line of lines)
          if (line.startsWith('{')) states.push(JSON.parse(line));
      });
      child.stderr.resume();
      return child;
    },
  };
  try {
    await writeFile(path.join(root, 'config.yml'), 'http://localhost:13000');
    // The fixture deliberately reads config outside tsx's module graph: only the dev config watcher can restart it.
    await writeFile(
      path.join(root, 'server.mjs'),
      `import { readFileSync } from 'node:fs';\nconsole.log(JSON.stringify({pid: process.pid, origin: readFileSync('config.yml', 'utf8')}));\nsetInterval(() => {}, 1000);\n`,
    );
    runInNewContext(
      source.slice(
        source.indexOf('  const serverChild = spawnDevProcess('),
        source.indexOf('\n}\n\ntry {\n  progress('),
      ),
      context,
    );
    input.end();
    await vi.waitFor(() => expect(states).toHaveLength(1), { timeout: 10000 });
    await writeFile(
      path.join(root, 'config.yml'),
      'http://192.168.50.82:13000',
    );
    await vi.waitFor(() => expect(states).toHaveLength(2), { timeout: 10000 });
    expect(states[1].origin).toBe('http://192.168.50.82:13000');
    expect(states[1].pid).not.toBe(states[0].pid);
    await writeFile(path.join(root, 'config.yml'), 'https://app.example.com');
    await vi.waitFor(() => expect(states).toHaveLength(3), { timeout: 10000 });
    expect(states[2].origin).toBe('https://app.example.com');
  } finally {
    context.envWatcher?.close();
    clearTimeout(context.envRestartTimer);
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise<void>((resolve) =>
        child!.once('close', () => resolve()),
      );
      child.kill('SIGTERM');
      await stopped;
    }
    input.destroy();
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
