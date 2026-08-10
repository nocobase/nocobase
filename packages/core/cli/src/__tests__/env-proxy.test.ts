/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { ManagedAppRuntime } from '../lib/app-runtime.js';
import { setCliConfigValue } from '../lib/cli-config.js';
import { writeNginxProxyBundle } from '../lib/proxy-nginx.js';
import {
  appConfigHasManagedNginxBlock,
  buildEnvProxyAppConfig,
  buildEnvProxyCaddyBundle,
  buildManualEnvProxyCaddyBundle,
  buildManualEnvProxyNginxBundle,
  buildEnvProxyConfig,
  buildEnvProxyMainConfig,
  buildEnvProxyNginxBundle,
  extractManagedNginxConfigBlock,
  mapProxyPathFromCliRoot,
  parseNginxConfPathFromVersionOutput,
  replaceManagedNginxConfigBlock,
  resolveEnvProxyAppOutputPath,
  resolveEnvProxyCaddyIndexOutputPath,
  resolveEnvProxyCaddyPublicOutputDir,
  resolveEnvProxyEntryDir,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyNginxIndexOutputPath,
  resolveEnvProxyNginxPublicOutputDir,
  resolveEnvProxyNginxSnippetsOutputDir,
  resolveProxyNbCliRoot,
  syncEnvProxyNginxSnippets,
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

async function createLocalRuntime(
  root: string,
  options?: {
    appPublicPath?: string;
    modernClientPrefix?: string;
    sourceV1PublicPath?: string;
    sourceV2PublicPath?: string;
    cdnBaseUrl?: string;
  },
): Promise<Extract<ManagedAppRuntime, { kind: 'local' }>> {
  const version = '2.1.0-beta.44';
  const appPath = path.join(root, 'app');
  const projectRoot = path.join(appPath, 'source');
  const storagePath = path.join(appPath, 'storage');
  const distRoot = path.join(storagePath, 'dist-client');
  const versionRoot = path.join(distRoot, version);
  const sourceV1PublicPath = options?.sourceV1PublicPath ?? options?.appPublicPath ?? '/';
  const sourceV2PublicPath = options?.sourceV2PublicPath ?? '/v/';
  const appPublicPath = options?.appPublicPath ?? '/';
  const modernClientPrefix = options?.modernClientPrefix ?? 'v';
  const envLines = [
    `APP_PUBLIC_PATH=${appPublicPath}`,
    `APP_MODERN_CLIENT_PREFIX=${modernClientPrefix}`,
    'API_BASE_PATH=/api/',
    'WS_PATH=/ws',
    ...(options?.cdnBaseUrl ? [`CDN_BASE_URL=${options.cdnBaseUrl}`] : []),
  ];

  await mkdir(projectRoot, { recursive: true });
  await mkdir(path.join(versionRoot, 'v'), { recursive: true });
  await writeFile(path.join(appPath, '.env'), envLines.join('\n'));
  await writeFile(path.join(distRoot, 'active-version'), version);
  await writeFile(
    path.join(versionRoot, 'index.html'),
    [
      '<!doctype html>',
      '<html><head>',
      `<script>window['__webpack_public_path__'] = '${sourceV1PublicPath}';`,
      `window['__nocobase_public_path__'] = '${sourceV1PublicPath}';`,
      `window['__nocobase_api_base_url__'] = '${
        sourceV1PublicPath === '/' ? '/api/' : `${sourceV1PublicPath.replace(/\/$/, '')}/api/`
      }';</script>`,
      `<script src="${sourceV1PublicPath}browser-checker.js?v=1"></script>`,
      `<script type="module" src="${sourceV1PublicPath}assets/runtime.js"></script>`,
      `<link rel="stylesheet" href="${sourceV1PublicPath}assets/index.css">`,
      '</head><body></body></html>',
    ].join(''),
  );
  await writeFile(
    path.join(versionRoot, 'v', 'index.html'),
    [
      '<!doctype html>',
      '<html><head>',
      `<script>window['__nocobase_public_path__'] = window['__nocobase_public_path__'] || "${sourceV2PublicPath}";`,
      `window['__nocobase_api_base_url__'] = window['__nocobase_api_base_url__'] || "${
        sourceV1PublicPath === '/' ? '/api/' : `${sourceV1PublicPath.replace(/\/$/, '')}/api/`
      }";</script>`,
      `<script src="${sourceV2PublicPath}browser-checker.js?v=1"></script>`,
      `<script type="module" src="${sourceV2PublicPath}assets/runtime.js"></script>`,
      `<link rel="stylesheet" href="${sourceV2PublicPath}assets/index.css">`,
      '</head><body></body></html>',
    ].join(''),
  );

  return {
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
        version,
      },
    },
  } as unknown as Extract<ManagedAppRuntime, { kind: 'local' }>;
}

