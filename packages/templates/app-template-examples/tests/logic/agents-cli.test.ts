// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appCliConfigOf, type AppCliBrand } from '@nocobase/app-cli-client';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { afterAll, beforeAll, expect, it } from 'vitest';
import appRuntime from '../../server/runtime.ts';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(
  await readFile(path.join(rootDir, 'package.json'), 'utf8'),
) as {
  version: string;
  nocobase: { cli?: AppCliBrand };
  devDependencies: Record<string, string>;
};
let directory: string;
let configPath: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'examples-agents-cli-'));
  configPath = path.join(directory, 'config.yml');
  await writeFile(configPath, '{}');
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

it('declares a business CLI and the packages required to build it and the Runner', () => {
  expect(manifest.nocobase.cli).toMatchObject({
    bin: 'nocobase-examples',
    auth: { clientId: 'nocobase-cli' },
  });
  expect(manifest.devDependencies['@nocobase/app-cli-client']).toBeTruthy();
  expect(manifest.devDependencies['@nocobase/agent-runner']).toBeTruthy();
});

it.each([
  { appName: 'main', basePath: '/main' },
  { appName: 'custom', basePath: '/custom' },
  { appName: 'embedded', basePath: '/nested/examples' },
])(
  'serves the branded CLI without changing the $appName Runner registration identity',
  async ({ appName, basePath }) => {
    const runtime = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir,
      configPath,
      appName,
      basePath,
      env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
    });
    expect(runtime.config.get<AgentsConfig>('agents')).toMatchObject({
      app: { id: appName, name: appName },
      cli: { name: manifest.nocobase.cli?.bin, package: { kind: 'served' } },
    });
  },
);

it('uses the same run credential file as the branded business client', async () => {
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir,
    configPath,
    env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
  });
  const cli = runtime.config.get<AgentsConfig>('agents')!.cli!;
  const client = appCliConfigOf(manifest.nocobase.cli!, {
    packageRoot: directory,
    version: manifest.version,
  });
  expect(client.bin).toBe(cli.name);
  expect(client.runCredentialsFile).toBe(
    cli.credentialFile ?? `.${cli.name}/run.json`,
  );
});

it('preserves explicit application-owned Runner and CLI overrides', async () => {
  const overridePath = path.join(directory, 'overrides.yml');
  await writeFile(
    overridePath,
    'agents:\n  app:\n    id: existing-app\n    name: Existing application\n  cli:\n    name: custom-cli\n    package:\n      kind: preinstalled\n    credentialFile: .custom/run.json\n',
  );
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir,
    configPath: overridePath,
    env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
  });
  expect(runtime.config.get<AgentsConfig>('agents')).toMatchObject({
    app: { id: 'existing-app', name: 'Existing application' },
    cli: {
      name: 'custom-cli',
      package: { kind: 'preinstalled' },
      credentialFile: '.custom/run.json',
    },
  });
});
