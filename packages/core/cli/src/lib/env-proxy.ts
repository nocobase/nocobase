/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import {
  resolveAppPublicPath,
  resolveDistClientRoot,
  resolveDistPublicPath,
} from './app-public-path.js';
import { resolveCliHomeDir, type CliHomeScope } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import { getCliConfigValue, normalizeProxyProvider, PROXY_PROVIDER_OPTIONS, type ProxyProvider } from './cli-config.js';
import { readManagedRuntimeEnvValues } from './managed-env-file.js';
import { run } from './run-npm.js';

const DEFAULT_APP_PUBLIC_PATH = '/';
const DEFAULT_API_BASE_PATH = '/api/';
const DEFAULT_WS_PATH = '/ws';
const DEFAULT_PLUGIN_STATICS_PATH = '/static/plugins/';
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';
const LOCAL_APP_PACKAGE_JSON_PATH = 'node_modules/@nocobase/app/package.json';
const NGINX_PROXY_INCLUDE_BEGIN = '# BEGIN NocoBase proxy';
const NGINX_PROXY_INCLUDE_END = '# END NocoBase proxy';

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

type EnvProxyTemplateContext = {
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
};

type ProxyEnvSettings = {
  appPublicPath: string;
  apiBasePath: string;
  distPath: string;
  wsPath: string;
  pluginStaticsPath: string;
  modernClientPrefix: string;
};

