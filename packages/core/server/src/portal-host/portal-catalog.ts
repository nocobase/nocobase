/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  CreatePortalDefinitionOptions,
  PortalAppFactory,
  PortalBackendKind,
  PortalDefinition,
  PortalIsolation,
  PortalResourcePolicy,
  PortalTier,
} from './portal-types';
import type { PortalRuntimeRegistry } from './portal-registry';

export interface DirectoryPortalCatalogOptions {
  portalsDir?: string;
}

interface PortalPackageJson {
  name?: string;
  version?: string;
  main?: string;
  exports?: string | { '.': string | { import?: string; default?: string } };
  portal?: {
    enabled?: boolean;
    appName?: string;
    portalName?: string;
    backend?: PortalBackendKind;
    configVersion?: string;
    isolation?: PortalIsolation;
    tier?: PortalTier;
    version?: string;
    entrypoint?: string;
    healthPath?: string;
    resourcePolicy?: PortalResourcePolicy;
    config?: unknown;
  };
}

type PortalModule = Record<string, unknown>;
type DynamicImport = (specifier: string) => Promise<PortalModule>;

export interface PortalCatalogSyncResult {
  registered: PortalDefinition[];
  updated: PortalDefinition[];
  unchanged: PortalDefinition[];
}

const DEFAULT_APP_NAME = 'main';
const SERVER_ENTRYPOINT_CANDIDATES = ['dist/server/embedded.js', 'server/embedded.ts'];

export class DirectoryPortalCatalog {
  readonly portalsDir: string;

  constructor(options: DirectoryPortalCatalogOptions = {}) {
    this.portalsDir = path.resolve(options.portalsDir ?? defaultPortalsDir());
  }

  async discover(): Promise<PortalDefinition[]> {
    const entries = await readDirectories(this.portalsDir);
    const definitions: PortalDefinition[] = [];

    for (const entry of entries) {
      if (!isValidPortalSegment(entry.name)) {
        continue;
      }

      const rootDir = path.join(this.portalsDir, entry.name);
      const packageJson = await readPortalPackage(rootDir);
      const directDefinition = packageJson
        ? await this.createDefinitionFromPackage({
            rootDir,
            packageJson,
            portalName: entry.name,
          })
        : null;

      if (directDefinition) {
        definitions.push(directDefinition);
        continue;
      }

      const appName = entry.name;
      const portalEntries = await readDirectories(rootDir);
      for (const portalEntry of portalEntries) {
        if (!isValidPortalSegment(portalEntry.name)) {
          continue;
        }

        const portalRootDir = path.join(rootDir, portalEntry.name);
        const portalPackageJson = await readPortalPackage(portalRootDir);
        if (!portalPackageJson) {
          continue;
        }

        const definition = await this.createDefinitionFromPackage({
          rootDir: portalRootDir,
          packageJson: portalPackageJson,
          appName,
          portalName: portalEntry.name,
        });
        if (definition) {
          definitions.push(definition);
        }
      }
    }

    return definitions.sort((a, b) => a.id.localeCompare(b.id));
  }

  async registerDiscovered(registry: PortalRuntimeRegistry): Promise<PortalDefinition[]> {
    const result = await this.syncDiscovered(registry);
    return result.registered;
  }

  async syncDiscovered(registry: PortalRuntimeRegistry): Promise<PortalCatalogSyncResult> {
    const definitions = await this.discover();
    const result: PortalCatalogSyncResult = {
      registered: [],
      updated: [],
      unchanged: [],
    };

    for (const definition of definitions) {
      if (registry.has(definition.id)) {
        const current = registry.definition(definition.id);
        if (current && definitionsEquivalent(current, definition)) {
          result.unchanged.push(current);
          continue;
        }

        result.updated.push(await registry.updateDefinition(definition.id, definitionToOptions(definition)));
        continue;
      }

      result.registered.push(await registry.register(definition.id, definitionToOptions(definition)));
    }

    return result;
  }

  async resolveFactory(definition: PortalDefinition): Promise<PortalAppFactory> {
    if (!definition.rootDir) {
      throw new Error(`Portal ${definition.id} has no rootDir and cannot be loaded from the directory catalog`);
    }

    const entrypoint = definition.entrypoint ?? 'server-dist/server/portal.js';
    const absoluteEntrypoint = path.resolve(definition.rootDir, entrypoint);
    assertInside(definition.rootDir, absoluteEntrypoint);

    await stat(absoluteEntrypoint);

    const module = await importModule(pathToFileURL(absoluteEntrypoint).href);
    const factory = module.createPortal ?? module.default ?? module.createExamplePortal;

    if (typeof factory === 'function') {
      return factory as PortalAppFactory;
    }

    if (typeof module.createApp === 'function') {
      const createApp = module.createApp as () => ReturnType<PortalAppFactory>;
      return (() => createApp()) as PortalAppFactory;
    }

    throw new Error(
      `Portal ${definition.id} must export createPortal(scope), default(scope), createExamplePortal(scope), or createApp()`,
    );
  }

