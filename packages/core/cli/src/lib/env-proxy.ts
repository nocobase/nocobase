/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import {
  resolveAppPublicPath,
  resolveDistClientRoot,
  resolveDistPublicPath,
} from './app-public-path.js';
import { resolveCliHomeDir, resolveCliHomeRoot, type CliHomeScope } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import {
  DEFAULT_PROXY_PROVIDER,
  getCliConfigValue,
  normalizeProxyProvider,
  PROXY_PROVIDER_OPTIONS,
  type ProxyProvider,
} from './cli-config.js';
import { readManagedRuntimeEnvValues } from './managed-env-file.js';
import { run } from './run-npm.js';

const DEFAULT_APP_PUBLIC_PATH = '/';
const DEFAULT_API_BASE_PATH = '/api/';
const DEFAULT_WS_PATH = '/ws';
const DEFAULT_PLUGIN_STATICS_PATH = '/static/plugins/';
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';
const LOCAL_APP_PACKAGE_JSON_PATH = 'node_modules/@nocobase/app/package.json';
const MANAGED_PROXY_BLOCK_BEGIN = '# BEGIN NocoBase proxy';
const MANAGED_PROXY_BLOCK_END = '# END NocoBase proxy';
const MANAGED_APP_ENTRY_BLOCK_BEGIN = '# BEGIN NocoBase generated routes';
const MANAGED_APP_ENTRY_BLOCK_END = '# END NocoBase generated routes';
const LEGACY_NGINX_SHARED_FILENAME = 'nginx.conf';
const DEFAULT_CADDY_MAIN_CONFIG_CANDIDATES = [
  '/etc/caddy/Caddyfile',
  '/usr/local/etc/Caddyfile',
  '/usr/local/etc/caddy/Caddyfile',
  '/opt/homebrew/etc/Caddyfile',
  '/opt/homebrew/etc/caddy/Caddyfile',
] as const;

const ENV_PROXY_FILE_SPECS: Record<
  ProxyProvider,
  {
    appFilename: string;
    generatedFilename: string;
    sharedFilename: string;
  }
> = {
  nginx: {
    appFilename: 'app.conf',
    generatedFilename: 'generated.conf',
    sharedFilename: 'nocobase.conf',
  },
  caddy: {
    appFilename: 'app.caddy',
    generatedFilename: 'generated.caddy',
    sharedFilename: 'nocobase.caddy',
  },
};

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

export type EnvProxyAppEntryOptions = {
  host?: string;
  port?: string;
};

type EnvProxyTemplateContext = {
  appPublicPath: string;
  apiBasePath: string;
  apiPort: string;
  distPath: string;
  distClientRoot: string;
  modernClientPrefix: string;
  otherLocation: string;
  proxyHost: string;
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
  provider?: ProxyProvider;
};

type EnvProxyBuildOptions = EnvProxyProviderOptions & {
  useHostPaths?: boolean;
};

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function formatSupportedProxyProviders(): string {
  return PROXY_PROVIDER_OPTIONS.join(', ');
}

function resolveProxyProviderName(provider?: ProxyProvider): ProxyProvider {
  return provider ?? DEFAULT_PROXY_PROVIDER;
}

