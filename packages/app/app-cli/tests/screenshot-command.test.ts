import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, it, vi } from 'vitest';

import Screenshot from '../src/commands/screenshot.ts';
import { startScreenshotServer } from '../src/lib/screenshot/server.ts';
import { setApplicationState } from '../src/runtime/command-store.ts';
import { loadTestConfig, packageRoot } from './helpers.ts';

vi.mock('../src/lib/screenshot/server.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/screenshot/server.ts')>()),
  startScreenshotServer: vi.fn(),
}));

it('gives the Chromium install command before starting the screenshot server', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'screenshot-app-'));
  const loadPlugins = vi.fn();
  try {
    vi.stubEnv('PLAYWRIGHT_BROWSERS_PATH', path.join(root, 'empty-browsers'));
    await symlink(
      path.join(packageRoot, 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    );
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ devDependencies: { '@playwright/test': '*' } }),
    );
    setApplicationState({ location: { kind: 'source', root }, loadPlugins });

    const command = new Screenshot([], await loadTestConfig());
    await expect(command.run()).rejects.toThrow(
      /Chromium could not launch.*pnpm exec playwright install chromium/u,
    );
    expect(loadPlugins).not.toHaveBeenCalled();
    expect(startScreenshotServer).not.toHaveBeenCalled();
  } finally {
    setApplicationState(undefined);
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  }
});