test('buildEnvProxyNginxBundle renders app.conf and index HTML with CDN-prefixed assets', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-bundle-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    modernClientPrefix: 'admin',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });

  const bundle = await buildEnvProxyNginxBundle(runtime, { scope: 'global' });

  expect(await resolveProxyNbCliRoot({ scope: 'global' })).toBe('/workspace');
  expect(bundle.entryDir).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo'));
  expect(bundle.publicDir).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo', 'public'));
  expect(bundle.appConfigPath).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo', 'app.conf'));
  expect(bundle.indexV1Path).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo', 'public', 'index-v1.html'));
  expect(bundle.indexV2Path).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'demo', 'public', 'index-v2.html'));
  expect(bundle.cdnBaseUrl).toBe('/console/dist/2.1.0-beta.44/');
  expect(bundle.v2PublicPath).toBe('/console/admin/');
  expect(bundle.appConfigContent).toContain('# BEGIN NocoBase managed config');
  expect(bundle.appConfigContent).toContain('location / {');
  expect(bundle.appConfigContent).toContain('return 302 /console$uri$is_args$args;');
  expect(bundle.appConfigContent).toContain('location = /console/api {');
  expect(bundle.appConfigContent).toContain('return 308 /console/api/$is_args$args;');
  expect(bundle.appConfigContent.indexOf('location = /console/api {')).toBeLessThan(
    bundle.appConfigContent.indexOf('location ^~ /console/api/ {'),
  );
  expect(bundle.appConfigContent).toContain('location ^~ /console/admin/ {');
  expect(bundle.appConfigContent).toContain('alias /workspace/.nocobase/proxy/nginx/demo/public/;');
  expect(bundle.appConfigContent).toContain('try_files $uri /index-v2.html =404;');
  expect(bundle.appConfigContent).toContain('location ^~ /console/ {');
  expect(bundle.appConfigContent).toContain('try_files $uri /index-v1.html =404;');
  expect(bundle.appConfigContent.indexOf('location = /console/admin {')).toBeGreaterThan(
    bundle.appConfigContent.indexOf('location = /console/ws {'),
  );
  expect(bundle.appConfigContent.indexOf('location ^~ /console/admin/ {')).toBeGreaterThan(
    bundle.appConfigContent.indexOf('location = /console/admin {'),
  );
  expect(bundle.appConfigContent.indexOf('location / {')).toBeGreaterThan(
    bundle.appConfigContent.indexOf('location ^~ /console/ {'),
  );
  expect(bundle.mainConfigContent).toContain('include /workspace/.nocobase/proxy/nginx/snippets/log-format-http.conf;');
  expect(bundle.mainConfigContent).toContain('include /workspace/.nocobase/proxy/nginx/snippets/maps-http.conf;');
  expect(bundle.mainConfigContent).toContain('include /workspace/.nocobase/proxy/nginx/*/app.conf;');
  expect(bundle.indexV1Content).toContain(`window['__webpack_public_path__'] = "/console/dist/2.1.0-beta.44/";`);
  expect(bundle.indexV1Content).toContain(`window['__nocobase_public_path__'] = "/console/";`);
  expect(bundle.indexV1Content).toContain('src="/console/dist/2.1.0-beta.44/browser-checker.js?v=1"');
  expect(bundle.indexV1Content).toContain('src="/console/dist/2.1.0-beta.44/assets/runtime.js"');
  expect(bundle.indexV2Content).toContain(`window['__nocobase_public_path__'] = "/console/admin/";`);
  expect(bundle.indexV2Content).toContain(`window['__nocobase_modern_client_prefix__'] = "admin";`);
  expect(bundle.indexV2Content).toContain('src="/console/dist/2.1.0-beta.44/v/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="/console/dist/2.1.0-beta.44/v/assets/runtime.js"');
});