function resolveEnvProxyFileSpec(provider?: ProxyProvider) {
  return ENV_PROXY_FILE_SPECS[resolveProxyProviderName(provider)];
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

function buildManagedProxyReferenceLine(provider: ProxyProvider, targetPath: string): string {
  return provider === 'nginx' ? `include ${targetPath};` : `import ${targetPath}`;
}

function buildManagedProxyReferenceBlock(provider: ProxyProvider, targetPath: string): string {
  const line = buildManagedProxyReferenceLine(provider, targetPath);
  if (provider === 'nginx') {
    return `\n    ${MANAGED_PROXY_BLOCK_BEGIN}\n    ${line}\n    ${MANAGED_PROXY_BLOCK_END}\n`;
  }

  return `\n${MANAGED_PROXY_BLOCK_BEGIN}\n${line}\n${MANAGED_PROXY_BLOCK_END}\n`;
}

function buildAppGeneratedConfigReference(provider: ProxyProvider, generatedConfigPath: string): string {
  if (provider === 'caddy') {
    return `./${path.basename(generatedConfigPath)}`;
  }

  return generatedConfigPath;
}

function buildAppGeneratedConfigReferenceLine(provider: ProxyProvider, generatedConfigPath: string): string {
  return buildManagedProxyReferenceLine(provider, buildAppGeneratedConfigReference(provider, generatedConfigPath));
}

export function buildManagedAppEntryGeneratedConfigBlock(provider: ProxyProvider, generatedConfigPath: string): string {
  const referenceLine = buildAppGeneratedConfigReferenceLine(provider, generatedConfigPath);
  return [
    `    ${MANAGED_APP_ENTRY_BLOCK_BEGIN}`,
    provider === 'caddy'
      ? '    # Keep this import so `nb env proxy` can refresh managed routes.'
      : '    # Keep this include so `nb env proxy` can refresh managed routes.',
    `    ${referenceLine}`,
    `    ${MANAGED_APP_ENTRY_BLOCK_END}`,
  ].join('\n');
}

export function appConfigHasManagedGeneratedConfigBlock(content: string): boolean {
  return content.includes(MANAGED_APP_ENTRY_BLOCK_BEGIN) && content.includes(MANAGED_APP_ENTRY_BLOCK_END);
}

export function replaceManagedAppEntryGeneratedConfigBlock(
  content: string,
  provider: ProxyProvider,
  generatedConfigPath: string,
): string {
  const escapedBegin = MANAGED_APP_ENTRY_BLOCK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = MANAGED_APP_ENTRY_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content.replace(
    new RegExp(`[ \\t]*${escapedBegin}[\\s\\S]*?[ \\t]*${escapedEnd}`, 'm'),
    buildManagedAppEntryGeneratedConfigBlock(provider, generatedConfigPath),
  );
}

function hasManagedProxyReferenceInstalled(content: string, provider: ProxyProvider, targetPath: string): boolean {
  return content.includes(buildManagedProxyReferenceLine(provider, targetPath));
}

function hasManagedProxyReferenceBlock(content: string): boolean {
  return content.includes(MANAGED_PROXY_BLOCK_BEGIN) && content.includes(MANAGED_PROXY_BLOCK_END);
}

function replaceManagedProxyReferenceBlock(content: string, provider: ProxyProvider, targetPath: string): string {
  const escapedBegin = MANAGED_PROXY_BLOCK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = MANAGED_PROXY_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linePattern = provider === 'nginx' ? 'include\\s+[^\\n]+;' : 'import\\s+[^\\n]+';
  return content.replace(
    new RegExp(`\\n?\\s*${escapedBegin}\\n\\s*${linePattern}\\n\\s*${escapedEnd}\\n?`, 'm'),
    buildManagedProxyReferenceBlock(provider, targetPath),
  );
}

function replaceAppGeneratedConfigReference(
  content: string,
  provider: ProxyProvider,
  currentGeneratedConfigPath: string,
  nextGeneratedConfigPath: string,
): string {
  const currentReference = buildAppGeneratedConfigReference(provider, currentGeneratedConfigPath);
  const nextReference = buildAppGeneratedConfigReference(provider, nextGeneratedConfigPath);
  const escapedReference = currentReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern =
    provider === 'nginx'
      ? new RegExp(`\\binclude\\s+${escapedReference}\\s*;`)
      : new RegExp(`\\bimport\\s+${escapedReference}\\b`);
  const nextLine = buildManagedProxyReferenceLine(provider, nextReference);
  return content.replace(pattern, nextLine);
}

function resolveAppEntryPort(options?: EnvProxyAppEntryOptions): string {
  return trimValue(options?.port) ?? '80';
}

function resolveAppEntryHost(options?: EnvProxyAppEntryOptions): string | undefined {
  return trimValue(options?.host);
}

function formatNginxListenToken(currentToken: string | undefined, port: string): string {
  const token = trimValue(currentToken);
  if (!token) {
    return port;
  }

  if (/^\d+$/.test(token)) {
    return port;
  }

  if (/^:\d+$/.test(token)) {
    return `:${port}`;
  }

  const hostAndPortMatch = token.match(/^(\[[^\]]+\]|[^:]+):(\d+)$/);
  if (hostAndPortMatch) {
    return `${hostAndPortMatch[1]}:${port}`;
  }

  return port;
}

