/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { translateCli } from './cli-locale.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import {
  buildPortalBasePath,
  resolvePortalAppFromApiBaseUrl,
  resolvePortalStoragePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { run } from './run-npm.js';

const NOCOBASE_REGISTRY_NAMESPACE = '@nocobase';
const NOCOBASE_REGISTRY_URL = '${NOCOBASE_API_URL}/registry:get?name={name}';
const REGISTRY_ITEM_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  timeoutMs?: number;
};

type RunCommand = (name: string, args: string[], options?: RunOptions) => Promise<void>;
type RegistryIndexItem = { name: string; targets: string[] };
type RegistryProbeResult = { ok: boolean; status: number; statusText?: string; items?: RegistryIndexItem[] };
type RegistryProbe = (url: string) => Promise<RegistryProbeResult>;

export type PortalRegistrySyncOptions = {
  portal: string;
  env: PortalCreateEnvLike;
  items?: string[];
  overwrite?: boolean;
  overwriteUi?: boolean;
  diff?: boolean;
  build?: boolean;
  installDependencies?: boolean;
  skipIfUnsupported?: boolean;
  runCommand?: RunCommand;
  probeRegistry?: RegistryProbe;
  onWarning?: (message: string) => void;
};

export type PortalRegistrySyncResult = {
  portal: string;
  portalDir: string;
  items: string[];
  skippedItems: string[];
  status: 'installed' | 'diffed' | 'unsupported';
};

const portalRegistrySyncText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalRegistrySync.${key}`, values, { fallback });

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function normalizePortalRegistryItem(value: string): string {
  const normalized = value.trim();
  const namespacePrefix = `${NOCOBASE_REGISTRY_NAMESPACE}/`;
  const name = normalized.startsWith(namespacePrefix) ? normalized.slice(namespacePrefix.length) : normalized;
  if (!REGISTRY_ITEM_NAME_PATTERN.test(name) || (normalized.includes('/') && !normalized.startsWith(namespacePrefix))) {
    throw new Error(
      portalRegistrySyncText(
        'errors.invalidItem',
        { item: normalized },
        `Invalid Portal Registry item "${normalized}". Use a name such as "ai" or "@nocobase/ai".`,
      ),
    );
  }
  return `${NOCOBASE_REGISTRY_NAMESPACE}/${name}`;
}

export function normalizePortalRegistryItems(items: string[] = []): string[] {
  const values = items.length > 0 ? items : ['all'];
  return [...new Set(values.map(normalizePortalRegistryItem))];
}

function registryListUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/registry:list`;
}

async function defaultProbeRegistry(url: string): Promise<RegistryProbeResult> {
  const response = await fetch(url, { headers: { 'x-request-source': 'cli' } });
  let items: RegistryIndexItem[] | undefined;
  if (response.ok) {
    const document = (await response.json()) as unknown;
    const values =
      document && typeof document === 'object' && !Array.isArray(document)
        ? (document as { items?: unknown }).items
        : undefined;
    if (Array.isArray(values)) {
      items = values.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return [];
        }
        const { name, targets } = item as { name?: unknown; targets?: unknown };
        return typeof name === 'string' && Array.isArray(targets) && targets.every((target) => typeof target === 'string')
          ? [{ name, targets }]
          : [];
      });
    }
  }
  return { ok: response.ok, status: response.status, statusText: response.statusText, items };
}

function resolveRegistryTarget(portalDir: string, target: string): string | undefined {
  const resolved = path.resolve(portalDir, target);
  const relative = path.relative(portalDir, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return undefined;
  }
  return resolved;
}

async function isRegistryItemInstalled(portalDir: string, item: RegistryIndexItem | undefined): Promise<boolean> {
  if (!item?.targets.length) {
    return false;
  }
  for (const target of item.targets) {
    const resolved = resolveRegistryTarget(portalDir, target);
    if (!resolved || !(await pathExists(resolved))) {
      return false;
    }
  }
  return true;
}

async function configureNocoBaseRegistry(componentsJsonPath: string): Promise<void> {
  const raw = await readFile(componentsJsonPath, 'utf8');
  let components: Record<string, unknown>;
  try {
    components = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      portalRegistrySyncText(
        'errors.invalidComponentsJson',
        { componentsJsonPath },
        `Portal components.json is not valid JSON: ${componentsJsonPath}.`,
      ),
    );
  }
  const registries = components.registries;
  components.registries = {
    ...(registries && typeof registries === 'object' && !Array.isArray(registries) ? registries : {}),
    [NOCOBASE_REGISTRY_NAMESPACE]: NOCOBASE_REGISTRY_URL,
  };
  await writeFile(componentsJsonPath, `${JSON.stringify(components, null, 2)}\n`, 'utf8');
}