test('buildEnvProxyNginxBundle omits the root redirect block for root-mounted apps', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-root-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root);

  const bundle = await buildEnvProxyNginxBundle(runtime);

  expect(bundle.appConfigContent).toContain('location ^~ / {');
  expect(bundle.appConfigContent).toContain('location ^~ /v/ {');
  expect(bundle.appConfigContent).toContain('try_files $uri /index-v1.html =404;');
  expect(bundle.appConfigContent).not.toContain('return 302 /$is_args$args;');
});

test('buildManualEnvProxyNginxBundle derives the websocket path from appPublicPath', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-manual-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });

  const bundle = await buildManualEnvProxyNginxBundle({
    name: 'default',
    appPort: '13000',
    storagePath: runtime.env.storagePath,
    distRootPath: path.join(runtime.env.storagePath, 'dist-client'),
    runtimeVersion: '2.1.0-beta.44',
    appPublicPath: '/console/',
    upstreamHost: 'host.docker.internal',
  });

  expect(bundle.entryDir).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'default'));
  expect(bundle.wsPath).toBe('/console/ws');
  expect(bundle.backendUrl).toBe('http://host.docker.internal:13000');
  expect(bundle.appConfigContent).toContain('location = /console/ws {');
  expect(bundle.indexV1Content).toContain(`window['__nocobase_ws_path__'] = "/console/ws";`);
  expect(bundle.indexV2Content).toContain(`window['__nocobase_public_path__'] = "/console/v/";`);
});

test('buildManualEnvProxyNginxBundle uses an explicit CDN base url override', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-manual-cdn-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });

  const bundle = await buildManualEnvProxyNginxBundle({
    name: 'default',
    appPort: '13000',
    storagePath: runtime.env.storagePath,
    distRootPath: path.join(runtime.env.storagePath, 'dist-client'),
    runtimeVersion: '2.1.0-beta.44',
    appPublicPath: '/console/',
    cdnBaseUrl: 'https://cdn.example.com/ui/',
  });

  expect(bundle.cdnBaseUrl).toBe('https://cdn.example.com/ui/');
  expect(bundle.indexV1Content).toContain('src="https://cdn.example.com/ui/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="https://cdn.example.com/ui/v/browser-checker.js?v=1"');
});

test('buildManualEnvProxyNginxBundle reads versioned index files from distRootPath', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-manual-dist-root-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root);
  const distRootPath = path.join(root, 'custom-dist-client');
  const versionRoot = path.join(distRootPath, '2.1.0-beta.44');

  await mkdir(path.join(versionRoot, 'v'), { recursive: true });
  await writeFile(
    path.join(versionRoot, 'index.html'),
    '<!doctype html><html><head><script>window[\'__nocobase_public_path__\'] = \'/\';</script><script src="/custom/browser-checker.js?v=1"></script><script type="module" src="/custom/assets/runtime.js"></script></head><body></body></html>',
  );
  await writeFile(
    path.join(versionRoot, 'v', 'index.html'),
    '<!doctype html><html><head><script>window[\'__nocobase_public_path__\'] = window[\'__nocobase_public_path__\'] || "/v/";</script><script src="/custom-v/browser-checker.js?v=1"></script><script type="module" src="/custom-v/assets/runtime.js"></script></head><body></body></html>',
  );

  const bundle = await buildManualEnvProxyNginxBundle({
    name: 'default',
    appPort: '13000',
    storagePath: runtime.env.storagePath,
    distRootPath,
    runtimeVersion: '2.1.0-beta.44',
    appPublicPath: '/',
  });

  expect(bundle.appConfigContent).toContain(`alias ${distRootPath}/;`);
  expect(bundle.indexV1Content).toContain('src="/dist/2.1.0-beta.44/custom/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="/custom-v/browser-checker.js?v=1"');
});

