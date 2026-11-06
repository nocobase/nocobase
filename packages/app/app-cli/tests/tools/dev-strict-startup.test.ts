// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

const source = readFileSync(
  new URL('../../src/tools/scripts/dev/index.mjs', import.meta.url),
  'utf8',
);

it.each([true, false])(
  'strict=%s controls the server watcher and preserves failure status',
  (strictStartup) => {
    const spawnDevProcess = vi.fn(() => ({ stdin: {} }));
    const watchConfigFiles = vi.fn();
    // Test process supervision independently of application environment assembly.
    runInNewContext(
      source.slice(
        source.indexOf('  const serverChild = spawnDevProcess('),
        source.indexOf('\n}\n\ntry {\n  progress('),
      ),
      {
        strictStartup,
        path,
        serverEnv: {},
        spawnDevProcess,
        pluginWatchIncludes: ['plugin/server/**'],
        rootDir: '/app',
        process: { stdin: { pipe: vi.fn() } },
        resolveConfigWatch: () => ({}),
        watchConfigFiles,
        resolveDependencyWatch: () => [
          { directory: '/app', filenames: new Set() },
        ],
        DEPENDENCY_SETTLE_MS: 3000,
        clearTimeout: vi.fn(),
        setTimeout: vi.fn(),
        dependencyWatchers: [],
      },
    );
    const args = spawnDevProcess.mock.calls[0][2] as string[];
    expect(args.includes('watch')).toBe(!strictStartup);
    expect(args.includes('--include')).toBe(!strictStartup);
    expect(args).toContain('server/standalone.ts');
    // The dependency files and the config file are watched separately, and
    // `package.json` is no longer handed to the watcher as an --include.
    expect(watchConfigFiles).toHaveBeenCalledTimes(strictStartup ? 0 : 2);
    expect(args).not.toContain('package.json');
  },
);

it('preserves startup failure and delegates descendant cleanup to the supervisor', () => {
  const processMock = { exitCode: 0, exit: vi.fn() };
  const close = vi.fn();
  const closeDependencyWatcher = vi.fn();
  const release = vi.fn();
  runInNewContext(
    source.slice(
      source.indexOf('const shutdown ='),
      source.indexOf("process.on('SIGINT'"),
    ) + '\nshutdown(1);',
    {
      shuttingDown: false,
      envRestartTimer: undefined,
      envWatcher: { close },
      dependencyRestartTimer: undefined,
      dependencyWatchers: [{ close: closeDependencyWatcher }],
      instanceLock: { release },
      connectionProxy: undefined,
      process: processMock,
    },
  );
  expect(processMock.exitCode).toBe(1);
  expect(close).toHaveBeenCalledOnce();
  expect(closeDependencyWatcher).toHaveBeenCalledOnce();
  // Releasing the instance lock is what lets the next run start.
  expect(release).toHaveBeenCalledOnce();
  expect(processMock.exit).toHaveBeenCalledWith(1);
});
