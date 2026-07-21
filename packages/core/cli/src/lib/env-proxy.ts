/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ManagedAppRuntime } from './app-runtime.js';
import {
  buildDefaultCdnBaseUrl,
  readDistClientActiveVersion,
  resolveAppPublicPath,
  resolveDistClientRoot,
  resolveDistPublicPath,
} from './app-public-path.js';
import { resolveCliHomeDir, resolveCliHomeRoot, type CliHomeScope } from './cli-home.js';
import { translateCli } from './cli-locale.js';
import {
  DEFAULT_PROXY_PROVIDER,
  getCliConfigValue,
  type ProxyProvider,
} from './cli-config.js';
import { readManagedRuntimeEnvValues } from './managed-env-file.js';
import { run } from './run-npm.js';

const DEFAULT_APP_PUBLIC_PATH = '/';
const DEFAULT_API_BASE_PATH = '/api/';
const DEFAULT_WS_PATH = '/ws';
const DEFAULT_PLUGIN_STATICS_PATH = '/static/plugins/';
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';
const DEFAULT_API_CLIENT_STORAGE_PREFIX = 'NOCOBASE_';
const DEFAULT_API_CLIENT_STORAGE_TYPE = 'localStorage';
const DEFAULT_ESM_CDN_BASE_URL = 'https://esm.sh';
const LOCAL_APP_PACKAGE_JSON_PATH = 'node_modules/@nocobase/app/package.json';
const MANAGED_PROXY_BLOCK_BEGIN = '# BEGIN NocoBase proxy';
const MANAGED_PROXY_BLOCK_END = '# END NocoBase proxy';
const MANAGED_APP_ENTRY_BLOCK_BEGIN = '# BEGIN NocoBase generated routes';
const MANAGED_APP_ENTRY_BLOCK_END = '# END NocoBase generated routes';
const MANAGED_NGINX_CONFIG_BLOCK_BEGIN = '# BEGIN NocoBase managed config';
const MANAGED_NGINX_CONFIG_BLOCK_END = '# END NocoBase managed config';
const LEGACY_NGINX_SHARED_FILENAME = 'nginx.conf';
const DEFAULT_CADDY_MAIN_CONFIG_CANDIDATES = [
  '/etc/caddy/Caddyfile',
  '/usr/local/etc/Caddyfile',
  '/usr/local/etc/caddy/Caddyfile',
  '/opt/homebrew/etc/Caddyfile',
  '/opt/homebrew/etc/caddy/Caddyfile',
] as const;
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENV_PROXY_NGINX_ASSET_DIR = path.join(PACKAGE_ROOT, 'assets', 'env-proxy', 'nginx');

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

export type EnvProxyNginxBundle = {
  envName: string;
  envFilePath?: string;
  entryDir: string;
  publicDir: string;
  appConfigPath: string;
  indexV1Path: string;
  indexV2Path: string;
  mainConfigPath: string;
  snippetsDir: string;
  appPublicPath: string;
  apiBasePath: string;
  wsPath: string;
  v2PublicPath: string;
  modernClientPrefix: string;
  activeVersion: string;
  cdnBaseUrl: string;
  backendUrl: string;
  appConfigContent: string;
  mainConfigContent: string;
  indexV1Content: string;
  indexV2Content: string;
};

export type ManualEnvProxyNginxInput = {
  name: string;
  storagePath: string;
  distRootPath: string;
  runtimeVersion: string;
  appPublicPath?: string;
  upstreamHost?: string;
  upstreamPort?: string;
  appPort?: string;
  cdnBaseUrl?: string;
};

export type EnvProxyCaddyBundle = {
  envName: string;
  envFilePath?: string;
  entryDir: string;
  publicDir: string;
  appConfigPath: string;
  indexV1Path: string;
  indexV2Path: string;
  mainConfigPath: string;
  appPublicPath: string;
  apiBasePath: string;
  wsPath: string;
  v2PublicPath: string;
  modernClientPrefix: string;
  activeVersion: string;
  cdnBaseUrl: string;
  backendUrl: string;
  appConfigContent: string;
  mainConfigContent: string;
  indexV1Content: string;
  indexV2Content: string;
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
  cdnBaseUrl?: string;
  apiClientStoragePrefix: string;
  apiClientStorageType: string;
  apiClientShareToken: boolean;
  wsUrl: string;
  esmCdnBaseUrl: string;
  esmCdnSuffix: string;
};

type EnvProxyProviderOptions = {
  scope?: CliHomeScope;
  provider?: ProxyProvider;
  runtimeCliRoot?: string;
  upstreamHost?: string;
  upstreamPort?: string;
  cdnBaseUrl?: string;
};

type EnvProxyBuildOptions = EnvProxyProviderOptions & {
  useHostPaths?: boolean;
};