test('writeNginxProxyBundle overwrites non-managed app.conf when force is enabled', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-force-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root);
  const bundle = await buildEnvProxyNginxBundle(runtime);

  await mkdir(bundle.entryDir, { recursive: true });
  await writeFile(bundle.appConfigPath, 'server {\n    listen 9000;\n}\n', 'utf8');

  const result = await writeNginxProxyBundle(
    runtime,
    {
      port: '8080',
    },
    {
      driver: 'local',
      runtimeCliRoot: root,
      upstreamHost: '127.0.0.1',
    },
    {
      force: true,
    },
  );

  const content = await readFile(bundle.appConfigPath, 'utf8');
  expect(result.status).toBe('updated');
  expect(content).toContain('# BEGIN NocoBase managed config');
  expect(content).toContain('listen 8080;');
});

test('buildEnvProxyNginxBundle prefers CDN_BASE_URL from the managed env file', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-cdn-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    cdnBaseUrl: 'https://cdn.example.com/ui/',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });

  const bundle = await buildEnvProxyNginxBundle(runtime);

  expect(bundle.cdnBaseUrl).toBe('https://cdn.example.com/ui/');
  expect(bundle.indexV1Content).toContain('src="https://cdn.example.com/ui/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="https://cdn.example.com/ui/v/browser-checker.js?v=1"');
});

test('buildEnvProxyNginxBundle prefers saved CDN_BASE_URL over the managed env file', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-saved-cdn-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    cdnBaseUrl: 'https://cdn-from-env-file.example.com/ui/',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });
  runtime.env.envVars = {
    ...runtime.env.envVars,
    CDN_BASE_URL: 'https://cdn-from-config.example.com/ui/',
  };
  runtime.env.config = {
    ...runtime.env.config,
    cdnBaseUrl: 'https://cdn-from-config.example.com/ui/',
  };

  const bundle = await buildEnvProxyNginxBundle(runtime);

  expect(bundle.cdnBaseUrl).toBe('https://cdn-from-config.example.com/ui/');
  expect(bundle.indexV1Content).toContain('src="https://cdn-from-config.example.com/ui/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="https://cdn-from-config.example.com/ui/v/browser-checker.js?v=1"');
});

test('buildEnvProxyNginxBundle prefers an explicit CDN base url override over saved env values', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-explicit-cdn-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    cdnBaseUrl: 'https://cdn-from-env-file.example.com/ui/',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });
  runtime.env.envVars = {
    ...runtime.env.envVars,
    CDN_BASE_URL: 'https://cdn-from-config.example.com/ui/',
  };

  const bundle = await buildEnvProxyNginxBundle(runtime, {
    cdnBaseUrl: 'https://cdn-from-command.example.com/ui/',
  });

  expect(bundle.cdnBaseUrl).toBe('https://cdn-from-command.example.com/ui/');
  expect(bundle.indexV1Content).toContain('src="https://cdn-from-command.example.com/ui/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="https://cdn-from-command.example.com/ui/v/browser-checker.js?v=1"');
});

test('buildEnvProxyNginxBundle avoids duplicating a dist prefix already present in asset urls', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-duplicate-dist-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/',
    sourceV1PublicPath: '/',
    sourceV2PublicPath: '/v/',
  });
  const versionRoot = path.join(runtime.env.storagePath, 'dist-client', '2.1.0-beta.44');
  const v1IndexPath = path.join(versionRoot, 'index.html');
  const v2IndexPath = path.join(versionRoot, 'v', 'index.html');
  const v1Html = await readFile(v1IndexPath, 'utf8');
  const v2Html = await readFile(v2IndexPath, 'utf8');

  await writeFile(
    v1IndexPath,
    v1Html
      .replace(`src="/browser-checker.js?v=1"`, `src="/dist/2.1.0-beta.44/browser-checker.js?v=1"`)
      .replace(`src="/assets/runtime.js"`, `src="/dist/2.1.0-beta.44/assets/runtime.js"`)
      .replace(`href="/assets/index.css"`, `href="/dist/2.1.0-beta.44/assets/index.css"`),
  );
  await writeFile(
    v2IndexPath,
    v2Html
      .replace(`src="/v/browser-checker.js?v=1"`, `src="/dist/2.1.0-beta.44/v/browser-checker.js?v=1"`)
      .replace(`src="/v/assets/runtime.js"`, `src="/dist/2.1.0-beta.44/v/assets/runtime.js"`)
      .replace(`href="/v/assets/index.css"`, `href="/dist/2.1.0-beta.44/v/assets/index.css"`),
  );

  const bundle = await buildEnvProxyNginxBundle(runtime);

  expect(bundle.indexV1Content).toContain('src="/dist/2.1.0-beta.44/browser-checker.js?v=1"');
  expect(bundle.indexV1Content).toContain('src="/dist/2.1.0-beta.44/assets/runtime.js"');
  expect(bundle.indexV1Content).toContain('href="/dist/2.1.0-beta.44/assets/index.css"');
  expect(bundle.indexV1Content).not.toContain('/dist/2.1.0-beta.44/dist/2.1.0-beta.44/');
  expect(bundle.indexV2Content).toContain('src="/dist/2.1.0-beta.44/v/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="/dist/2.1.0-beta.44/v/assets/runtime.js"');
  expect(bundle.indexV2Content).toContain('href="/dist/2.1.0-beta.44/v/assets/index.css"');
  expect(bundle.indexV2Content).not.toContain('/dist/2.1.0-beta.44/v/dist/2.1.0-beta.44/v/');
});

