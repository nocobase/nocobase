import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppCommand } from '@nocobase/app-cli';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import { DefaultFoundationService } from '@nocobase/app-plugin-foundation/server';
import { ServiceContainer } from '@nocobase/service-provider';

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
  expect(command?.prototype).toBeInstanceOf(AppCommand);
  const root = await mkdtemp(path.join(os.tmpdir(), 'examples-foundation-'));
  try {
    const app = fileURLToPath(new URL('../../', import.meta.url));
    for (const entry of ['package.json', 'client', 'server', 'shared']) {
      await cp(path.join(app, entry), path.join(root, entry), {
        recursive: true,
      });
    }
    const result = await runAppCommand(
      bindAppCommand(command as typeof AppCommand, {
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
    const article = manifest.sources.routes.find(
      (route: { routeName: string }) => route.routeName === 'articles',
    );
    expect(article.apiEvidence).toContainEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/articles',
        providers: expect.arrayContaining(['@nocobase/db']),
        conditions: [
          {
            kind: 'databaseAvailable',
            source: '@nocobase/db#databaseManagerToken',
          },
          {
            kind: 'authenticated',
            source:
              '@nocobase/app-plugin-authentication#authenticationToken.required',
          },
          { kind: 'bodyWithinLimit', source: 'hono/body-limit#bodyLimit' },
          {
            kind: 'validInput',
            source: '@nocobase/app-server/router#apiValidator',
          },
        ],
      }),
    );
    expect(
      manifest.sources.routes.find(
        (route: { routeName: string }) => route.routeName === 'home',
      )?.apiProviders ?? [],
    ).not.toContain('@nocobase/db');
    const source = new DefaultFoundationService({
      rootDir: root,
      container: new ServiceContainer(),
      config: { get: () => undefined },
      hasClient: true,
      collectors: [],
    });
    expect((await source.overview()).moduleSources).toEqual(manifest.sources);
    const deployed = path.join(root, 'source-free');
    await mkdir(path.join(deployed, 'server'), { recursive: true });
    await writeFile(
      path.join(deployed, 'package.json'),
      JSON.stringify({ name: packageMetadata.name }),
    );
    await cp(
      path.join(root, 'dist/server/foundation-modules.json'),
      path.join(deployed, 'server/foundation-modules.json'),
    );
    const built = new DefaultFoundationService({
      rootDir: deployed,
      container: new ServiceContainer(),
      config: { get: () => undefined },
      hasClient: true,
      collectors: [],
    });
    const cold = await built.overview();
    const warm = await built.overview({ refresh: true });
    expect(cold.moduleSources).toEqual(manifest.sources);
    expect(warm.moduleSources).toBe(cold.moduleSources);
    expect(JSON.stringify(manifest)).not.toContain(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