type NginxBundleSource = {
  envName: string;
  envFilePath?: string;
  storagePath: string;
  distRootPath: string;
  settings: ProxyEnvSettings;
  apiPort: string;
  activeVersion: string;
};

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
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
      ? '    # Keep this import so the CLI can refresh managed routes.'
      : '    # Keep this include so the CLI can refresh managed routes.',
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
  let nextContent = content;

  if (currentAddress) {
    nextContent = nextContent.replace(/^([^\s#][^\n{]*)\s*\{/m, `${nextAddress} {`);
  }

  return nextContent.replace(/^# host=.*$/m, `# host=${nextAddress}`);
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

export async function loadEnvProxySettings(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: { cdnBaseUrl?: string },
): Promise<{ envFilePath?: string; settings: ProxyEnvSettings }> {
  const { envFilePath, envValues } = await readManagedRuntimeEnvValues(runtime);
  const appPublicPath = resolveAppPublicPath(runtime.env.config.appPublicPath || envValues.APP_PUBLIC_PATH || DEFAULT_APP_PUBLIC_PATH);
  const apiClientShareToken = /^true$/i.test(String(envValues.API_CLIENT_SHARE_TOKEN ?? '').trim());

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
      cdnBaseUrl:
        trimValue(options?.cdnBaseUrl) ??
        trimValue(runtime.env.envVars?.CDN_BASE_URL) ??
        trimValue(envValues.CDN_BASE_URL),
      apiClientStoragePrefix: trimValue(envValues.API_CLIENT_STORAGE_PREFIX) ?? DEFAULT_API_CLIENT_STORAGE_PREFIX,
      apiClientStorageType: trimValue(envValues.API_CLIENT_STORAGE_TYPE) ?? DEFAULT_API_CLIENT_STORAGE_TYPE,
      apiClientShareToken,
      wsUrl: trimValue(envValues.WEBSOCKET_URL) ?? '',
      esmCdnBaseUrl: trimValue(envValues.ESM_CDN_BASE_URL) ?? DEFAULT_ESM_CDN_BASE_URL,
      esmCdnSuffix: trimValue(envValues.ESM_CDN_SUFFIX) ?? '',
    },
  };
}

function createManualProxyEnvSettings(input: ManualEnvProxyNginxInput): ProxyEnvSettings {
  const appPublicPath = resolveAppPublicPath(input.appPublicPath || DEFAULT_APP_PUBLIC_PATH);

  return {
    appPublicPath,
    apiBasePath: prefixRuntimePath(appPublicPath, DEFAULT_API_BASE_PATH, {
      trailingSlash: true,
    }),
    distPath: resolveDistPublicPath(appPublicPath),
    wsPath: prefixRuntimePath(appPublicPath, DEFAULT_WS_PATH),
    pluginStaticsPath: prefixRuntimePath(appPublicPath, DEFAULT_PLUGIN_STATICS_PATH, {
      trailingSlash: true,
    }),
    modernClientPrefix: DEFAULT_MODERN_CLIENT_PREFIX,
    cdnBaseUrl: trimValue(input.cdnBaseUrl),
    apiClientStoragePrefix: DEFAULT_API_CLIENT_STORAGE_PREFIX,
    apiClientStorageType: DEFAULT_API_CLIENT_STORAGE_TYPE,
    apiClientShareToken: false,
    wsUrl: '',
    esmCdnBaseUrl: DEFAULT_ESM_CDN_BASE_URL,
    esmCdnSuffix: '',
  };
}

function normalizeManualNginxInput(input: ManualEnvProxyNginxInput): ManualEnvProxyNginxInput {
  const upstreamPort = trimValue(input.upstreamPort) ?? trimValue(input.appPort);

  return {
    name: String(input.name).trim(),
    storagePath: String(input.storagePath).trim(),
    distRootPath: String(input.distRootPath).trim(),
    runtimeVersion: String(input.runtimeVersion).trim(),
    appPublicPath: trimValue(input.appPublicPath),
    upstreamHost: trimValue(input.upstreamHost),
    upstreamPort,
    appPort: trimValue(input.appPort),
    cdnBaseUrl: trimValue(input.cdnBaseUrl),
  };
}

function normalizeProxyPort(value?: string): string | undefined {
  const normalized = trimValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }

  return normalized;
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

export async function resolveProxyNbCliRoot(options?: EnvProxyProviderOptions): Promise<string> {
  if (trimValue(options?.runtimeCliRoot)) {
    return trimValue(options?.runtimeCliRoot) as string;
  }
  return await getCliConfigValue('proxy.nb-cli-root', { scope: options?.scope });
}

export async function resolveProxyUpstreamHost(options?: EnvProxyProviderOptions): Promise<string> {
  if (trimValue(options?.upstreamHost)) {
    return trimValue(options?.upstreamHost) as string;
  }
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function dedupeAssetPrefix(value: string, prefix: string): string {
  const normalizedPrefix = ensureTrailingSlash(prefix);
  const nestedPrefix = normalizedPrefix.replace(/^\/+/, '');
  if (!nestedPrefix) {
    return value;
  }

  let result = value;
  const duplicatePrefix = `${normalizedPrefix}${nestedPrefix}`;
  while (result.startsWith(duplicatePrefix)) {
    result = `${normalizedPrefix}${result.slice(duplicatePrefix.length)}`;
  }
  return result;
}

function renderTemplateString(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => values[key] ?? '');
}

async function readEnvProxyNginxAssetText(...segments: string[]): Promise<string> {
  return await readFile(path.join(ENV_PROXY_NGINX_ASSET_DIR, ...segments), 'utf8');
}

function buildRuntimeConfigScriptTag(config: Record<string, boolean | string>): string {
  const scriptContent = Object.entries(config)
    .map(([key, value]) => `window['${key}'] = ${JSON.stringify(value)};`)
    .join('\n');
  return `<script>${scriptContent}</script>`;
}

function injectRuntimeScriptIntoHtml(html: string, runtimeScript: string): string {
  const browserCheckerScriptMatch = html.match(/<script\b[^>]*browser-checker\.js[^>]*><\/script>/i);
  if (browserCheckerScriptMatch?.[0]) {
    return html.replace(browserCheckerScriptMatch[0], `${runtimeScript}\n${browserCheckerScriptMatch[0]}`);
  }

  const moduleScriptMatch = html.match(/<script\b[^>]*type=["']module["'][^>]*>/i);
  if (moduleScriptMatch?.[0]) {
    return html.replace(moduleScriptMatch[0], `${runtimeScript}\n${moduleScriptMatch[0]}`);
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `${runtimeScript}\n</head>`);
  }

  return `${runtimeScript}\n${html}`;
}

function extractRuntimePublicPath(html: string): string {
  const match = html.match(
    /window\['__nocobase_public_path__'\]\s*=\s*(?:window\['__nocobase_public_path__'\]\s*\|\|\s*)?(?:"([^"]+)"|'([^']+)')/,
  );
  return resolveAppPublicPath(match?.[1] ?? match?.[2] ?? DEFAULT_APP_PUBLIC_PATH);
}

function rewriteHtmlAssetPublicPath(html: string, currentPublicPath: string, nextPublicPath: string): string {
  const currentPrefix = ensureTrailingSlash(currentPublicPath);
  const nextPrefix = ensureTrailingSlash(nextPublicPath);
  const escapedCurrentPrefix = escapeRegExp(currentPrefix);
  let rewritten = html.replace(new RegExp(`((?:src|href)=["'])${escapedCurrentPrefix}`, 'g'), `$1${nextPrefix}`);
  rewritten = rewritten.replace(/((?:src|href)=["'])(?:\.\/)?assets\//g, `$1${nextPrefix}assets/`);
  rewritten = rewritten.replace(/((?:src|href)=["'])\/assets\//g, `$1${nextPrefix}assets/`);
  rewritten = rewritten.replace(
    /((?:src|href)=["'])([^"']+)/g,
    (_match, attributePrefix: string, assetPath: string) => `${attributePrefix}${dedupeAssetPrefix(assetPath, nextPrefix)}`,
  );
  return rewritten.replace(new RegExp(`((?:src|href)=["'])${escapeRegExp(trimTrailingSlash(nextPrefix))}//+`, 'g'), '$1');
}

type EnvProxyNginxRenderContext = {
  envName: string;
  envFilePath?: string;
  apiBasePath: string;
  apiClientShareToken: boolean;
  apiClientStoragePrefix: string;
  apiClientStorageType: string;
  apiPort: string;
  appPublicPath: string;
  backendUrl: string;
  cdnBaseUrl: string;
  distPath: string;
  distRootDir: string;
  entryDir: string;
  publicDir: string;
  esmCdnBaseUrl: string;
  esmCdnSuffix: string;
  indexV1Path: string;
  indexV2Path: string;
  modernClientPrefix: string;
  proxyHost: string;
  snippetsDir: string;
  uploadsDir: string;
  v2PublicPath: string;
  wsPath: string;
  wsUrl: string;
  activeVersion: string;
};

type EnvProxyCaddyRenderContext = EnvProxyNginxRenderContext;

function buildNginxManagedConfigBlock(context: EnvProxyNginxRenderContext): string {
  const v2PublicPathNoTrailingSlash = trimTrailingSlash(context.v2PublicPath);
  const apiBasePathNoTrailingSlash = trimTrailingSlash(context.apiBasePath);
  const appPublicPathNoTrailingSlash = trimTrailingSlash(context.appPublicPath);
  const isRootMounted = context.appPublicPath === '/';
  const appPublicPathRedirectBlock = isRootMounted
    ? ''
    : `
    location = ${appPublicPathNoTrailingSlash} {
        return 302 ${context.appPublicPath}$is_args$args;
    }`;
  const rootRedirectBlock = isRootMounted
    ? ''
    : `
    location / {
        return 302 ${appPublicPathNoTrailingSlash}$uri$is_args$args;
    }`;

  return [
    `    ${MANAGED_NGINX_CONFIG_BLOCK_BEGIN}`,
    '    client_max_body_size 0;',
    '',
    `    include ${context.snippetsDir}/mime-types.conf;`,
    `    include ${context.snippetsDir}/gzip.conf;`,
    '',
    `    location ${context.appPublicPath}storage/uploads/ {`,
    `        alias ${context.uploadsDir}/;`,
    `        include ${context.snippetsDir}/uploads-location.conf;`,
    '    }',
    '',
    `    location ^~ ${context.appPublicPath}dist/ {`,
    `        alias ${context.distRootDir}/;`,
    `        include ${context.snippetsDir}/dist-location.conf;`,
    '    }',
    '',
    '    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {',
    '        rewrite ^ /$resource_path/.well-known/$well_known break;',
    '',
    `        proxy_pass ${context.backendUrl};`,
    `        include ${context.snippetsDir}/proxy-location.conf;`,
    '    }',
    '',
    `    location = ${apiBasePathNoTrailingSlash} {`,
    `        return 308 ${context.apiBasePath}$is_args$args;`,
    '    }',
    '',
    `    location ^~ ${context.apiBasePath} {`,
    `        proxy_pass ${context.backendUrl};`,
    `        include ${context.snippetsDir}/proxy-location.conf;`,
    '    }',
    '',
    `    location = ${context.wsPath} {`,
    `        proxy_pass ${context.backendUrl};`,
    `        include ${context.snippetsDir}/proxy-location.conf;`,
    '    }',
    ...(appPublicPathRedirectBlock ? ['', appPublicPathRedirectBlock] : []),
    '',
    `    location = ${v2PublicPathNoTrailingSlash} {`,
    `        return 302 ${context.v2PublicPath}$is_args$args;`,
    '    }',
    '',
    `    location ^~ ${context.v2PublicPath} {`,
    `        alias ${context.publicDir}/;`,
    `        try_files $uri /index-v2.html =404;`,
        `        include ${context.snippetsDir}/spa-location.conf;`,
    '    }',
    '',
    `    location ^~ ${context.appPublicPath} {`,
    `        alias ${context.publicDir}/;`,
    `        try_files $uri /index-v1.html =404;`,
        `        include ${context.snippetsDir}/spa-location.conf;`,
    '    }',
    ...(rootRedirectBlock ? ['', rootRedirectBlock] : []),
    `    ${MANAGED_NGINX_CONFIG_BLOCK_END}`,
  ].join('\n');
}

function buildNginxRuntimeConfig(context: EnvProxyNginxRenderContext, variant: 'v1' | 'v2'): Record<string, boolean | string> {
  return {
    __webpack_public_path__: context.cdnBaseUrl,
    __nocobase_public_path__: variant === 'v1' ? context.appPublicPath : context.v2PublicPath,
    ...(variant === 'v2' ? { __nocobase_modern_client_prefix__: context.modernClientPrefix } : {}),
    __nocobase_api_base_url__: context.apiBasePath,
    __nocobase_api_client_storage_prefix__: context.apiClientStoragePrefix,
    __nocobase_api_client_storage_type__: context.apiClientStorageType,
    __nocobase_api_client_share_token__: context.apiClientShareToken,
    __nocobase_ws_url__: context.wsUrl,
    __nocobase_ws_path__: context.wsPath,
    __nocobase_app_dev__: false,
    __esm_cdn_base_url__: context.esmCdnBaseUrl,
    __esm_cdn_suffix__: context.esmCdnSuffix,
  };
}

function buildCaddyRuntimeConfig(context: EnvProxyCaddyRenderContext, variant: 'v1' | 'v2'): Record<string, boolean | string> {
  return buildNginxRuntimeConfig(context, variant);
}

async function buildEnvProxyNginxRenderContext(
  source: NginxBundleSource,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyNginxRenderContext> {
  const proxyHost = await resolveProxyUpstreamHost(options);
  const upstreamPort = normalizeProxyPort(options?.upstreamPort) ?? source.apiPort;
  const backendUrl = `http://${proxyHost}:${upstreamPort}`;
  const cdnBaseUrl = source.settings.cdnBaseUrl ?? buildDefaultCdnBaseUrl(source.settings.appPublicPath, source.activeVersion);
  const entryDir = resolveEnvProxyEntryDir(source.envName, { scope: options?.scope });
  const publicDir = resolveEnvProxyNginxPublicOutputDir(source.envName, { scope: options?.scope });
  const snippetsDir = resolveEnvProxyNginxSnippetsOutputDir({ scope: options?.scope });
  const distRootDir = source.distRootPath;
  const uploadsDir = path.join(source.storagePath, 'uploads');
  const mappedEntryDir = await mapProxyPathFromCliRoot(entryDir, options);
  const mappedPublicDir = await mapProxyPathFromCliRoot(publicDir, options);
  const mappedSnippetsDir = await mapProxyPathFromCliRoot(snippetsDir, options);
  const mappedDistRootDir = await mapProxyPathFromCliRoot(distRootDir, options);
  const mappedUploadsDir = await mapProxyPathFromCliRoot(uploadsDir, options);
  const v2PublicPath = `${source.settings.appPublicPath.replace(/\/$/, '')}/${source.settings.modernClientPrefix}/`;

  return {
    envName: source.envName,
    envFilePath: source.envFilePath,
    apiBasePath: source.settings.apiBasePath,
    apiClientShareToken: source.settings.apiClientShareToken,
    apiClientStoragePrefix: source.settings.apiClientStoragePrefix,
    apiClientStorageType: source.settings.apiClientStorageType,
    apiPort: source.apiPort,
    appPublicPath: source.settings.appPublicPath,
    backendUrl,
    cdnBaseUrl: ensureTrailingSlash(cdnBaseUrl),
    distPath: source.settings.distPath,
    distRootDir: mappedDistRootDir,
    entryDir: mappedEntryDir,
    publicDir: mappedPublicDir,
    esmCdnBaseUrl: source.settings.esmCdnBaseUrl,
    esmCdnSuffix: source.settings.esmCdnSuffix,
    indexV1Path: await mapProxyPathFromCliRoot(resolveEnvProxyNginxIndexOutputPath(source.envName, 'v1', { scope: options?.scope }), options),
    indexV2Path: await mapProxyPathFromCliRoot(resolveEnvProxyNginxIndexOutputPath(source.envName, 'v2', { scope: options?.scope }), options),
    modernClientPrefix: source.settings.modernClientPrefix,
    proxyHost,
    snippetsDir: mappedSnippetsDir,
    uploadsDir: mappedUploadsDir,
    v2PublicPath,
    wsPath: source.settings.wsPath,
    wsUrl: source.settings.wsUrl,
    activeVersion: source.activeVersion,
  };
}

async function resolveRuntimeNginxBundleSource(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: { cdnBaseUrl?: string },
): Promise<NginxBundleSource> {
  const apiPort = trimValue(runtime.env.appPort ?? runtime.env.config.appPort);
  if (!apiPort) {
    throw new Error(
      translateCli('commands.envProxy.errors.missingAppPort', { envName: runtime.envName }, {
        fallback: `Missing appPort for env "${runtime.envName}". Save or update the app port before generating proxy config.`,
      }),
    );
  }

  const activeVersion = trimValue(await readDistClientActiveVersion(runtime.env.storagePath));
  if (!activeVersion) {
    throw new Error(
      translateCli('commands.envProxy.errors.missingVersion', { envName: runtime.envName }, {
        fallback: `Couldn't determine the app version for env "${runtime.envName}". Run \`nb env update ${runtime.envName}\` and try again.`,
      }),
    );
  }

  const { envFilePath, settings } = await loadEnvProxySettings(runtime, options);

  return {
    envName: runtime.envName,
    envFilePath,
    storagePath: runtime.env.storagePath,
    distRootPath: resolveDistClientRoot(runtime.env.storagePath),
    settings,
    apiPort,
    activeVersion,
  };
}

async function resolveManualNginxBundleSource(input: ManualEnvProxyNginxInput): Promise<NginxBundleSource> {
  const normalized = normalizeManualNginxInput(input);

  return {
    envName: normalized.name,
    envFilePath: undefined,
    storagePath: normalized.storagePath,
    distRootPath: normalized.distRootPath,
    settings: createManualProxyEnvSettings(normalized),
    apiPort: normalized.upstreamPort,
    activeVersion: normalized.runtimeVersion,
  };
}

async function buildEnvProxyCaddyRenderContext(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyCaddyRenderContext> {
  return await buildEnvProxyCaddyRenderContextFromSource(await resolveRuntimeNginxBundleSource(runtime), options);
}

async function buildEnvProxyCaddyRenderContextFromSource(
  source: NginxBundleSource,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyCaddyRenderContext> {
  return await buildEnvProxyNginxRenderContext(source, {
    ...options,
    provider: 'caddy',
  });
}

function nginxAppConfigHasManagedConfigBlock(content: string): boolean {
  return content.includes(MANAGED_NGINX_CONFIG_BLOCK_BEGIN) && content.includes(MANAGED_NGINX_CONFIG_BLOCK_END);
}

export function appConfigHasManagedNginxBlock(content: string): boolean {
  return nginxAppConfigHasManagedConfigBlock(content);
}

export function extractManagedNginxConfigBlock(content: string): string | undefined {
  const escapedBegin = escapeRegExp(MANAGED_NGINX_CONFIG_BLOCK_BEGIN);
  const escapedEnd = escapeRegExp(MANAGED_NGINX_CONFIG_BLOCK_END);
  return content.match(new RegExp(`[ \\t]*${escapedBegin}[\\s\\S]*?[ \\t]*${escapedEnd}`, 'm'))?.[0];
}

export function replaceManagedNginxConfigBlock(content: string, managedConfigBlock: string): string {
  const escapedBegin = escapeRegExp(MANAGED_NGINX_CONFIG_BLOCK_BEGIN);
  const escapedEnd = escapeRegExp(MANAGED_NGINX_CONFIG_BLOCK_END);
  return content.replace(new RegExp(`[ \\t]*${escapedBegin}[\\s\\S]*?[ \\t]*${escapedEnd}`, 'm'), managedConfigBlock);
}

export function resolveEnvProxyEntryDir(
  envName: string,
  options?: {
    scope?: CliHomeScope;
    provider?: ProxyProvider;
  },
): string {
  return path.dirname(resolveEnvProxyAppOutputPath(envName, options));
}

export function resolveEnvProxyNginxSnippetsOutputDir(options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyProviderRootDir('nginx', options), 'snippets');
}

export function resolveEnvProxyNginxPublicOutputDir(envName: string, options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyEntryDir(envName, { scope: options?.scope, provider: 'nginx' }), 'public');
}

export function resolveEnvProxyNginxIndexOutputPath(
  envName: string,
  variant: 'v1' | 'v2',
  options?: { scope?: CliHomeScope },
): string {
  return path.join(resolveEnvProxyNginxPublicOutputDir(envName, { scope: options?.scope }), `index-${variant}.html`);
}

export async function syncEnvProxyNginxSnippets(options?: { scope?: CliHomeScope }): Promise<string> {
  const sourceDir = path.join(ENV_PROXY_NGINX_ASSET_DIR, 'snippets');
  const outputDir = resolveEnvProxyNginxSnippetsOutputDir(options);
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    await copyFile(path.join(sourceDir, entry.name), path.join(outputDir, entry.name));
  }
  return outputDir;
}

export function resolveEnvProxyCaddyPublicOutputDir(envName: string, options?: { scope?: CliHomeScope }): string {
  return path.join(resolveEnvProxyEntryDir(envName, { scope: options?.scope, provider: 'caddy' }), 'public');
}

export function resolveEnvProxyCaddyIndexOutputPath(
  envName: string,
  variant: 'v1' | 'v2',
  options?: { scope?: CliHomeScope },
): string {
  return path.join(resolveEnvProxyCaddyPublicOutputDir(envName, { scope: options?.scope }), `index-${variant}.html`);
}

export async function buildEnvProxyNginxBundle(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyNginxBundle> {
  return await buildNginxBundleFromSource(await resolveRuntimeNginxBundleSource(runtime, options), options);
}

export async function buildManualEnvProxyNginxBundle(
  input: ManualEnvProxyNginxInput,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyNginxBundle> {
  return await buildNginxBundleFromSource(await resolveManualNginxBundleSource(input), {
    ...options,
    upstreamHost: trimValue(input.upstreamHost) ?? options?.upstreamHost,
    upstreamPort: normalizeProxyPort(input.upstreamPort) ?? options?.upstreamPort,
  });
}

async function buildNginxBundleFromSource(
  source: NginxBundleSource,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyNginxBundle> {
  const context = await buildEnvProxyNginxRenderContext(source, options);
  const appTemplate = await readEnvProxyNginxAssetText('app.conf.tpl');
  const mainTemplate = await readEnvProxyNginxAssetText('nocobase.conf.tpl');
  const sourceIndexV1Path = path.join(source.distRootPath, context.activeVersion, 'index.html');
  const sourceIndexV2Path = path.join(source.distRootPath, context.activeVersion, DEFAULT_MODERN_CLIENT_PREFIX, 'index.html');
  const [sourceIndexV1Content, sourceIndexV2Content] = await Promise.all([
    readFile(sourceIndexV1Path, 'utf8'),
    readFile(sourceIndexV2Path, 'utf8'),
  ]);
  const v1RuntimeScript = buildRuntimeConfigScriptTag(buildNginxRuntimeConfig(context, 'v1'));
  const v2RuntimeScript = buildRuntimeConfigScriptTag(buildNginxRuntimeConfig(context, 'v2'));
  const sourceV1PublicPath = extractRuntimePublicPath(sourceIndexV1Content);
  const sourceV2PublicPath = extractRuntimePublicPath(sourceIndexV2Content);
  const indexV1AssetPublicPath = context.cdnBaseUrl;
  const indexV2AssetPublicPath = `${trimTrailingSlash(context.cdnBaseUrl)}/${DEFAULT_MODERN_CLIENT_PREFIX}/`;
  const appConfigIncludePath = await mapProxyPathFromCliRoot(
    path.join(resolveEnvProxyProviderRootDir('nginx', { scope: options?.scope }), '*', resolveEnvProxyFileSpec('nginx').appFilename),
    options,
  );
  const managedConfigBlock = buildNginxManagedConfigBlock(context);
  const templateValues = {
    apiBasePath: context.apiBasePath,
    backendUrl: context.backendUrl,
    distRootDir: context.distRootDir,
    entryDir: context.entryDir,
    managedConfigBlock,
    publicBasePath: context.appPublicPath,
    publicDir: context.publicDir,
    snippetsDir: context.snippetsDir,
    uploadsDir: context.uploadsDir,
    v2PublicPath: context.v2PublicPath,
    wsPath: context.wsPath,
  };

  return {
    envName: source.envName,
    envFilePath: context.envFilePath,
    entryDir: resolveEnvProxyEntryDir(source.envName, { scope: options?.scope, provider: 'nginx' }),
    publicDir: resolveEnvProxyNginxPublicOutputDir(source.envName, { scope: options?.scope }),
    appConfigPath: resolveEnvProxyAppOutputPath(source.envName, { scope: options?.scope, provider: 'nginx' }),
    indexV1Path: resolveEnvProxyNginxIndexOutputPath(source.envName, 'v1', { scope: options?.scope }),
    indexV2Path: resolveEnvProxyNginxIndexOutputPath(source.envName, 'v2', { scope: options?.scope }),
    mainConfigPath: resolveEnvProxyMainOutputPath({ scope: options?.scope, provider: 'nginx' }),
    snippetsDir: resolveEnvProxyNginxSnippetsOutputDir({ scope: options?.scope }),
    appPublicPath: context.appPublicPath,
    apiBasePath: context.apiBasePath,
    wsPath: context.wsPath,
    v2PublicPath: context.v2PublicPath,
    modernClientPrefix: context.modernClientPrefix,
    activeVersion: context.activeVersion,
    cdnBaseUrl: context.cdnBaseUrl,
    backendUrl: context.backendUrl,
    appConfigContent: renderTemplateString(appTemplate, templateValues),
    mainConfigContent: renderTemplateString(mainTemplate, {
      appConfigIncludePath,
      snippetsDir: await mapProxyPathFromCliRoot(resolveEnvProxyNginxSnippetsOutputDir({ scope: options?.scope }), options),
    }),
    indexV1Content: injectRuntimeScriptIntoHtml(
      rewriteHtmlAssetPublicPath(sourceIndexV1Content, sourceV1PublicPath, indexV1AssetPublicPath),
      v1RuntimeScript,
    ),
    indexV2Content: injectRuntimeScriptIntoHtml(
      rewriteHtmlAssetPublicPath(sourceIndexV2Content, sourceV2PublicPath, indexV2AssetPublicPath),
      v2RuntimeScript,
    ),
  };
}

export async function buildEnvProxyCaddyBundle(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyCaddyBundle> {
  return await buildCaddyBundleFromSource(await resolveRuntimeNginxBundleSource(runtime), options);
}

export async function buildManualEnvProxyCaddyBundle(
  input: ManualEnvProxyNginxInput,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyCaddyBundle> {
  return await buildCaddyBundleFromSource(await resolveManualNginxBundleSource(input), {
    ...options,
    upstreamHost: trimValue(input.upstreamHost) ?? options?.upstreamHost,
    upstreamPort: normalizeProxyPort(input.upstreamPort) ?? options?.upstreamPort,
  });
}

async function buildCaddyBundleFromSource(
  source: NginxBundleSource,
  options?: EnvProxyProviderOptions,
): Promise<EnvProxyCaddyBundle> {
  const context = await buildEnvProxyCaddyRenderContextFromSource(source, options);
  const sourceIndexV1Path = path.join(source.distRootPath, context.activeVersion, 'index.html');
  const sourceIndexV2Path = path.join(source.distRootPath, context.activeVersion, DEFAULT_MODERN_CLIENT_PREFIX, 'index.html');
  const [sourceIndexV1Content, sourceIndexV2Content] = await Promise.all([
    readFile(sourceIndexV1Path, 'utf8'),
    readFile(sourceIndexV2Path, 'utf8'),
  ]);
  const v1RuntimeScript = buildRuntimeConfigScriptTag(buildCaddyRuntimeConfig(context, 'v1'));
  const v2RuntimeScript = buildRuntimeConfigScriptTag(buildCaddyRuntimeConfig(context, 'v2'));
  const sourceV1PublicPath = extractRuntimePublicPath(sourceIndexV1Content);
  const sourceV2PublicPath = extractRuntimePublicPath(sourceIndexV2Content);
  const indexV1AssetPublicPath = context.cdnBaseUrl;
  const indexV2AssetPublicPath = `${trimTrailingSlash(context.cdnBaseUrl)}/${DEFAULT_MODERN_CLIENT_PREFIX}/`;
  const appConfigPath = resolveEnvProxyAppOutputPath(source.envName, { scope: options?.scope, provider: 'caddy' });
  const entryDir = resolveEnvProxyEntryDir(source.envName, { scope: options?.scope, provider: 'caddy' });
  const publicDir = resolveEnvProxyCaddyPublicOutputDir(source.envName, { scope: options?.scope });
  const renderedPublicDir = await mapProxyPathFromCliRoot(publicDir, { ...options, provider: 'caddy' });
  const appConfigContent = renderCaddyAppTemplate(buildCaddySiteAddress(), {
    appPublicPath: context.appPublicPath,
    apiBasePath: context.apiBasePath,
    apiPort: context.apiPort,
    distPath: context.distPath,
    distClientRoot: context.distRootDir,
    modernClientPrefix: context.modernClientPrefix,
    otherLocation: '',
    proxyHost: context.proxyHost,
    uploadsPath: context.uploadsDir,
    v2PublicPath: context.v2PublicPath,
    wsPath: context.wsPath,
  }, renderedPublicDir);

  return {
    envName: source.envName,
    envFilePath: context.envFilePath,
    entryDir,
    publicDir,
    appConfigPath,
    indexV1Path: resolveEnvProxyCaddyIndexOutputPath(source.envName, 'v1', { scope: options?.scope }),
    indexV2Path: resolveEnvProxyCaddyIndexOutputPath(source.envName, 'v2', { scope: options?.scope }),
    mainConfigPath: resolveEnvProxyMainOutputPath({ scope: options?.scope, provider: 'caddy' }),
    appPublicPath: context.appPublicPath,
    apiBasePath: context.apiBasePath,
    wsPath: context.wsPath,
    v2PublicPath: context.v2PublicPath,
    modernClientPrefix: context.modernClientPrefix,
    activeVersion: context.activeVersion,
    cdnBaseUrl: context.cdnBaseUrl,
    backendUrl: context.backendUrl,
    appConfigContent,
    mainConfigContent: await buildEnvProxyMainConfig({ provider: 'caddy', scope: options?.scope }),
    indexV1Content: injectRuntimeScriptIntoHtml(
      rewriteHtmlAssetPublicPath(sourceIndexV1Content, sourceV1PublicPath, indexV1AssetPublicPath),
      v1RuntimeScript,
    ),
    indexV2Content: injectRuntimeScriptIntoHtml(
      rewriteHtmlAssetPublicPath(sourceIndexV2Content, sourceV2PublicPath, indexV2AssetPublicPath),
      v2RuntimeScript,
    ),
  };
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

function buildNginxProxyPassBlock(
  proxyHost: string,
  apiPort: string,
  options?: {
    allowUpgrade?: boolean;
  },
) {
  const directives = [
    `proxy_pass http://${proxyHost}:${apiPort};`,
    'proxy_http_version 1.1;',
    ...(options?.allowUpgrade
      ? ['proxy_set_header Upgrade $http_upgrade;', 'proxy_set_header Connection $connection_upgrade;']
      : []),
    'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    'proxy_set_header X-Forwarded-Proto $upstream_x_forwarded_proto;',
    'proxy_set_header Host $final_host;',
    'proxy_set_header Referer $http_referer;',
    'proxy_set_header User-Agent $http_user_agent;',
    "add_header Cache-Control 'no-cache, no-store';",
    ...(options?.allowUpgrade ? ['proxy_cache_bypass $http_upgrade;'] : []),
    'proxy_connect_timeout 600;',
    'proxy_send_timeout 600;',
    'proxy_read_timeout 600;',
    'send_timeout 600;',
  ];

  return directives.join('\n        ');
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
  const apiBasePathNoTrailingSlash = trimTrailingSlash(context.apiBasePath);

  return `    location ~* ^${context.appPublicPath}storage/uploads/(.*\\.md)$ {
        alias ${context.uploadsPath}/$1;
        default_type text/markdown;
        add_header Cache-Control "public";
        add_header Content-Disposition "inline";
        add_header Content-Security-Policy "sandbox" always;
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        autoindex off;
    }

    location ~* ^${context.appPublicPath}storage/uploads/(.*\\.(?:htm|html|pdf|svg|svgz|xht|xhtml|xml|xsl|xslt))$ {
        alias ${context.uploadsPath}/$1;
        add_header Cache-Control "public";
        add_header Content-Disposition "attachment" always;
        add_header Content-Security-Policy "sandbox" always;
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        autoindex off;
    }

    location ${context.appPublicPath}storage/uploads/ {
        alias ${context.uploadsPath}/;
        add_header Cache-Control "public";
        add_header Content-Security-Policy "sandbox" always;
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        autoindex off;
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

    location = ${apiBasePathNoTrailingSlash} {
        return 308 ${context.apiBasePath}$is_args$args;
    }

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
  return `# Managed by NocoBase CLI. Changes will be overwritten.

${renderNginxLocationTemplate(context)}`;
}

function buildCaddyContextCommentLines(
  siteAddress: string,
  context: EnvProxyTemplateContext,
  publicDir: string,
): string[] {
  return [
    '# Rendered by `nb proxy caddy generate`.',
    '# Context:',
    `# host=${siteAddress}`,
    `# publicBasePath=${context.appPublicPath}`,
    `# apiBasePath=${context.apiBasePath}`,
    `# wsPath=${context.wsPath}`,
    `# v2PublicPath=${context.v2PublicPath}`,
    `# backendUrl=http://${context.proxyHost}:${context.apiPort}`,
    `# uploadsDir=${context.uploadsPath}`,
    `# distRootDir=${context.distClientRoot}`,
    `# publicDir=${publicDir}`,
  ];
}

function renderCaddyAppTemplate(siteAddress: string, context: EnvProxyTemplateContext, publicDir: string): string {
  const uploadsPath = `${context.appPublicPath}storage/uploads/`;
  const distPathMatcher = toCaddyPathMatcher(context.distPath);
  const uploadsPathMatcher = toCaddyPathMatcher(uploadsPath);
  const apiPathMatcher = toCaddyPathMatcher(context.apiBasePath);
  const appPublicPathNoTrailingSlash = trimTrailingSlash(context.appPublicPath);
  const v2PublicPathNoTrailingSlash = trimTrailingSlash(context.v2PublicPath);
  const rootRedirectBlock =
    context.appPublicPath === DEFAULT_APP_PUBLIC_PATH
      ? ''
      : `

    handle / {
        redir * ${context.appPublicPath} 302
    }`;
  const appPublicPathRedirectBlock =
    context.appPublicPath === DEFAULT_APP_PUBLIC_PATH
      ? ''
      : `

    handle ${appPublicPathNoTrailingSlash} {
        redir * ${context.appPublicPath} 302
    }`;
  const modernClientRedirectBlock = `

    handle ${v2PublicPathNoTrailingSlash} {
        redir * ${context.v2PublicPath} 302
    }`;
  const shorthandModernClientRedirectBlock =
    context.appPublicPath === DEFAULT_APP_PUBLIC_PATH
      ? ''
      : `

    handle /${context.modernClientPrefix} {
        redir * ${context.v2PublicPath} 302
    }

    handle /${context.modernClientPrefix}/* {
        redir * ${appPublicPathNoTrailingSlash}{uri} 302
    }`;

  return [
    ...buildCaddyContextCommentLines(siteAddress, context, publicDir),
    '',
    `${siteAddress} {`,
    `    encode zstd gzip${rootRedirectBlock}${appPublicPathRedirectBlock}${modernClientRedirectBlock}${shorthandModernClientRedirectBlock}`,
    '',
    '    @activeUploadedContent path_regexp activeUploadedContent (?i)\\.(?:htm|html|pdf|svg|svgz|xht|xhtml|xml|xsl|xslt)$',
    '',
    `    handle_path ${uploadsPathMatcher} {`,
    `        root * ${context.uploadsPath}`,
    '        header Cache-Control public',
    '        header Content-Security-Policy sandbox',
    '        header X-Content-Type-Options nosniff',
    '        header @activeUploadedContent Content-Disposition attachment',
    '        file_server',
    '    }',
    '',
    `    handle_path ${distPathMatcher} {`,
    `        root * ${context.distClientRoot}`,
    '        header Cache-Control public',
    '        file_server',
    '    }',
    '',
    '    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$',
    '    handle @oauth {',
    '        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server',
    `        reverse_proxy ${context.proxyHost}:${context.apiPort}`,
    '    }',
    '',
    '    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$',
    '    handle @openid {',
    '        rewrite * /{re.openid.1}/.well-known/openid-configuration',
    `        reverse_proxy ${context.proxyHost}:${context.apiPort}`,
    '    }',
    '',
    '    # Keep API and WS routes above the SPA fallbacks.',
    `    handle ${apiPathMatcher} {`,
    `        reverse_proxy ${context.proxyHost}:${context.apiPort}`,
    '    }',
    '',
    `    handle ${context.wsPath} {`,
    `        reverse_proxy ${context.proxyHost}:${context.apiPort}`,
    '    }',
    '',
    '    # Keep the v2 SPA route above the fallback SPA route.',
    `    handle_path ${toCaddyPathMatcher(context.v2PublicPath)} {`,
    `        root * ${publicDir}`,
    '        header Cache-Control "no-store, no-cache, must-revalidate"',
    '        header X-Robots-Tag "noindex, nofollow"',
    '        try_files {path} /index-v2.html',
    '        file_server',
    '    }',
    '',
    `    handle_path ${toCaddyPathMatcher(context.appPublicPath)} {`,
    `        root * ${publicDir}`,
    '        header Cache-Control "no-store, no-cache, must-revalidate"',
    '        header X-Robots-Tag "noindex, nofollow"',
    '        try_files {path} /index-v1.html',
    '        file_server',
    '    }',
    '}',
    '',
  ].join('\n');
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

function renderCaddyMainTemplate(appConfigImportPath: string): string {
  return `# Managed by NocoBase CLI. Changes will be overwritten.

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
  const publicDir =
    provider === 'caddy'
      ? await mapProxyPathFromCliRoot(resolveEnvProxyCaddyPublicOutputDir(runtime.envName, { scope: options?.scope }), options)
      : undefined;

  return {
    ...base,
    content:
      provider === 'caddy'
        ? renderCaddyAppTemplate(buildCaddySiteAddress(), templateContext, publicDir ?? '')
        : renderNginxGeneratedTemplate(templateContext),
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
  options?: EnvProxyProviderOptions,
): Promise<string> {
  return await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath(options), options);
}

export async function buildEnvProxyMainConfig(
  options?: EnvProxyProviderOptions,
): Promise<string> {
  const provider = resolveProxyProviderName(options?.provider);
  if (provider === 'caddy') {
    const appConfigImportPath = await mapProxyPathFromCliRoot(
      path.join(resolveEnvProxyProviderRootDir(provider, options), '*', resolveEnvProxyFileSpec(provider).appFilename),
      options,
    );
    return renderCaddyMainTemplate(appConfigImportPath);
  }

  const template = await readEnvProxyNginxAssetText('nocobase.conf.tpl');
  return renderTemplateString(template, {
    appConfigIncludePath: await mapProxyPathFromCliRoot(
      path.join(resolveEnvProxyProviderRootDir(provider, options), '*', resolveEnvProxyFileSpec(provider).appFilename),
      options,
    ),
    snippetsDir: await mapProxyPathFromCliRoot(resolveEnvProxyNginxSnippetsOutputDir({ scope: options?.scope }), options),
  });
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