test('syncEnvProxyNginxSnippets copies nginx snippets into the provider snippets directory', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-snippets-');
  process.env.NB_CLI_ROOT = root;

  const outputDir = await syncEnvProxyNginxSnippets();
  const entries = (await readdir(outputDir)).sort();

  expect(outputDir).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'snippets'));
  expect(entries).toEqual(
    expect.arrayContaining([
      'dist-location.conf',
      'gzip.conf',
      'log-format-http.conf',
      'maps-http.conf',
      'mime-types.conf',
      'proxy-location.conf',
      'spa-location.conf',
      'uploads-location.conf',
    ]),
  );
  expect(await readFile(path.join(outputDir, 'uploads-location.conf'), 'utf8')).toContain(
    'location ~* \\.(?:htm|html|pdf|svg|svgz|xht|xhtml|xml|xsl|xslt)$',
  );
  expect(await readFile(path.join(outputDir, 'uploads-location.conf'), 'utf8')).toContain(
    'add_header Content-Security-Policy "sandbox" always;',
  );
});

test('replaceManagedNginxConfigBlock preserves user-edited content outside the managed block', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-nginx-managed-block-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
  });
  const bundle = await buildEnvProxyNginxBundle(runtime);
  const managedBlock = extractManagedNginxConfigBlock(bundle.appConfigContent);

  const appConfig = `server {\n    listen 8080;\n    server_name demo.local;\n\n    # BEGIN NocoBase managed config\n    old content\n    # END NocoBase managed config\n\n    add_header X-Demo true;\n}\n`;
  const replaced = replaceManagedNginxConfigBlock(appConfig, managedBlock ?? '');

  expect(appConfigHasManagedNginxBlock(replaced)).toBe(true);
  expect(replaced).toContain('listen 8080;');
  expect(replaced).toContain('server_name demo.local;');
  expect(replaced).toContain('add_header X-Demo true;');
  expect(replaced).toContain('location ^~ /console/api/ {');
  expect(replaced).not.toContain('old content');
});

test('buildEnvProxyConfig renders a full Caddy app config when provider is caddy', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-');
  const runtime = await createLocalRuntime(root);

  const result = await buildEnvProxyConfig(runtime, { provider: 'caddy' });

  expect(result.content).toContain(':80 {');
  expect(result.content).toContain('encode zstd gzip');
  expect(result.content).toContain('handle_path /dist/*');
  expect(result.content).toContain(
    '@activeUploadedContent path_regexp activeUploadedContent (?i)\\.(?:htm|html|pdf|svg|svgz|xht|xhtml|xml|xsl|xslt)$',
  );
  expect(result.content).toContain('header @activeUploadedContent Content-Disposition attachment');
  expect(result.content).toContain('header Content-Security-Policy sandbox');
  expect(result.content).toContain('try_files {path} /index-v1.html');
  expect(result.content).toContain('file_server');
  expect(result.content).toContain('reverse_proxy 127.0.0.1:13000');
});

test('buildEnvProxyConfig renders explicit Caddy redirects when app public path is not root', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-public-path-');
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/nocobase/',
  });

  const result = await buildEnvProxyConfig(runtime, { provider: 'caddy' });

  expect(result.content).toContain('redir * /nocobase/ 302');
  expect(result.content).toContain('redir * /nocobase/v/ 302');
  expect(result.content).toContain('redir * /nocobase{uri} 302');
});

