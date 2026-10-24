// @vitest-environment node

import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';

import cliPlugins from '../../cli/plugins.js';
import packageMetadata from '../../package.json' with { type: 'json' };

it('registers the build hook and preserves the real articles database evidence for deployment', async () => {
  const foundation = cliPlugins.plugins.find(
    (plugin) => plugin.packageName === '@nocobase/app-plugin-foundation',
  );
  expect(foundation).toBeDefined();
  expect(foundation!.buildHooks.afterServerBuild).toContainEqual({
    label: 'Collect Foundation module associations',
    command: ['pnpm', 'nocobase', 'foundation', 'modules', 'build'],
  });
  const command = foundation!.devCommands['modules:build'];
  expect(command).toBeDefined();
  const root = await mkdtemp(path.join(os.tmpdir(), 'examples-foundation-'));
  try {
    const app = fileURLToPath(new URL('../../', import.meta.url));
    for (const entry of ['package.json', 'client', 'server', 'shared']) {
      await cp(path.join(app, entry), path.join(root, entry), {
        recursive: true,
      });
    }
    const result = await runAppCommand(
      bindAppCommand(command!, {
        rootDir: root,
        id: 'foundation:modules:build',
      }),
      ['--json'],
    );
    expect(result.json()).toMatchObject({ ok: true });
    const manifest = JSON.parse(
      await readFile(
        path.join(root, 'dist/server/foundation-modules.json'),
        'utf8',
      ),
    );
    expect(manifest.sources.routes).toContainEqual(
      expect.objectContaining({
        packageName: packageMetadata.name,
        routeName: 'articles',
        apiProviders: expect.arrayContaining(['@nocobase/db']),
      }),
    );
    expect(JSON.stringify(manifest)).not.toContain(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
