/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import {
  resolveAppPublicPath,
  resolveDistClientRoot,
  resolveDistPublicPath,
} from './app-public-path.js';
import { resolveCliHomeDir, type CliHomeScope } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import { readManagedRuntimeEnvValues } from './managed-env-file.js';

const DEFAULT_APP_PUBLIC_PATH = '/';
const DEFAULT_API_BASE_PATH = '/api/';
const DEFAULT_WS_PATH = '/ws';
const DEFAULT_PLUGIN_STATICS_PATH = '/static/plugins/';
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';
const LOCAL_APP_PACKAGE_JSON_PATH = 'node_modules/@nocobase/app/package.json';

export type EnvProxyRenderResult = {
  envName: string;
  envFilePath?: string;
  appPublicPath: string;
  apiBasePath: string;
  distPath: string;
  wsPath: string;
  v2PublicPath: string;
  pluginStaticsPath: string;
  modernClientPrefix: string;
  uploadsPath: string;
  distClientRoot: string;
  runtimeVersion: string;
  apiPort: string;
  content: string;
};

type ProxyEnvSettings = {
  appPublicPath: string;
  apiBasePath: string;
  distPath: string;
  wsPath: string;
  pluginStaticsPath: string;
  modernClientPrefix: string;
};

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeModernClientPrefix(value?: string) {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return segment || DEFAULT_MODERN_CLIENT_PREFIX;
}

function normalizeApiBasePath(value = DEFAULT_API_BASE_PATH) {
  return resolveAppPublicPath(value);
}

function normalizeWsPath(value = DEFAULT_WS_PATH) {
  const normalized = String(value || DEFAULT_WS_PATH).trim() || DEFAULT_WS_PATH;
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || DEFAULT_WS_PATH;
}

function prefixRuntimePath(appPublicPath: string, value: string, options?: { trailingSlash?: boolean }) {
  const publicPath = appPublicPath.replace(/\/+$/, '');
  const normalizedValue = options?.trailingSlash ? normalizeApiBasePath(value) : normalizeWsPath(value);
  if (!publicPath || publicPath === '/') {
    return normalizedValue;
  }
  return `${publicPath}${normalizedValue}`;
}