test('buildEnvProxyCaddyBundle renders app.caddy and index HTML files', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-bundle-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  const runtime = await createLocalRuntime(root, {
    appPublicPath: '/console/',
    modernClientPrefix: 'admin',
    sourceV1PublicPath: '/nocobase/',
    sourceV2PublicPath: '/v/',
  });

  const bundle = await buildEnvProxyCaddyBundle(runtime, { scope: 'global' });

  expect(bundle.entryDir).toBe(path.join(root, '.nocobase', 'proxy', 'caddy', 'demo'));
  expect(bundle.publicDir).toBe(path.join(root, '.nocobase', 'proxy', 'caddy', 'demo', 'public'));
  expect(bundle.appConfigPath).toBe(path.join(root, '.nocobase', 'proxy', 'caddy', 'demo', 'app.caddy'));
  expect(bundle.indexV1Path).toBe(path.join(root, '.nocobase', 'proxy', 'caddy', 'demo', 'public', 'index-v1.html'));
  expect(bundle.indexV2Path).toBe(path.join(root, '.nocobase', 'proxy', 'caddy', 'demo', 'public', 'index-v2.html'));
  expect(bundle.appConfigContent).toContain(':80 {');
  expect(bundle.appConfigContent).not.toContain('route {');
  expect(bundle.appConfigContent).toContain('handle_path /console/admin/* {');
  expect(bundle.appConfigContent).toContain('try_files {path} /index-v2.html');
  expect(bundle.appConfigContent).toContain('root * /workspace/.nocobase/proxy/caddy/demo/public');
  expect(bundle.mainConfigContent).toContain('import /workspace/.nocobase/proxy/caddy/*/app.caddy');
  expect(bundle.indexV1Content).toContain(`window['__webpack_public_path__'] = "/console/dist/2.1.0-beta.44/";`);
  expect(bundle.indexV1Content).toContain(`window['__nocobase_public_path__'] = "/console/";`);
  expect(bundle.indexV2Content).toContain(`window['__nocobase_public_path__'] = "/console/admin/";`);
  expect(bundle.indexV2Content).toContain(`window['__nocobase_modern_client_prefix__'] = "admin";`);
});

test('buildManualEnvProxyCaddyBundle reads versioned index files from distRootPath', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-manual-dist-root-');
  process.env.NB_CLI_ROOT = root;
  const runtime = await createLocalRuntime(root);
  const distRootPath = path.join(root, 'custom-caddy-dist-client');
  const versionRoot = path.join(distRootPath, '2.1.0-beta.44');

  await mkdir(path.join(versionRoot, 'v'), { recursive: true });
  await writeFile(
    path.join(versionRoot, 'index.html'),
    '<!doctype html><html><head><script>window[\'__nocobase_public_path__\'] = \'/\';</script><script src="/caddy-custom/browser-checker.js?v=1"></script><script type="module" src="/caddy-custom/assets/runtime.js"></script></head><body></body></html>',
  );
  await writeFile(
    path.join(versionRoot, 'v', 'index.html'),
    '<!doctype html><html><head><script>window[\'__nocobase_public_path__\'] = window[\'__nocobase_public_path__\'] || "/v/";</script><script src="/caddy-custom-v/browser-checker.js?v=1"></script><script type="module" src="/caddy-custom-v/assets/runtime.js"></script></head><body></body></html>',
  );

  const bundle = await buildManualEnvProxyCaddyBundle({
    name: 'default',
    appPort: '13000',
    storagePath: runtime.env.storagePath,
    distRootPath,
    runtimeVersion: '2.1.0-beta.44',
    appPublicPath: '/',
  });

  expect(bundle.appConfigContent).toContain(
    `root * ${path.join(root, '.nocobase', 'proxy', 'caddy', 'default', 'public')}`,
  );
  expect(bundle.appConfigContent).toContain(`root * ${distRootPath}`);
  expect(bundle.indexV1Content).toContain('src="/dist/2.1.0-beta.44/caddy-custom/browser-checker.js?v=1"');
  expect(bundle.indexV2Content).toContain('src="/caddy-custom-v/browser-checker.js?v=1"');
});