function parseCaddySiteAddress(content: string): string | undefined {
  const match = content.match(/^([^\s#][^\n{]*)\s*\{/m);
  return trimValue(match?.[1]);
}

function buildCaddySiteAddress(options?: EnvProxyAppEntryOptions, currentAddress?: string): string {
  const explicitHost = resolveAppEntryHost(options);
  const explicitPort = trimValue(options?.port);
  const current = trimValue(currentAddress);
  let currentHost: string | undefined;
  let currentPort: string | undefined;

  if (current) {
    if (current.startsWith(':')) {
      currentPort = current.slice(1) || undefined;
    } else {
      const hostAndPortMatch = current.match(/^(.*):(\d+)$/);
      if (hostAndPortMatch) {
        currentHost = trimValue(hostAndPortMatch[1]);
        currentPort = trimValue(hostAndPortMatch[2]);
      } else {
        currentHost = current;
      }
    }
  }

  if (explicitHost) {
    if (explicitPort) {
      return `${explicitHost}:${explicitPort}`;
    }

    if (currentPort && currentPort !== '80') {
      return `${explicitHost}:${currentPort}`;
    }

    return explicitHost;
  }

  if (explicitPort) {
    return currentHost ? `${currentHost}:${explicitPort}` : `:${explicitPort}`;
  }

  return current ?? ':80';
}

function applyNginxAppEntryOptions(content: string, options?: EnvProxyAppEntryOptions): string {
  let nextContent = content;
  const host = resolveAppEntryHost(options);

  if (trimValue(options?.port)) {
    const port = resolveAppEntryPort(options);
    const listenMatch = nextContent.match(/^(\s*listen\s+)([^;]+)(;.*)$/m);
    if (listenMatch) {
      const currentValue = listenMatch[2].trim();
      const segments = currentValue.split(/\s+/);
      const firstToken = segments.shift();
      const listenValue = [formatNginxListenToken(firstToken, port), ...segments].filter(Boolean).join(' ');
      nextContent = nextContent.replace(listenMatch[0], `${listenMatch[1]}${listenValue}${listenMatch[3]}`);
    } else {
      nextContent = nextContent.replace(/server\s*\{\n/, `server {\n    listen ${port};\n`);
    }
  }

  if (host) {
    const serverNameMatch = nextContent.match(/^(\s*server_name\s+)([^;]*)(;.*)$/m);
    if (serverNameMatch) {
      nextContent = nextContent.replace(serverNameMatch[0], `${serverNameMatch[1]}${host}${serverNameMatch[3]}`);
    } else if (/^\s*listen\s+/m.test(nextContent)) {
      nextContent = nextContent.replace(/^(\s*listen\s+[^\n]+)$/m, `$1\n    server_name ${host};`);
    } else {
      nextContent = nextContent.replace(/server\s*\{\n/, `server {\n    server_name ${host};\n`);
    }
  }

  return nextContent;
}

function applyCaddyAppEntryOptions(content: string, options?: EnvProxyAppEntryOptions): string {
  if (!trimValue(options?.host) && !trimValue(options?.port)) {
    return content;
  }

  const currentAddress = parseCaddySiteAddress(content);
  const nextAddress = buildCaddySiteAddress(options, currentAddress);

  if (currentAddress) {
    return content.replace(currentAddress, nextAddress);
  }

  return content;
}

export function applyEnvProxyAppEntryOptions(
  content: string,
  provider: ProxyProvider,
  options?: EnvProxyAppEntryOptions,
): string {
  if (!trimValue(options?.host) && !trimValue(options?.port)) {
    return content;
  }

  return provider === 'caddy' ? applyCaddyAppEntryOptions(content, options) : applyNginxAppEntryOptions(content, options);
}

function toCaddyPathMatcher(prefixPath: string): string {
  return `${prefixPath}*`;
}

function buildCaddyOtherLocation(appPublicPath: string, v2PublicPath: string, modernClientPrefix: string): string {
  if (appPublicPath === DEFAULT_APP_PUBLIC_PATH) {
    return '';
  }

  const appPublicPathWithoutTrailingSlash = appPublicPath.replace(/\/$/, '');
  return `
    handle / {
        redir * ${appPublicPath} 302
    }

    handle /${modernClientPrefix} {
        redir * ${v2PublicPath} 302
    }

    handle /${modernClientPrefix}/* {
        redir * ${appPublicPathWithoutTrailingSlash}{uri} 302
    }
`;
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

export async function resolveProxyNbCliRoot(options?: EnvProxyProviderOptions): Promise<string> {
  return await getCliConfigValue('proxy.nb-cli-root', { scope: options?.scope });
}

export async function resolveProxyUpstreamHost(options?: EnvProxyProviderOptions): Promise<string> {
  return await getCliConfigValue('proxy.upstream-host', { scope: options?.scope });
}

function isPathInsideRoot(targetPath: string, rootPath: string): boolean {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function detectRuntimePathSeparator(rootPath: string): '/' | '\\' {
  if (/^[a-zA-Z]:[\\/]/.test(rootPath) || rootPath.startsWith('\\\\') || rootPath.includes('\\')) {
    return '\\';
  }

  return '/';
}

function trimRuntimeRootSeparator(rootPath: string, separator: '/' | '\\'): string {
  if (separator === '\\') {
    if (/^[a-zA-Z]:\\$/.test(rootPath) || /^\\\\[^\\]+\\[^\\]+\\?$/.test(rootPath)) {
      return rootPath.replace(/[\\]+$/, '\\');
    }
  } else if (rootPath === '/') {
    return '/';
  }

  return rootPath.replace(/[\\/]+$/, '');
}

function joinRuntimePath(rootPath: string, relativePath: string): string {
  const separator = detectRuntimePathSeparator(rootPath);
  const normalizedRoot = trimRuntimeRootSeparator(rootPath, separator);
  const relativeSegments = relativePath.split(/[\\/]+/).filter(Boolean);

  if (relativeSegments.length === 0) {
    return normalizedRoot;
  }

  if (normalizedRoot === '/' || /^[a-zA-Z]:\\$/.test(normalizedRoot)) {
    return `${normalizedRoot}${relativeSegments.join(separator)}`;
  }

  return `${normalizedRoot}${separator}${relativeSegments.join(separator)}`;
}

export async function mapProxyPathFromCliRoot(
  targetPath: string,
  options?: EnvProxyProviderOptions,
): Promise<string> {
  const hostCliRoot = resolveCliHomeRoot(options?.scope);
  const runtimeCliRoot = await resolveProxyNbCliRoot(options);

  if (!isPathInsideRoot(targetPath, hostCliRoot)) {
    return targetPath;
  }

  const relativePath = path.relative(hostCliRoot, targetPath);
  return relativePath ? joinRuntimePath(runtimeCliRoot, relativePath) : runtimeCliRoot;
}

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await stat(candidate);
    return true;
  } catch {
    return false;
  }
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

export async function resolveCaddyMainConfigPath(_options?: EnvProxyProviderOptions): Promise<string> {
  const configured = trimValue(process.env.CADDY_CONFIG);
  if (configured && (await pathExists(configured))) {
    return configured;
  }

  for (const candidate of DEFAULT_CADDY_MAIN_CONFIG_CANDIDATES) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Failed to detect the Caddy main config path. Set CADDY_CONFIG or place the Caddyfile at one of: ${DEFAULT_CADDY_MAIN_CONFIG_CANDIDATES.join(', ')}.`,
  );
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

function insertNginxIncludeIntoHttpBlock(content: string, includePath: string): string {
  if (hasManagedProxyReferenceInstalled(content, 'nginx', includePath)) {
    return content;
  }

  if (hasManagedProxyReferenceBlock(content)) {
    return replaceManagedProxyReferenceBlock(content, 'nginx', includePath);
  }

  const { closeBraceIndex } = findHttpBlockRange(content);
  return `${content.slice(0, closeBraceIndex)}${buildManagedProxyReferenceBlock('nginx', includePath)}${content.slice(closeBraceIndex)}`;
}

function insertCaddyImportIntoMainConfig(content: string, importPath: string): string {
  if (hasManagedProxyReferenceInstalled(content, 'caddy', importPath)) {
    return content;
  }

  if (hasManagedProxyReferenceBlock(content)) {
    return replaceManagedProxyReferenceBlock(content, 'caddy', importPath);
  }

  const suffix = content.endsWith('\n') ? '' : '\n';
  return `${content}${suffix}${buildManagedProxyReferenceBlock('caddy', importPath)}`;
}

function buildNginxProxyPassBlock(proxyHost: string, apiPort: string) {
  return [
    `proxy_pass http://${proxyHost}:${apiPort};`,
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

function buildNginxOtherLocation(appPublicPath: string, v2PublicPath: string, modernClientPrefix: string) {
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

function renderNginxLocationTemplate(context: EnvProxyTemplateContext): string {
  const proxyPassBlock = buildNginxProxyPassBlock(context.proxyHost, context.apiPort);
  const wsProxyPassTarget = `http://${context.proxyHost}:${context.apiPort}${context.wsPath}`;

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

${renderNginxLocationTemplate(context)}}
`;
}

function renderNginxGeneratedTemplate(context: EnvProxyTemplateContext): string {
  return `# Managed by \`nb env proxy\`. Changes will be overwritten.

${renderNginxLocationTemplate(context)}`;
}

function renderCaddyGeneratedTemplate(context: EnvProxyTemplateContext): string {
  const uploadsPath = `${context.appPublicPath}storage/uploads/`;
  const distPathMatcher = toCaddyPathMatcher(context.distPath);
  const uploadsPathMatcher = toCaddyPathMatcher(uploadsPath);
  const apiPathMatcher = toCaddyPathMatcher(context.apiBasePath);

  return `# Managed by \`nb env proxy\`. Changes will be overwritten.

route {
    encode zstd gzip${buildCaddyOtherLocation(context.appPublicPath, context.v2PublicPath, context.modernClientPrefix)}
    handle_path ${uploadsPathMatcher} {
        root * ${context.uploadsPath}
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path ${distPathMatcher} {
        root * ${context.distClientRoot}
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy ${context.proxyHost}:${context.apiPort}
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy ${context.proxyHost}:${context.apiPort}
    }

    handle ${apiPathMatcher} {
        reverse_proxy ${context.proxyHost}:${context.apiPort}
    }

    handle ${context.wsPath} {
        reverse_proxy ${context.proxyHost}:${context.apiPort}
    }

    handle {
        reverse_proxy ${context.proxyHost}:${context.apiPort}
    }
}
`;
}

export function buildEnvProxyAppConfig(
  provider: ProxyProvider,
  generatedConfigPath: string,
  options?: EnvProxyAppEntryOptions,
): string {
  if (provider === 'caddy') {
    return `${buildCaddySiteAddress(options)} {
${buildManagedAppEntryGeneratedConfigBlock(provider, generatedConfigPath)}
}
`;
  }

  return `server {
    listen ${resolveAppEntryPort(options)};
    server_name ${resolveAppEntryHost(options) ?? '_'};
    client_max_body_size 0;

${buildManagedAppEntryGeneratedConfigBlock(provider, generatedConfigPath)}
}
`;
}

function normalizeConfigContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

export function appConfigIncludesGeneratedConfig(
  content: string,
  generatedConfigPath: string,
  provider: ProxyProvider = DEFAULT_PROXY_PROVIDER,
): boolean {
  const generatedConfigReference = buildAppGeneratedConfigReference(provider, generatedConfigPath);
  const escapedReference = generatedConfigReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (provider === 'caddy') {
    return new RegExp(`\\bimport\\s+${escapedReference}\\b`).test(content);
  }

  return new RegExp(`\\binclude\\s+${escapedReference}\\s*;`).test(content);
}

function renderNginxMainTemplate(appConfigIncludePath: string): string {
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

function renderCaddyMainTemplate(appConfigImportPath: string): string {
  return `# Managed by \`nb env proxy\`. Changes will be overwritten.

import ${appConfigImportPath}
`;
}

async function buildEnvProxyRenderState(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: EnvProxyBuildOptions,
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
  const proxyHost = await resolveProxyUpstreamHost(options);
  const uploadsPath = path.join(runtime.env.storagePath, 'uploads');
  const distClientRoot = resolveDistClientRoot(runtime.env.storagePath);
  const renderedUploadsPath = options?.useHostPaths ? uploadsPath : await mapProxyPathFromCliRoot(uploadsPath, options);
  const renderedDistClientRoot = options?.useHostPaths
    ? distClientRoot
    : await mapProxyPathFromCliRoot(distClientRoot, options);
  const provider = resolveProxyProviderName(options?.provider);
  const templateContext = {
    appPublicPath: settings.appPublicPath,
    apiBasePath: settings.apiBasePath,
    apiPort,
    distPath: settings.distPath,
    distClientRoot: renderedDistClientRoot,
    modernClientPrefix: settings.modernClientPrefix,
    otherLocation:
      provider === 'nginx'
        ? buildNginxOtherLocation(settings.appPublicPath, v2PublicPath, settings.modernClientPrefix)
        : '',
    proxyHost,
    uploadsPath: renderedUploadsPath,
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
    uploadsPath: renderedUploadsPath,
    distClientRoot: renderedDistClientRoot,
    runtimeVersion,
    apiPort,
    templateContext,
  };
}

export async function buildEnvProxyConfig(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: EnvProxyBuildOptions,
): Promise<EnvProxyRenderResult> {
  const provider = resolveProxyProviderName(options?.provider);
  const { templateContext, ...base } = await buildEnvProxyRenderState(runtime, options);

  return {
    ...base,
    content: provider === 'caddy' ? renderCaddyGeneratedTemplate(templateContext) : renderNginxGeneratedTemplate(templateContext),
  };
}

export async function buildLegacyEnvProxyConfig(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: Omit<EnvProxyBuildOptions, 'useHostPaths'>,
): Promise<EnvProxyRenderResult> {
  const provider = resolveProxyProviderName(options?.provider);
  if (provider !== 'nginx') {
    throw new Error(`Legacy proxy app config migration is not supported for provider "${provider}".`);
  }

  const { templateContext, ...base } = await buildEnvProxyRenderState(runtime, {
    ...options,
    useHostPaths: true,
  });
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

export function resolveEnvProxyProviderRootDir(
  provider: ProxyProvider = DEFAULT_PROXY_PROVIDER,
  options?: { scope?: CliHomeScope },
): string {
  return path.join(resolveEnvProxyRootDir(options), provider);
}

export function resolveLegacyNginxEnvProxyAppOutputPath(envName: string, options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyRootDir(options), envName, 'app.conf');
}

export function resolveLegacyNginxEnvProxyOutputPath(
  envName: string,
  options?: {
    scope?: CliHomeScope;
  },
): string {
  return path.join(resolveEnvProxyRootDir(options), envName, 'generated.conf');
}

export function resolveLegacyNginxEnvProxyMainOutputPath(options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyRootDir(options), LEGACY_NGINX_SHARED_FILENAME);
}

export function resolveEnvProxyAppOutputPath(
  envName: string,
  options?: {
    scope?: CliHomeScope;
    provider?: ProxyProvider;
  },
): string {
  const provider = resolveProxyProviderName(options?.provider);
  return path.join(resolveEnvProxyProviderRootDir(provider, options), envName, resolveEnvProxyFileSpec(provider).appFilename);
}

export function resolveEnvProxyOutputPath(
  envName: string,
  options?: {
    output?: string;
    scope?: CliHomeScope;
    provider?: ProxyProvider;
  },
): string {
  const explicitOutput = trimValue(options?.output);
  if (explicitOutput) {
    return path.resolve(process.cwd(), explicitOutput);
  }

  const provider = resolveProxyProviderName(options?.provider);
  return path.join(
    resolveEnvProxyProviderRootDir(provider, options),
    envName,
    resolveEnvProxyFileSpec(provider).generatedFilename,
  );
}

export function resolveEnvProxyMainOutputPath(options?: { scope?: CliHomeScope; provider?: ProxyProvider }): string {
  const provider = resolveProxyProviderName(options?.provider);
  return path.join(resolveEnvProxyProviderRootDir(provider, options), resolveEnvProxyFileSpec(provider).sharedFilename);
}

export async function resolveEnvProxyMainRuntimeOutputPath(
  options?: {
    scope?: CliHomeScope;
    provider?: ProxyProvider;
  },
): Promise<string> {
  return await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath(options), options);
}

export async function buildEnvProxyMainConfig(
  options?: {
    scope?: CliHomeScope;
    provider?: ProxyProvider;
  },
): Promise<string> {
  const provider = resolveProxyProviderName(options?.provider);
  if (provider === 'caddy') {
    const appConfigImportPath = await mapProxyPathFromCliRoot(
      path.join(resolveEnvProxyProviderRootDir(provider, options), '*', resolveEnvProxyFileSpec(provider).appFilename),
      options,
    );
    return renderCaddyMainTemplate(appConfigImportPath);
  }

  const appConfigIncludePath = await mapProxyPathFromCliRoot(
    path.join(resolveEnvProxyProviderRootDir(provider, options), '*', resolveEnvProxyFileSpec(provider).appFilename),
    options,
  );
  return renderNginxMainTemplate(appConfigIncludePath);
}

export async function validateEnvProxyProvider(
  provider: ProxyProvider,
  options?: EnvProxyProviderOptions,
): Promise<void> {
  if (provider === 'caddy') {
    const configPath = await resolveCaddyMainConfigPath(options);
    await runCommandAndCapture('caddy', ['validate', '--adapter', 'caddyfile', '--config', configPath], {
      errorName: 'caddy validate',
    });
    return;
  }

  await runCommandAndCapture('nginx', ['-t'], {
    errorName: 'nginx -t',
  });
}

export async function installEnvProxyProvider(
  provider: ProxyProvider,
  options?: EnvProxyProviderOptions,
): Promise<{ configPath: string; status: 'installed' | 'already-installed' }> {
  const includePath = await resolveEnvProxyMainRuntimeOutputPath({
    ...options,
    provider,
  });

  if (provider === 'caddy') {
    const configPath = await resolveCaddyMainConfigPath(options);
    const originalContent = await readFile(configPath, 'utf8');

    if (hasManagedProxyReferenceInstalled(originalContent, 'caddy', includePath)) {
      return {
        configPath,
        status: 'already-installed',
      };
    }

    const nextContent = insertCaddyImportIntoMainConfig(originalContent, includePath);
    await writeFile(configPath, nextContent, 'utf8');

    try {
      await validateEnvProxyProvider(provider, options);
    } catch (error: unknown) {
      await writeFile(configPath, originalContent, 'utf8');
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to install the Caddy import in ${configPath}. The original config was restored.\nDetails: ${message}`,
      );
    }

    return {
      configPath,
      status: 'installed',
    };
  }

  const configPath = await resolveNginxMainConfigPath(options);
  const originalContent = await readFile(configPath, 'utf8');

  if (hasManagedProxyReferenceInstalled(originalContent, 'nginx', includePath)) {
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
  if (provider === 'caddy') {
    const configPath = await resolveCaddyMainConfigPath(options);
    await validateEnvProxyProvider(provider, options);
    await run('caddy', ['reload', '--adapter', 'caddyfile', '--config', configPath], {
      errorName: 'caddy reload',
      stdio: 'ignore',
    });
    return;
  }

  await validateEnvProxyProvider(provider, options);
  await run('nginx', ['-s', 'reload'], {
    errorName: 'nginx -s reload',
    stdio: 'ignore',
  });
}
