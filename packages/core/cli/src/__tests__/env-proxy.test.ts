/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { ManagedAppRuntime } from '../lib/app-runtime.js';
import { setCliConfigValue } from '../lib/cli-config.js';
import {
  buildEnvProxyAppConfig,
  buildEnvProxyConfig,
  buildEnvProxyMainConfig,
  mapProxyPathFromCliRoot,
  parseNginxConfPathFromVersionOutput,
  resolveProxyNbCliRoot,
  resolveEnvProxyAppOutputPath,
  resolveEnvProxyProvider,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyOutputPath,
} from '../lib/env-proxy.ts';

const createdRoots: string[] = [];

afterEach(async () => {
  for (const dir of createdRoots.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
  delete process.env.NB_CLI_ROOT;
});

async function createTempRoot(prefix: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  createdRoots.push(root);
  return root;
}

test('buildEnvProxyConfig reads local env file settings and maps /dist/ to storage/dist-client', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-local-');
  const appPath = path.join(root, 'app');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(root, 'storage');
  await mkdir(projectRoot, { recursive: true });
  await mkdir(storagePath, { recursive: true });
  await writeFile(
    path.join(appPath, '.env'),
    ['APP_PUBLIC_PATH=/console/', 'APP_MODERN_CLIENT_PREFIX=admin', 'API_BASE_PATH=/api/', 'WS_PATH=/ws'].join('\n'),
  );

  const runtime = {
    kind: 'local',
    envName: 'demo',
    source: 'npm',
    projectRoot,
    env: {
      config: {
        appPath,
        storagePath,
        appPort: '13000',
      },
      appPort: '13000',
      storagePath,
      runtime: {
        version: '2.1.0-beta.44',
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;

  const result = await buildEnvProxyConfig(runtime);

  expect(result.envFilePath).toBe(path.join(appPath, '.env'));
  expect(result.apiBasePath).toBe('/console/api/');
  expect(result.wsPath).toBe('/console/ws');
  expect(result.distPath).toBe('/console/dist/');
  expect(result.v2PublicPath).toBe('/console/admin/');
  expect(result.pluginStaticsPath).toBe('/console/static/plugins/');
  expect(result.distClientRoot).toBe(path.join(storagePath, 'dist-client'));
  expect(result.content).not.toContain('map $http_upgrade $connection_upgrade');
  expect(result.content).not.toContain('server {');
  expect(result.content).toContain('location ^~ /console/api/');
  expect(result.content).toContain('location ^~ /console/dist/');
  expect(result.content).toContain(`alias ${path.join(storagePath, 'dist-client')}/;`);
});

test('buildEnvProxyConfig falls back to docker defaults when no env file exists', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-docker-');
  const storagePath = path.join(root, 'storage');
  await mkdir(storagePath, { recursive: true });
  process.env.NB_CLI_ROOT = root;

  const runtime = {
    kind: 'docker',
    envName: 'docker-demo',
    source: 'docker',
    workspaceName: 'demo-network',
    dockerNetworkName: 'demo-network',
    dockerContainerPrefix: 'demo',
    containerName: 'demo-app',
    env: {
      config: {
        storagePath,
        appPort: '13080',
        downloadVersion: 'next-full',
      },
      appPort: '13080',
      storagePath,
      runtime: undefined,
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'docker' }>;

  const result = await buildEnvProxyConfig(runtime);

  expect(result.envFilePath).toBe(undefined);
  expect(result.apiBasePath).toBe('/api/');
  expect(result.wsPath).toBe('/ws');
  expect(result.v2PublicPath).toBe('/v/');
  expect(result.runtimeVersion).toBe('next-full');
});

test('buildEnvProxyConfig maps rendered filesystem paths through proxy.nb-cli-root', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-runtime-root-');
  const appPath = path.join(root, 'app14353');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(appPath, 'storage');
  process.env.NB_CLI_ROOT = root;
  await mkdir(projectRoot, { recursive: true });
  await mkdir(storagePath, { recursive: true });
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  const runtime = {
    kind: 'local',
    envName: 'demo',
    source: 'npm',
    projectRoot,
    env: {
      config: {
        appPath,
        storagePath,
        appPort: '13000',
      },
      appPort: '13000',
      storagePath,
      runtime: {
        version: '2.1.0-beta.44',
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;

  const result = await buildEnvProxyConfig(runtime, { scope: 'global' });

  expect(await resolveProxyNbCliRoot({ scope: 'global' })).toBe('/workspace');
  expect(result.distClientRoot).toBe('/workspace/app14353/storage/dist-client');
  expect(result.uploadsPath).toBe('/workspace/app14353/storage/uploads');
  expect(result.content).toContain('alias /workspace/app14353/storage/dist-client/;');
  expect(result.content).toContain('alias /workspace/app14353/storage/uploads/;');
  expect(
    await mapProxyPathFromCliRoot(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo', 'generated.conf'), {
      scope: 'global',
    }),
  ).toBe('/workspace/.nocobase/proxy/nginx/demo/generated.conf');
});

test('buildEnvProxyConfig uses proxy.upstream-host for proxy_pass targets', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-host-');
  const appPath = path.join(root, 'app');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(root, 'storage');
  process.env.NB_CLI_ROOT = root;
  await mkdir(projectRoot, { recursive: true });
  await mkdir(storagePath, { recursive: true });
  await setCliConfigValue('proxy.upstream-host', 'host.docker.internal', { scope: 'global' });

  const runtime = {
    kind: 'local',
    envName: 'demo',
    source: 'npm',
    projectRoot,
    env: {
      config: {
        appPath,
        storagePath,
        appPort: '13000',
      },
      appPort: '13000',
      storagePath,
      runtime: {
        version: '2.1.0-beta.44',
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;

  const result = await buildEnvProxyConfig(runtime, { scope: 'global' });

  expect(result.content).toContain('proxy_pass http://host.docker.internal:13000;');
  expect(result.content).toContain('proxy_pass http://host.docker.internal:13000/ws;');
});

test('resolveEnvProxyOutputPath defaults to ~/.nocobase/proxy/<env>/generated.conf', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-output-');
  process.env.NB_CLI_ROOT = root;

  expect(resolveEnvProxyOutputPath('staging')).toBe(
    path.join(root, '.nocobase', 'proxy', 'nginx', 'staging', 'generated.conf'),
  );
  expect(resolveEnvProxyAppOutputPath('staging')).toBe(
    path.join(root, '.nocobase', 'proxy', 'nginx', 'staging', 'app.conf'),
  );
  expect(resolveEnvProxyMainOutputPath()).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'nocobase.conf'));
  expect(resolveEnvProxyOutputPath('staging', { provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging', 'generated.caddy'),
  );
  expect(resolveEnvProxyAppOutputPath('staging', { provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging', 'app.caddy'),
  );
  expect(resolveEnvProxyMainOutputPath({ provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'nocobase.caddy'),
  );
  expect(resolveEnvProxyOutputPath('staging', { output: './custom/generated.conf' })).toBe(
    path.resolve(process.cwd(), './custom/generated.conf'),
  );
});

test('buildEnvProxyAppConfig creates an editable entry that includes the generated config by absolute path', () => {
  const generatedConfigPath = '/tmp/nocobase/proxy/demo/generated.conf';

  expect(buildEnvProxyAppConfig('nginx', generatedConfigPath)).toBe(`server {
    listen 80;
    server_name _;
    client_max_body_size 0;

    # BEGIN NocoBase generated routes
    # Keep this include so \`nb env proxy\` can refresh managed routes.
    include ${generatedConfigPath};
    # END NocoBase generated routes
}
`);
  expect(buildEnvProxyAppConfig('caddy', '/tmp/nocobase/proxy/demo/generated.caddy')).toBe(`:80 {
    # BEGIN NocoBase generated routes
    # Keep this import so \`nb env proxy\` can refresh managed routes.
    import ./generated.caddy
    # END NocoBase generated routes
}
`);
  expect(buildEnvProxyAppConfig('nginx', generatedConfigPath, { host: 'a.local.nocobase.com', port: '8080' })).toBe(
    `server {
    listen 8080;
    server_name a.local.nocobase.com;
    client_max_body_size 0;

    # BEGIN NocoBase generated routes
    # Keep this include so \`nb env proxy\` can refresh managed routes.
    include ${generatedConfigPath};
    # END NocoBase generated routes
}
`,
  );
  expect(
    buildEnvProxyAppConfig('caddy', '/tmp/nocobase/proxy/demo/generated.caddy', {
      host: 'a.local.nocobase.com',
      port: '8080',
    }),
  ).toBe(`a.local.nocobase.com:8080 {
    # BEGIN NocoBase generated routes
    # Keep this import so \`nb env proxy\` can refresh managed routes.
    import ./generated.caddy
    # END NocoBase generated routes
}
`);
  expect(
    buildEnvProxyAppConfig('caddy', '/tmp/nocobase/proxy/demo/generated.caddy', {
      host: 'a.local.nocobase.com',
    }),
  ).toBe(`a.local.nocobase.com {
    # BEGIN NocoBase generated routes
    # Keep this import so \`nb env proxy\` can refresh managed routes.
    import ./generated.caddy
    # END NocoBase generated routes
}
`);
});

test('buildEnvProxyMainConfig includes shared nginx directives and wildcard app.conf include', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-main-');
  process.env.NB_CLI_ROOT = root;

  const content = await buildEnvProxyMainConfig();

  expect(content).toContain('map $http_upgrade $connection_upgrade');
  expect(content).toContain('gzip on;');
  expect(content).toContain(`include ${path.join(root, '.nocobase', 'proxy', 'nginx', '*', 'app.conf')};`);
});

test('buildEnvProxyMainConfig maps wildcard app.conf include through proxy.nb-cli-root', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-main-runtime-root-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  const content = await buildEnvProxyMainConfig();

  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/*/app.conf;');
});

test('buildEnvProxyMainConfig creates a provider-local Caddy import file', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-main-');
  process.env.NB_CLI_ROOT = root;
  const content = await buildEnvProxyMainConfig({ provider: 'caddy' });

  expect(content).toContain(`import ${path.join(root, '.nocobase', 'proxy', 'caddy', '*', 'app.caddy')}`);
  expect(content).not.toContain('include ');
});

test('buildEnvProxyMainConfig maps the Caddy app import through proxy.nb-cli-root', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-main-runtime-root-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  const content = await buildEnvProxyMainConfig({ provider: 'caddy' });

  expect(content).toContain('import /workspace/.nocobase/proxy/caddy/*/app.caddy');
});

test('buildEnvProxyConfig renders a Caddy route config when provider is caddy', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-');
  const appPath = path.join(root, 'app');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(root, 'storage');
  await mkdir(projectRoot, { recursive: true });
  await mkdir(storagePath, { recursive: true });

  const runtime = {
    kind: 'local',
    envName: 'demo',
    source: 'npm',
    projectRoot,
    env: {
      config: {
        appPath,
        storagePath,
        appPort: '13000',
      },
      appPort: '13000',
      storagePath,
      runtime: {
        version: '2.1.0-beta.44',
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;

  const result = await buildEnvProxyConfig(runtime, { provider: 'caddy' });

  expect(result.content).toContain('route {');
  expect(result.content).toContain('encode zstd gzip');
  expect(result.content).toContain('handle_path /dist/*');
  expect(result.content).toContain('reverse_proxy 127.0.0.1:13000');
});

test('buildEnvProxyConfig renders explicit Caddy redir targets when app public path is not root', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-public-path-');
  const appPath = path.join(root, 'app');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(root, 'storage');
  await mkdir(projectRoot, { recursive: true });
  await mkdir(storagePath, { recursive: true });

  const runtime = {
    kind: 'local',
    envName: 'demo',
    source: 'npm',
    projectRoot,
    env: {
      config: {
        appPath,
        appPublicPath: '/nocobase/',
        storagePath,
        appPort: '13000',
      },
      appPort: '13000',
      storagePath,
      runtime: {
        version: '2.1.0-beta.44',
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;

  const result = await buildEnvProxyConfig(runtime, { provider: 'caddy' });

  expect(result.content).toContain('redir * /nocobase/ 302');
  expect(result.content).toContain('redir * /nocobase/v/ 302');
  expect(result.content).toContain('redir * /nocobase{uri} 302');
});

test('resolveEnvProxyProvider falls back to the configured or default provider', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-provider-');
  process.env.NB_CLI_ROOT = root;

  expect(await resolveEnvProxyProvider(undefined)).toBe('nginx');

  await setCliConfigValue('proxy.provider', 'caddy', { scope: 'global' });
  expect(await resolveEnvProxyProvider(undefined)).toBe('caddy');
  expect(await resolveEnvProxyProvider('nginx')).toBe('nginx');
  expect(await resolveEnvProxyProvider('caddy')).toBe('caddy');
});

test('parseNginxConfPathFromVersionOutput extracts the configured nginx.conf path', async () => {
  expect(
    parseNginxConfPathFromVersionOutput(
      'nginx version: nginx/1.27.5\nconfigure arguments: --prefix=/opt/homebrew --conf-path=/opt/homebrew/etc/nginx/nginx.conf --pid-path=/tmp/nginx.pid',
    ),
  ).toBe('/opt/homebrew/etc/nginx/nginx.conf');
});