test('buildEnvProxyAppConfig creates an editable Caddy app entry with a managed import block', () => {
  expect(buildEnvProxyAppConfig('caddy', '/tmp/nocobase/proxy/demo/generated.caddy')).toBe(`:80 {
    # BEGIN NocoBase generated routes
    # Keep this import so the CLI can refresh managed routes.
    import ./generated.caddy
    # END NocoBase generated routes
}
`);
  expect(
    buildEnvProxyAppConfig('caddy', '/tmp/nocobase/proxy/demo/generated.caddy', {
      host: 'a.local.nocobase.com',
      port: '8080',
    }),
  ).toBe(`a.local.nocobase.com:8080 {
    # BEGIN NocoBase generated routes
    # Keep this import so the CLI can refresh managed routes.
    import ./generated.caddy
    # END NocoBase generated routes
}
`);
});

test('buildEnvProxyMainConfig renders nginx includes from asset templates', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-main-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  const content = await buildEnvProxyMainConfig({ scope: 'global' });

  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/snippets/log-format-http.conf;');
  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/snippets/maps-http.conf;');
  expect(content).toContain('include /workspace/.nocobase/proxy/nginx/*/app.conf;');
});

test('buildEnvProxyMainConfig creates a provider-local Caddy import file', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-main-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  const content = await buildEnvProxyMainConfig({ provider: 'caddy', scope: 'global' });

  expect(content).toContain('import /workspace/.nocobase/proxy/caddy/*/app.caddy');
  expect(content).not.toContain('include ');
});

test('env proxy path helpers resolve the nginx entry, shared config, snippets, and index files', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-paths-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  expect(resolveEnvProxyEntryDir('staging')).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'staging'));
  expect(resolveEnvProxyAppOutputPath('staging')).toBe(
    path.join(root, '.nocobase', 'proxy', 'nginx', 'staging', 'app.conf'),
  );
  expect(resolveEnvProxyMainOutputPath()).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'nocobase.conf'));
  expect(resolveEnvProxyNginxSnippetsOutputDir()).toBe(path.join(root, '.nocobase', 'proxy', 'nginx', 'snippets'));
  expect(resolveEnvProxyNginxPublicOutputDir('staging')).toBe(
    path.join(root, '.nocobase', 'proxy', 'nginx', 'staging', 'public'),
  );
  expect(resolveEnvProxyNginxIndexOutputPath('staging', 'v1')).toBe(
    path.join(root, '.nocobase', 'proxy', 'nginx', 'staging', 'public', 'index-v1.html'),
  );
  expect(await mapProxyPathFromCliRoot(resolveEnvProxyAppOutputPath('staging'), { scope: 'global' })).toBe(
    '/workspace/.nocobase/proxy/nginx/staging/app.conf',
  );
});

test('env proxy path helpers resolve the caddy entry, shared config, and index files', async () => {
  const root = await createTempRoot('nocobase-cli-env-proxy-caddy-paths-');
  process.env.NB_CLI_ROOT = root;
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });

  expect(resolveEnvProxyEntryDir('staging', { provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging'),
  );
  expect(resolveEnvProxyAppOutputPath('staging', { provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging', 'app.caddy'),
  );
  expect(resolveEnvProxyMainOutputPath({ provider: 'caddy' })).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'nocobase.caddy'),
  );
  expect(resolveEnvProxyCaddyPublicOutputDir('staging')).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging', 'public'),
  );
  expect(resolveEnvProxyCaddyIndexOutputPath('staging', 'v1')).toBe(
    path.join(root, '.nocobase', 'proxy', 'caddy', 'staging', 'public', 'index-v1.html'),
  );
  expect(
    await mapProxyPathFromCliRoot(resolveEnvProxyAppOutputPath('staging', { provider: 'caddy' }), { scope: 'global' }),
  ).toBe('/workspace/.nocobase/proxy/caddy/staging/app.caddy');
});

test('parseNginxConfPathFromVersionOutput extracts the configured nginx.conf path', async () => {
  expect(
    parseNginxConfPathFromVersionOutput(
      'nginx version: nginx/1.27.5\nconfigure arguments: --prefix=/opt/homebrew --conf-path=/opt/homebrew/etc/nginx/nginx.conf --pid-path=/tmp/nginx.pid',
    ),
  ).toBe('/opt/homebrew/etc/nginx/nginx.conf');
});