export async function syncPortalRegistries(options: PortalRegistrySyncOptions): Promise<PortalRegistrySyncResult> {
  const portal = validatePortalSlug(options.portal);
  if (options.overwriteUi && !options.overwrite) {
    throw new Error(
      portalRegistrySyncText(
        'errors.overwriteUiRequiresOverwrite',
        undefined,
        '--overwrite-ui requires --overwrite.',
      ),
    );
  }
  if (options.diff && (options.overwrite || options.build)) {
    throw new Error(
      portalRegistrySyncText(
        'errors.diffConflictsWithWrite',
        undefined,
        '--diff cannot be combined with --overwrite, --overwrite-ui, or --build.',
      ),
    );
  }
  const apiBaseUrl = String(options.env.apiBaseUrl ?? '').trim();
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath } = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
  const portalBase = buildPortalBasePath({ app, appPublicPath, portal });
  const portalDir = path.join(storagePath, 'portals', app, portal);
  const packageJsonPath = path.join(portalDir, 'package.json');
  const componentsJsonPath = path.join(portalDir, 'components.json');

  if (!(await pathExists(portalDir))) {
    throw new Error(
      portalRegistrySyncText(
        'errors.workspaceMissing',
        { portal, portalDir },
        `Portal does not exist: ${portalDir}\nRun \`nb portal create ${portal}\` first.`,
      ),
    );
  }
  if (!(await pathExists(packageJsonPath))) {
    throw new Error(
      portalRegistrySyncText(
        'errors.packageJsonMissing',
        { portalDir },
        `Portal is invalid: package.json is missing in ${portalDir}.`,
      ),
    );
  }
  if (!(await pathExists(componentsJsonPath))) {
    throw new Error(
      portalRegistrySyncText(
        'errors.componentsJsonMissing',
        { portalDir },
        `Portal is invalid: components.json is missing in ${portalDir}.`,
      ),
    );
  }

  const items = normalizePortalRegistryItems(options.items);
  let probe: RegistryProbeResult;
  try {
    probe = await (options.probeRegistry ?? defaultProbeRegistry)(registryListUrl(apiBaseUrl));
  } catch (error) {
    throw new Error(
      portalRegistrySyncText(
        'errors.registryUnavailable',
        { details: error instanceof Error ? error.message : String(error) },
        `Portal Registry request failed: ${error instanceof Error ? error.message : String(error)}.`,
      ),
      { cause: error },
    );
  }
  if (!probe.ok) {
    if (options.skipIfUnsupported && probe.status === 404) {
      options.onWarning?.(
        portalRegistrySyncText(
          'messages.registryUnsupported',
          undefined,
          'The selected NocoBase service does not expose Portal Registries; skipped automatic Registry installation.',
        ),
      );
      return { portal, portalDir, items, skippedItems: [], status: 'unsupported' };
    }
    throw new Error(
      portalRegistrySyncText(
        'errors.registryRequestFailed',
        { status: probe.status, details: probe.statusText ? ` (${probe.statusText})` : '' },
        `Portal Registry request failed with status ${probe.status}${probe.statusText ? ` ${probe.statusText}` : ''}.`,
      ),
    );
  }

  await configureNocoBaseRegistry(componentsJsonPath);
  const runCommand = options.runCommand ?? run;
  const commandEnv = buildPortalCommandEnv({
    NOCOBASE_API_URL: apiBaseUrl.replace(/\/+$/, ''),
    NOCOBASE_PORTAL_BASE: portalBase,
  });
  if (
    options.installDependencies === true ||
    (options.installDependencies !== false && !(await pathExists(path.join(portalDir, 'node_modules'))))
  ) {
    await runCommand('pnpm', ['install', '--frozen-lockfile'], {
      cwd: portalDir,
      env: commandEnv,
      envMode: 'replace',
      errorName: 'pnpm install',
    });
  }

  let installItems = items;
  const skippedItems: string[] = [];
  if (!options.overwrite && !options.diff && probe.items) {
    const registryItems = new Map<string, RegistryIndexItem>(
      probe.items.map((item) => [`${NOCOBASE_REGISTRY_NAMESPACE}/${item.name}`, item] as const),
    );
    const candidates = items.includes(`${NOCOBASE_REGISTRY_NAMESPACE}/all`)
      ? [...registryItems.keys()]
      : items;
    installItems = [];
    for (const itemName of candidates) {
      if (await isRegistryItemInstalled(portalDir, registryItems.get(itemName))) {
        skippedItems.push(itemName);
      } else {
        installItems.push(itemName);
      }
    }
  }

  let backupDir: string | undefined;
  const protectedDirectories: Array<{ name: string; target: string }> = [];
  const uiDir = path.join(portalDir, 'src', 'components', 'ui');
  const extensionsDir = path.join(portalDir, 'src', 'extensions');
  if (!options.diff && !options.overwrite && installItems.length > 0 && (await pathExists(extensionsDir))) {
    protectedDirectories.push({ name: 'extensions', target: extensionsDir });
  }
  if (!options.diff && !options.overwriteUi && installItems.length > 0 && (await pathExists(uiDir))) {
    protectedDirectories.push({ name: 'ui', target: uiDir });
  }
  if (protectedDirectories.length > 0) {
    backupDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-registry-'));
    for (const directory of protectedDirectories) {
      await cp(directory.target, path.join(backupDir, directory.name), { recursive: true });
    }
  }

  try {
    if (options.diff || installItems.length > 0) {
      await runCommand(
        'pnpm',
        [
          'exec',
          'shadcn',
          'add',
          ...(options.diff ? items : installItems),
          '--yes',
          ...(options.diff ? ['--diff'] : ['--overwrite']),
        ],
        {
          cwd: portalDir,
          env: commandEnv,
          envMode: 'replace',
          errorName: 'shadcn add',
        },
      );
    }
  } finally {
    if (backupDir) {
      try {
        for (const directory of protectedDirectories) {
          await cp(path.join(backupDir, directory.name), directory.target, { recursive: true, force: true });
        }
      } finally {
        await rm(backupDir, { recursive: true, force: true });
      }
    }
  }

  if (options.build) {
    await runCommand('pnpm', ['build'], {
      cwd: portalDir,
      env: commandEnv,
      envMode: 'replace',
      errorName: 'pnpm build',
    });
    await runCommand('pnpm', ['build:html'], {
      cwd: portalDir,
      env: commandEnv,
      envMode: 'replace',
      errorName: 'pnpm build:html',
    });
  }

  return {
    portal,
    portalDir,
    items: options.diff ? items : installItems,
    skippedItems,
    status: options.diff ? 'diffed' : 'installed',
  };
}
