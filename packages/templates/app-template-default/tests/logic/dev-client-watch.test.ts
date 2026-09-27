// @vitest-environment node

import {
  copyFile,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

const appRoot = path.resolve(import.meta.dirname, '../..');
let workspace: string | undefined;
let server: ViteDevServer | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
  if (workspace) await rm(workspace, { recursive: true, force: true });
  workspace = undefined;
  vi.unstubAllEnvs();
});

describe('development client file watching', () => {
  it('skips the complete app build while watching client and linked dependency edits', async () => {
    workspace = await realpath(
      await mkdtemp(path.join(tmpdir(), 'nocobase-client-watch-')),
    );
    // Brackets also guard against accidentally interpreting the app path as a glob.
    const root = path.join(workspace, 'app [fixture]');
    const clientFile = path.join(root, 'client/main.js');
    const dependencyDirectory = path.join(
      workspace,
      'linked-plugin/dist/client',
    );
    const dependencyFile = path.join(dependencyDirectory, 'index.js');
    const files = [
      clientFile,
      dependencyFile,
      path.join(root, 'dist/client/index.js'),
      path.join(root, 'dist/server/index.js'),
      path.join(root, 'dist/vendor/plugin/dist/client/index.js'),
      path.join(root, 'dist-sources/index.js'),
    ];
    for (const file of files) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, 'export const value = 1;\n');
    }
    for (const file of ['vite.config.ts', 'package.json']) {
      await copyFile(path.join(appRoot, file), path.join(root, file));
    }
    await symlink(
      path.join(appRoot, 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    );

    vi.stubEnv('AGENT_ANNOTATIONS_ENABLED', 'false');
    vi.stubEnv('PROXY_TARGET_URL', '');
    // `pnpm dev` always passes the mount path; the Vite preset refuses to serve without one.
    vi.stubEnv('APP_BASE_PATH', '/main');
    server = await createServer({
      root,
      // node_modules is shared with the running app; keep optimizer writes local.
      cacheDir: path.join(workspace, 'vite-cache'),
      configFile: path.join(root, 'vite.config.ts'),
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        middlewareMode: true,
        // Poll this small fixture so change events are reliable across CI hosts.
        watch: { usePolling: true, interval: 20 },
      },
    });
    const watcher = server.watcher;
    const changes: string[] = [];
    watcher.on('change', (file) => changes.push(file));
    // Vite adds imported modules outside the app root to this same watcher.
    watcher.add(dependencyDirectory);
    await vi.waitFor(() => {
      const watched = watcher.getWatched();
      expect(watched[path.dirname(clientFile)]).toContain('main.js');
      expect(watched[dependencyDirectory]).toContain('index.js');
      expect(watched[path.join(root, 'dist-sources')]).toContain('index.js');
    });

    await writeFile(clientFile, 'export const value = 2;\n');
    await writeFile(dependencyFile, 'export const value = 2;\n');
    await vi.waitFor(() => {
      expect(changes).toContain(clientFile);
      expect(changes).toContain(dependencyFile);
    });

    const watchedDirectories = Object.keys(watcher.getWatched());
    expect(
      watchedDirectories.filter(
        (directory) =>
          directory === path.join(root, 'dist') ||
          directory.startsWith(path.join(root, 'dist') + path.sep),
      ),
    ).toEqual([]);
  });
});