export async function loadEnvProxySettings(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<{ envFilePath?: string; settings: ProxyEnvSettings }> {
  const { envFilePath, envValues } = await readManagedRuntimeEnvValues(runtime);
  const appPublicPath = resolveAppPublicPath(runtime.env.config.appPublicPath || envValues.APP_PUBLIC_PATH || DEFAULT_APP_PUBLIC_PATH);

  return {
    envFilePath,
    settings: {
      appPublicPath,
      apiBasePath: prefixRuntimePath(appPublicPath, envValues.API_BASE_PATH || DEFAULT_API_BASE_PATH, {
        trailingSlash: true,
      }),
      distPath: resolveDistPublicPath(appPublicPath),
      wsPath: prefixRuntimePath(appPublicPath, envValues.WS_PATH || DEFAULT_WS_PATH),
      pluginStaticsPath: prefixRuntimePath(
        appPublicPath,
        envValues.PLUGIN_STATICS_PATH || DEFAULT_PLUGIN_STATICS_PATH,
        { trailingSlash: true },
      ),
      modernClientPrefix: normalizeModernClientPrefix(envValues.APP_MODERN_CLIENT_PREFIX),
    },
  };
}

async function parseVersionFromPackageJson(content: string, sourceLabel: string): Promise<string> {
  let parsed: { version?: unknown };
  try {
    parsed = JSON.parse(content) as { version?: unknown };
  } catch {
    throw new Error(`Failed to parse ${sourceLabel}.`);
  }

  const version = trimValue(parsed.version);
  if (!version) {
    throw new Error(`Missing version in ${sourceLabel}.`);
  }

  return version;
}

async function resolveLocalAppVersion(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): Promise<string | undefined> {
  const packageJsonPath = path.join(runtime.projectRoot, LOCAL_APP_PACKAGE_JSON_PATH);
  try {
    return await parseVersionFromPackageJson(await readFile(packageJsonPath, 'utf8'), packageJsonPath);
  } catch (_error) {
    return undefined;
  }
}

export async function resolveManagedProxyAppVersion(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<string | undefined> {
  const runtimeVersion = trimValue(runtime.env.runtime?.version);
  if (runtimeVersion) {
    return runtimeVersion;
  }

  if (runtime.kind === 'local') {
    const localVersion = await resolveLocalAppVersion(runtime);
    if (localVersion) {
      return localVersion;
    }
  }

  return trimValue(runtime.env.config.downloadVersion);
}

function buildProxyPassBlock(apiPort: string) {
  return [
    `proxy_pass http://127.0.0.1:${apiPort};`,
    'proxy_http_version 1.1;',
    'proxy_set_header Upgrade $http_upgrade;',
    'proxy_set_header Connection $connection_upgrade;',
    'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    'proxy_set_header X-Forwarded-Proto $upstream_x_forwarded_proto;',
    'proxy_set_header Host $final_host;',
    'proxy_set_header Referer $http_referer;',
    'proxy_set_header User-Agent $http_user_agent;',
    "add_header Cache-Control 'no-cache, no-store';",
    'proxy_cache_bypass $http_upgrade;',
    'proxy_connect_timeout 600;',
    'proxy_send_timeout 600;',
    'proxy_read_timeout 600;',
    'send_timeout 600;',
  ].join('\n        ');
}

function buildOtherLocation(appPublicPath: string, v2PublicPath: string, modernClientPrefix: string) {
  if (appPublicPath === DEFAULT_APP_PUBLIC_PATH) {
    return '';
  }

  const appPublicPathWithoutTrailingSlash = appPublicPath.replace(/\/$/, '');
  return `
    location = / {
        return 302 ${appPublicPath}$is_args$args;
    }

    location = /${modernClientPrefix} {
        return 302 ${v2PublicPath}$is_args$args;
    }

    location /${modernClientPrefix}/ {
        return 302 ${appPublicPathWithoutTrailingSlash}$uri$is_args$args;
    }`;
}

function renderEnvProxyTemplate(context: {
  appPublicPath: string;
  apiBasePath: string;
  apiPort: string;
  distPath: string;
  distClientRoot: string;
  modernClientPrefix: string;
  otherLocation: string;
  uploadsPath: string;
  v2PublicPath: string;
  wsPath: string;
}): string {
  const proxyPassBlock = buildProxyPassBlock(context.apiPort);
  const wsProxyPassTarget = `http://127.0.0.1:${context.apiPort}${context.wsPath}`;

  return `map $http_upgrade $connection_upgrade {
    default upgrade;
    ""      close;
}

map $http_x_forwarded_proto $upstream_x_forwarded_proto {
    default $http_x_forwarded_proto;
    ""      $scheme;
}

map $http_host $final_host {
    default $http_host;
    ""      $host;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 0;

    include /etc/nginx/mime.types;
    types { application/javascript mjs; }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location ~* ^${context.appPublicPath}storage/uploads/(.*\\.(?:htm|html|svg|svgz|xhtml|pdf))$ {
        alias ${context.uploadsPath}/$1;
        add_header Cache-Control "public";
        add_header Content-Disposition "attachment" always;
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        autoindex off;
    }

    location ${context.appPublicPath}storage/uploads/ {
        alias ${context.uploadsPath}/;
        add_header Cache-Control "public";
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        autoindex off;

        location ~* \\.md$ {
            default_type text/markdown;
            add_header Content-Disposition "inline";
        }
    }

    location ^~ ${context.distPath} {
        alias ${context.distClientRoot}/;
        expires 365d;
        add_header Cache-Control "public";
        access_log off;
        autoindex off;
    }

    location ~ ^/\\.well-known/oauth-authorization-server/(.+)$ {
        rewrite ^/\\.well-known/oauth-authorization-server/(.+)$ /$1/.well-known/oauth-authorization-server break;
        ${proxyPassBlock}
    }

    location ~ ^/\\.well-known/openid-configuration/(.+)$ {
        rewrite ^/\\.well-known/openid-configuration/(.+)$ /$1/.well-known/openid-configuration break;
        ${proxyPassBlock}
    }${context.otherLocation}

    location ^~ ${context.apiBasePath} {
        ${proxyPassBlock}
    }

    location = ${context.wsPath} {
        proxy_pass ${wsProxyPassTarget};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $final_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $upstream_x_forwarded_proto;
        proxy_read_timeout 600;
    }

    location / {
        ${proxyPassBlock}
    }
}
`;
}

export async function buildEnvProxyConfig(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<EnvProxyRenderResult> {
  const apiPort = trimValue(runtime.env.appPort ?? runtime.env.config.appPort);
  if (!apiPort) {
    throw new Error(
      translateCli('commands.envProxy.errors.missingAppPort', { envName: runtime.envName }, {
        fallback: `Missing appPort for env "${runtime.envName}". Save or update the app port before generating proxy config.`,
      }),
    );
  }

  const runtimeVersion = (await resolveManagedProxyAppVersion(runtime)) ?? '';

  const { envFilePath, settings } = await loadEnvProxySettings(runtime);
  const v2PublicPath = `${settings.appPublicPath.replace(/\/$/, '')}/${settings.modernClientPrefix}/`;
  const distClientRoot = resolveDistClientRoot(runtime.env.storagePath);

  return {
    envName: runtime.envName,
    envFilePath,
    appPublicPath: settings.appPublicPath,
    apiBasePath: settings.apiBasePath,
    distPath: settings.distPath,
    wsPath: settings.wsPath,
    v2PublicPath,
    pluginStaticsPath: settings.pluginStaticsPath,
    modernClientPrefix: settings.modernClientPrefix,
    uploadsPath: path.join(runtime.env.storagePath, 'uploads'),
    distClientRoot,
    runtimeVersion,
    apiPort,
    content: renderEnvProxyTemplate({
      appPublicPath: settings.appPublicPath,
      apiBasePath: settings.apiBasePath,
      apiPort,
      distPath: settings.distPath,
      distClientRoot,
      modernClientPrefix: settings.modernClientPrefix,
      otherLocation: buildOtherLocation(settings.appPublicPath, v2PublicPath, settings.modernClientPrefix),
      uploadsPath: path.join(runtime.env.storagePath, 'uploads'),
      v2PublicPath,
      wsPath: settings.wsPath,
    }),
  };
}

export function resolveEnvProxyOutputPath(
  envName: string,
  options?: {
    output?: string;
    scope?: CliHomeScope;
  },
): string {
  const explicitOutput = trimValue(options?.output);
  if (explicitOutput) {
    return path.resolve(process.cwd(), explicitOutput);
  }

  return path.join(resolveCliHomeDir(options?.scope), 'proxy', envName, 'app.conf');
}