  private async createDefinitionFromPackage(options: {
    rootDir: string;
    packageJson: PortalPackageJson;
    appName?: string;
    portalName: string;
  }): Promise<PortalDefinition | null> {
    const { rootDir, packageJson } = options;
    const appName = options.appName;
    const effectiveAppName = appName ?? DEFAULT_APP_NAME;
    const portalName = options.portalName;
    const entrypoint = await resolveEntrypoint(rootDir, packageJson);

    if (!entrypoint) {
      return null;
    }

    const absoluteEntrypoint = path.resolve(rootDir, entrypoint);
    assertInside(rootDir, absoluteEntrypoint);

    const id = appName ? composePortalId(effectiveAppName, portalName) : portalName;
    const basePath = appName ? publicBasePath(effectiveAppName, portalName) : `/portals/${portalName}`;
    const codeVersion = packageJson.portal?.version ?? packageJson.version ?? 'local';

    return {
      id,
      appName: effectiveAppName,
      portalName,
      basePath,
      enabled: packageJson.portal?.enabled ?? true,
      backend: packageJson.portal?.backend ?? packageJson.portal?.isolation ?? 'in-process',
      configVersion: packageJson.portal?.configVersion ?? 'v1',
      isolation: packageJson.portal?.isolation ?? 'in-process',
      tier: packageJson.portal?.tier ?? 'warm',
      desiredVersion: codeVersion,
      rootDir,
      dataDir: path.join(rootDir, 'data'),
      entrypoint,
      code: {
        version: codeVersion,
        rootDir,
        entrypoint,
      },
      healthPath: packageJson.portal?.healthPath ?? '/healthz',
      resourcePolicy: packageJson.portal?.resourcePolicy,
      config: packageJson.portal?.config,
    };
  }
}

export function defaultPortalsDir(): string {
  return path.resolve(__dirname, '../../portals');
}

async function readDirectories(rootDir: string): Promise<Array<{ name: string }>> {
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(rootDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return [];
    }

    throw error;
  }

  const directories: Array<{ name: string }> = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      directories.push({ name: entry.name });
      continue;
    }

    if (!entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = path.join(rootDir, entry.name);
    let stats: Awaited<ReturnType<typeof stat>> | null;
    try {
      stats = await stat(entryPath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') {
        stats = null;
      } else {
        throw error;
      }
    }

    if (stats?.isDirectory()) {
      directories.push({ name: entry.name });
    }
  }

  return directories;
}

async function readPortalPackage(rootDir: string): Promise<PortalPackageJson | null> {
  const packagePath = path.join(rootDir, 'package.json');

  try {
    return JSON.parse(await readFile(packagePath, 'utf8')) as PortalPackageJson;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function resolveEntrypoint(rootDir: string, packageJson: PortalPackageJson): Promise<string | null> {
  if (packageJson.portal?.entrypoint) {
    return packageJson.portal.entrypoint;
  }

  return firstExistingPath(rootDir, [
    ...SERVER_ENTRYPOINT_CANDIDATES,
    exportEntrypoint(packageJson.exports),
    packageJson.main,
  ]);
}

function exportEntrypoint(exportsField: PortalPackageJson['exports']): string | undefined {
  if (typeof exportsField === 'string') {
    return exportsField;
  }

  const rootExport = exportsField?.['.'];
  if (typeof rootExport === 'string') {
    return rootExport;
  }

  return rootExport?.import ?? rootExport?.default;
}

async function firstExistingPath(rootDir: string, candidates: Array<string | undefined>): Promise<string | null> {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const absolutePath = path.resolve(rootDir, candidate);
    assertInside(rootDir, absolutePath);

    try {
      const stats = await stat(absolutePath);
      if (stats.isFile()) {
        return candidate;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return null;
}

function definitionToOptions(definition: PortalDefinition): CreatePortalDefinitionOptions {
  return {
    appName: definition.appName,
    portalName: definition.portalName,
    basePath: definition.basePath,
    enabled: definition.enabled,
    configVersion: definition.configVersion,
    backend: definition.backend,
    isolation: definition.isolation,
    tier: definition.tier,
    desiredVersion: definition.desiredVersion,
    rootDir: definition.rootDir,
    dataDir: definition.dataDir,
    entrypoint: definition.entrypoint,
    code: definition.code,
    release: definition.release,
    healthPath: definition.healthPath,
    resourcePolicy: definition.resourcePolicy,
    config: definition.config,
  };
}

function definitionsEquivalent(a: PortalDefinition, b: PortalDefinition): boolean {
  return JSON.stringify(definitionToOptions(a)) === JSON.stringify(definitionToOptions(b));
}

function assertInside(rootDir: string, targetPath: string): void {
  const relative = path.relative(rootDir, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Portal entrypoint must stay inside ${rootDir}`);
  }
}

function isValidPortalSegment(segment: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(segment);
}

function composePortalId(appName: string, portalName: string): string {
  return `${appName}:${portalName}`;
}

function publicBasePath(appName: string, portalName: string): string {
  return appName === DEFAULT_APP_NAME ? `/portals/${portalName}` : `/apps/${appName}/portals/${portalName}`;
}

// Keep a real dynamic import after CommonJS transpilation so ESM portal bundles can be loaded.
// eslint-disable-next-line no-new-func
const importModule = new Function('specifier', 'return import(specifier)') as DynamicImport;
