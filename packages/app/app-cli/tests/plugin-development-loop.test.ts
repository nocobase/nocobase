import type { Config } from '@oclif/core';
import { existsSync, realpathSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { PluginCapability } from '@nocobase/create-plugin/src/lib/capabilities.ts';
import { createPlugin } from '@nocobase/create-plugin/src/lib/scaffold.ts';
import { loadTestConfig, runCommand } from './helpers.ts';

const created: string[] = [];
const require = createRequire(import.meta.url);
let config: Config;

beforeAll(async () => {
  config = await loadTestConfig();
});

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

function moduleDirectory(packageName: string): string {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

/**
 * The workspace packages the generated app imports. The CLI does not use them itself; they are devDependencies of
 * this package only so the fixture can link them from this package's own `node_modules`, and so the workspace graph
 * knows this test reads them.
 */
const FIXTURE_DEPENDENCIES = [
  '@nocobase/app-client',
  '@nocobase/app-server',
  '@nocobase/dev-config',
  '@nocobase/service-provider',
] as const;

/** A declared dependency's directory, read from the link pnpm put in this package's `node_modules`. */
function declaredDependencyDirectory(packageName: string): string {
  return realpathSync(
    path.join(
      import.meta.dirname,
      '..',
      'node_modules',
      ...packageName.split('/'),
    ),
  );
}

async function createLoopFixture(
  capabilities: readonly PluginCapability[],
): Promise<{ appRoot: string; pluginRoot: string }> {
  const workspaceRoot = await mkdtemp(
    path.join(os.tmpdir(), 'nb3-plugin-development-loop-'),
  );
  created.push(workspaceRoot);
  await mkdir(path.join(workspaceRoot, 'packages', 'plugins'), {
    recursive: true,
  });
  const generated = await createPlugin({
    capabilities,
    install: false,
    name: 'agent-loop',
    now: new Date(2026, 7, 30),
    repoRoot: workspaceRoot,
  });

  const appRoot = path.join(workspaceRoot, 'app');
  await mkdir(path.join(appRoot, 'node_modules', '@nocobase'), {
    recursive: true,
  });
  await mkdir(path.join(workspaceRoot, 'node_modules', '@nocobase'), {
    recursive: true,
  });
  await writeFile(
    path.join(appRoot, 'package.json'),
    `${JSON.stringify({ name: '@nocobase/agent-loop-app', private: true }, null, 2)}\n`,
  );
  await mkdir(path.join(appRoot, 'client'));
  await writeFile(
    path.join(appRoot, 'client', 'runtime.ts'),
    `export default {
  packageName: '@nocobase/agent-loop-app',
  config: async () => ({}),
  serviceProviders: [],
  reactProviders: [],
  routes: [],
  locales: {},
  plugins: [],
};\n`,
  );
  for (const dependency of ['typescript', 'prettier', 'tsx']) {
    await symlink(
      moduleDirectory(dependency),
      path.join(appRoot, 'node_modules', dependency),
      'junction',
    );
  }
  for (const dependency of FIXTURE_DEPENDENCIES) {
    const packageDirectory = declaredDependencyDirectory(dependency);
    for (const modulesRoot of [
      path.join(appRoot, 'node_modules'),
      path.join(workspaceRoot, 'node_modules'),
    ]) {
      await symlink(
        packageDirectory,
        path.join(modulesRoot, ...dependency.split('/')),
        'junction',
      );
    }
  }
  await symlink(
    generated.targetDirectory,
    path.join(appRoot, 'node_modules', '@nocobase', 'app-plugin-agent-loop'),
    'junction',
  );
  return { appRoot, pluginRoot: generated.targetDirectory };
}

describe('Agent plugin development loop', () => {
  it.each([
    ['client-only', ['client.routes', 'client.components'], true, false, false],
    [
      'server-only',
      ['server.service-providers', 'server.routes', 'server.jobs'],
      false,
      true,
      false,
    ],
    [
      'full-stack',
      [
        'client.routes',
        'client.components',
        'server.service-providers',
        'server.routes',
        'skills',
      ],
      true,
      true,
      true,
    ],
  ] as const)(
    'creates, previews, registers, and inspects a %s plugin',
    async (
      _shape,
      capabilities,
      expectsClient,
      expectsServer,
      expectsSkill,
    ) => {
      const { appRoot, pluginRoot } = await createLoopFixture(capabilities);
      const manifestBefore = await readFile(
        path.join(appRoot, 'package.json'),
        'utf8',
      );

      if (expectsSkill) {
        const sourceSkill = path.join(
          pluginRoot,
          'skills',
          'nocobase-app-plugin-agent-loop',
          'SKILL.md',
        );
        const draft = await readFile(sourceSkill, 'utf8');
        expect(draft).toContain('## Public surfaces');
        expect(draft).toContain('## Permissions and constraints');
        expect(draft).toContain('Development draft');
        expect(draft).not.toContain('/api/example');
        await writeFile(
          sourceSkill,
          `---\nname: nocobase-app-plugin-agent-loop\ndescription: Integrate the implemented Agent Loop plugin capability into an App.\n---\n\n# Agent Loop\n\nUse the plugin's implemented public surfaces and verify the result in the App.\n`,
        );
      }

      const preview = await runCommand(config, 'plugin:register', [
        'agent-loop',
        '--dir',
        appRoot,
        '--no-install',
        '--dry-run',
        '--json',
      ]);
      const previewResult = JSON.parse(preview.stdout) as {
        status: string;
        result: {
          plan: {
            clientPluginsChanged: boolean;
            serverPluginsChanged: boolean;
          };
        };
      };
      expect(previewResult.status).toBe('success-noop');
      expect(previewResult.result.plan.clientPluginsChanged).toBe(
        expectsClient,
      );
      expect(previewResult.result.plan.serverPluginsChanged).toBe(
        expectsServer,
      );
      expect(await readFile(path.join(appRoot, 'package.json'), 'utf8')).toBe(
        manifestBefore,
      );
      expect(existsSync(path.join(appRoot, 'client', 'plugins.ts'))).toBe(
        false,
      );
      expect(existsSync(path.join(appRoot, 'server', 'plugins.ts'))).toBe(
        false,
      );

      const registered = await runCommand(config, 'plugin:register', [
        'agent-loop',
        '--dir',
        appRoot,
        '--no-install',
        '--json',
      ]);
      expect(JSON.parse(registered.stdout)).toMatchObject({
        ok: true,
        command: 'plugin register',
        status: 'success',
      });
      expect(existsSync(path.join(appRoot, 'client', 'plugins.ts'))).toBe(
        expectsClient,
      );
      expect(existsSync(path.join(appRoot, 'server', 'plugins.ts'))).toBe(
        expectsServer,
      );
      expect(
        existsSync(
          path.join(
            appRoot,
            '.agents',
            'skills',
            'nocobase-app-plugin-agent-loop',
            'SKILL.md',
          ),
        ),
      ).toBe(expectsSkill);

      const inspected = await runCommand(config, 'plugin:inspect', [
        'agent-loop',
        '--dir',
        appRoot,
        '--json',
      ]);
      expect(JSON.parse(inspected.stdout)).toMatchObject({
        ok: true,
        command: 'plugin inspect',
        status: 'success',
        result: {
          plugin: {
            exports: { client: expectsClient, serverPlugin: expectsServer },
          },
          composition: {
            client: { registered: expectsClient },
            server: { registered: expectsServer },
          },
          consistent: true,
          issues: [],
        },
      });

      const repeated = await runCommand(config, 'plugin:register', [
        'agent-loop',
        '--dir',
        appRoot,
        '--no-install',
        '--json',
      ]);
      expect(JSON.parse(repeated.stdout)).toMatchObject({
        ok: true,
        command: 'plugin register',
        status: 'success-noop',
      });

      if (expectsSkill) {
        const sourceSkill = path.join(
          pluginRoot,
          'skills',
          'nocobase-app-plugin-agent-loop',
          'SKILL.md',
        );
        const synchronizedSkill = path.join(
          appRoot,
          '.agents',
          'skills',
          'nocobase-app-plugin-agent-loop',
          'SKILL.md',
        );
        const updatedSkill = `${await readFile(sourceSkill, 'utf8')}\nUpdated after registration.\n`;
        await writeFile(sourceSkill, updatedSkill);

        const stale = await runCommand(config, 'plugin:inspect', [
          'agent-loop',
          '--dir',
          appRoot,
          '--json',
        ]);
        expect(JSON.parse(stale.stdout)).toMatchObject({
          result: {
            consistent: false,
            issues: [{ code: 'SKILLS_OUT_OF_DATE' }],
          },
        });

        await runCommand(config, 'skills:sync', [
          '--dir',
          appRoot,
          '--plugin',
          'agent-loop',
        ]);
        expect(await readFile(synchronizedSkill, 'utf8')).toBe(updatedSkill);
      }

      await runCommand(config, 'plugin:unregister', [
        'agent-loop',
        '--dir',
        appRoot,
        '--no-install',
      ]);
      if (expectsClient) {
        expect(
          await readFile(path.join(appRoot, 'client', 'plugins.ts'), 'utf8'),
        ).not.toContain('@nocobase/app-plugin-agent-loop');
      }
      if (expectsServer) {
        expect(
          await readFile(path.join(appRoot, 'server', 'plugins.ts'), 'utf8'),
        ).not.toContain('@nocobase/app-plugin-agent-loop');
      }
      expect(
        existsSync(
          path.join(
            appRoot,
            '.agents',
            'skills',
            'nocobase-app-plugin-agent-loop',
          ),
        ),
      ).toBe(false);
    },
  );
});