type EnvProxyProviderOptions = {
  scope?: CliHomeScope;
};

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function formatSupportedProxyProviders(): string {
  return PROXY_PROVIDER_OPTIONS.join(', ');
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

export async function resolveEnvProxyProvider(
  requestedProvider?: string,
  options?: EnvProxyProviderOptions,
): Promise<ProxyProvider> {
  const explicit = trimValue(requestedProvider);
  if (explicit) {
    const normalized = normalizeProxyProvider(explicit);
    if (!normalized) {
      throw new Error(`Unsupported proxy provider "${explicit}". Supported providers: ${formatSupportedProxyProviders()}.`);
    }
    return normalized;
  }

  return (await getCliConfigValue('proxy.provider', { scope: options?.scope })) as ProxyProvider;
}

async function runCommandAndCapture(
  name: string,
  args: string[],
  options: {
    errorName: string;
  },
): Promise<string> {
  let stdout = '';
  let stderr = '';

  try {
    await run(name, args, {
      errorName: options.errorName,
      stdio: 'pipe',
      onStdout: (chunk) => {
        stdout += chunk;
      },
      onStderr: (chunk) => {
        stderr += chunk;
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const details = `${stdout}${stderr}`.trim();
    throw new Error(details ? `${message}\n${details}` : message);
  }

  return `${stdout}${stderr}`.trim();
}

export function parseNginxConfPathFromVersionOutput(output: string): string {
  const match = output.match(/--conf-path=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
  const confPath = trimValue(match?.[1] ?? match?.[2] ?? match?.[3]);
  if (!confPath) {
    throw new Error('Failed to detect the nginx main config path from `nginx -V`.');
  }

  return confPath;
}

export async function resolveNginxMainConfigPath(options?: EnvProxyProviderOptions): Promise<string> {
  const output = await runCommandAndCapture('nginx', ['-V'], {
    errorName: 'nginx -V',
  });
  return parseNginxConfPathFromVersionOutput(output);
}

function findHttpBlockRange(content: string): { openBraceIndex: number; closeBraceIndex: number } {
  const match = /\bhttp\b[\s\r\n]*\{/m.exec(content);
  if (!match) {
    throw new Error('Could not find an `http { ... }` block in the nginx main config.');
  }

  const openBraceOffset = match[0].lastIndexOf('{');
  const openBraceIndex = match.index + openBraceOffset;
  let depth = 0;

  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char !== '}') {
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return {
        openBraceIndex,
        closeBraceIndex: index,
      };
    }
  }

  throw new Error('Could not find the closing brace for the nginx `http` block.');
}

function buildNginxIncludeLine(includePath: string): string {
  return `include ${includePath};`;
}

function buildNginxIncludeBlock(includePath: string): string {
  return `\n    ${NGINX_PROXY_INCLUDE_BEGIN}\n    ${buildNginxIncludeLine(includePath)}\n    ${NGINX_PROXY_INCLUDE_END}\n`;
}

function hasNginxIncludeInstalled(content: string, includePath: string): boolean {
  return content.includes(buildNginxIncludeLine(includePath));
}

function insertNginxIncludeIntoHttpBlock(content: string, includePath: string): string {
  if (hasNginxIncludeInstalled(content, includePath)) {
    return content;
  }

  const { closeBraceIndex } = findHttpBlockRange(content);
  return `${content.slice(0, closeBraceIndex)}${buildNginxIncludeBlock(includePath)}${content.slice(closeBraceIndex)}`;
}

export async function validateEnvProxyProvider(
  provider: ProxyProvider,
  options?: EnvProxyProviderOptions,
): Promise<void> {
  if (provider !== 'nginx') {
    throw new Error(`Proxy provider "${provider}" is not implemented yet.`);
  }

  await runCommandAndCapture('nginx', ['-t'], {
    errorName: 'nginx -t',
  });
}

export async function installEnvProxyProvider(
  provider: ProxyProvider,
  options?: EnvProxyProviderOptions,
): Promise<{ configPath: string; status: 'installed' | 'already-installed' }> {
  if (provider !== 'nginx') {
    throw new Error(`Proxy provider "${provider}" is not implemented yet.`);
  }

  const includePath = resolveEnvProxyMainOutputPath(options);
  const configPath = await resolveNginxMainConfigPath(options);
  const originalContent = await readFile(configPath, 'utf8');

  if (hasNginxIncludeInstalled(originalContent, includePath)) {
    return {
      configPath,
      status: 'already-installed',
    };
  }

  const nextContent = insertNginxIncludeIntoHttpBlock(originalContent, includePath);
  await writeFile(configPath, nextContent, 'utf8');

  try {
    await validateEnvProxyProvider(provider, options);
  } catch (error: unknown) {
    await writeFile(configPath, originalContent, 'utf8');
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to install the nginx include in ${configPath}. The original config was restored.\nDetails: ${message}`,
    );
  }

  return {
    configPath,
    status: 'installed',
  };
}

export async function reloadEnvProxyProvider(
  provider: ProxyProvider,
  options?: EnvProxyProviderOptions,
): Promise<void> {
  if (provider !== 'nginx') {
    throw new Error(`Proxy provider "${provider}" is not implemented yet.`);
  }

  await validateEnvProxyProvider(provider, options);
  await run('nginx', ['-s', 'reload'], {
    errorName: 'nginx -s reload',
    stdio: 'ignore',
  });
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

function renderEnvProxyLocationTemplate(context: EnvProxyTemplateContext): string {
  const proxyPassBlock = buildProxyPassBlock(context.apiPort);
  const wsProxyPassTarget = `http://127.0.0.1:${context.apiPort}${context.wsPath}`;

  return `    location ~* ^${context.appPublicPath}storage/uploads/(.*\\.(?:htm|html|svg|svgz|xhtml|pdf))$ {
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
`;
}

function renderLegacyEnvProxyAppTemplate(context: EnvProxyTemplateContext): string {
  return `server {
    listen 80;
    server_name _;
    client_max_body_size 0;

${renderEnvProxyLocationTemplate(context)}}
`;
}

function renderEnvProxyGeneratedTemplate(context: EnvProxyTemplateContext): string {
  return `# Managed by \`nb env proxy\`. Changes will be overwritten.

${renderEnvProxyLocationTemplate(context)}`;
}

export function buildEnvProxyAppConfig(generatedConfigPath: string): string {
  return `server {
    listen 80;
    server_name _;
    client_max_body_size 0;

    # Keep this include so \`nb env proxy\` can refresh managed routes.
    include ${generatedConfigPath};
}
`;
}

function normalizeConfigContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

export function appConfigIncludesGeneratedConfig(content: string, generatedConfigPath: string): boolean {
  const escapedPath = generatedConfigPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\binclude\\s+${escapedPath}\\s*;`).test(content);
}

function renderEnvProxyMainTemplate(appConfigIncludePath: string): string {
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

types { application/javascript mjs; }

gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

include ${appConfigIncludePath};
`;
}

async function buildEnvProxyRenderState(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<Omit<EnvProxyRenderResult, 'content'> & { templateContext: EnvProxyTemplateContext }> {
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
  const templateContext = {
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
  };

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
    templateContext,
  };
}

export async function buildEnvProxyConfig(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<EnvProxyRenderResult> {
  const { templateContext, ...base } = await buildEnvProxyRenderState(runtime);
  return {
    ...base,
    content: renderEnvProxyGeneratedTemplate(templateContext),
  };
}

export async function buildLegacyEnvProxyConfig(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<EnvProxyRenderResult> {
  const { templateContext, ...base } = await buildEnvProxyRenderState(runtime);
  return {
    ...base,
    content: renderLegacyEnvProxyAppTemplate(templateContext),
  };
}

export function isLegacyEnvProxyAppConfig(content: string, legacyContent: string): boolean {
  return normalizeConfigContent(content) === normalizeConfigContent(legacyContent);
}

export function resolveEnvProxyRootDir(options?: { scope?: CliHomeScope }): string {
  return path.join(resolveCliHomeDir(options?.scope), 'proxy');
}

export function resolveEnvProxyAppOutputPath(envName: string, options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyRootDir(options), envName, 'app.conf');
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

  return path.join(resolveEnvProxyRootDir(options), envName, 'generated.conf');
}

export function resolveEnvProxyMainOutputPath(options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyRootDir(options), 'nginx.conf');
}

export function buildEnvProxyMainConfig(options?: { scope?: CliHomeScope }): string {
  const appConfigIncludePath = path.join(resolveEnvProxyRootDir(options), '*', 'app.conf');
  return renderEnvProxyMainTemplate(appConfigIncludePath);
}
