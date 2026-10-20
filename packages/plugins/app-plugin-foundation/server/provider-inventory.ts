import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { apiDocsToken } from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { ServiceContainer } from '@nocobase/service-provider';

import type {
  FoundationCapabilityKey,
  FoundationProviderEntry,
  FoundationProviderInventory,
} from '../shared/foundation.js';
import { CAPABILITY_COLLECTORS } from './capabilities/index.js';

interface PackageManifest {
  readonly name?: string;
  readonly version?: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly exports?: Readonly<Record<string, unknown>>;
  readonly dependencies?: Readonly<Record<string, unknown>>;
  readonly devDependencies?: Readonly<Record<string, unknown>>;
  readonly optionalDependencies?: Readonly<Record<string, unknown>>;
}

/** Explicit additions to the collector-owned catalog; this is not an npm-scope heuristic. */
const ADDITIONAL_CATEGORIES: Readonly<
  Record<string, readonly FoundationCapabilityKey[]>
> = {
  '@nocobase/app-plugin-foundation': ['interface'],
  '@nocobase/app-plugin-database-explorer': ['dataModeling', 'interface'],
  '@nocobase/app-plugin-i18n': ['interface'],
  '@nocobase/app-plugin-template-print': ['interface'],
  '@nocobase/app-plugin-projects': [],
  '@nocobase/app-plugin-releases': [],
};

const CATEGORIES = new Map<string, readonly FoundationCapabilityKey[]>(
  Object.entries(ADDITIONAL_CATEGORIES),
);
for (const collector of CAPABILITY_COLLECTORS) {
  for (const name of collector.packages)
    CATEGORIES.set(name, [
      ...new Set([...(CATEGORIES.get(name) ?? []), collector.key]),
    ]);
}

export interface RuntimeProviderEvidence {
  readonly name: string;
  readonly version?: string;
  readonly rootDir?: string;
  readonly evidence:
    | 'databaseContribution'
    | 'apiContribution'
    | 'foundationRuntime'
    | 'serverRegistration';
}

/** Reads public host contributions, without importing application code or accessing private runtime fields. */
export function runtimeProviderEvidence(
  app: AppPluginApplication,
): readonly RuntimeProviderEvidence[] {
  const evidence: RuntimeProviderEvidence[] = [
    { name: '@nocobase/app-plugin-foundation', evidence: 'foundationRuntime' },
  ];
  for (const plugin of app.registeredServerPlugins ?? [])
    evidence.push({
      name: plugin.packageName,
      version: plugin.version,
      rootDir: plugin.rootDir,
      evidence: 'serverRegistration',
    });
  // Older hosts and hand-composed applications may not publish database task contributions.
  if ('databaseTaskContributions' in app) {
    const tasks: unknown = app.databaseTaskContributions;
    if (isRecord(tasks)) {
      for (const key of ['migrations', 'seeds']) {
        const sources = tasks[key];
        if (!Array.isArray(sources)) continue;
        for (const source of sources) {
          if (
            isRecord(source) &&
            typeof source.packageName === 'string' &&
            source.packageName !== tasks.appPackageName
          )
            evidence.push({
              name: source.packageName,
              evidence: 'databaseContribution',
            });
        }
      }
    }
  }
  evidence.push(...apiProviderEvidence(app.container));
  return evidence;
}

function apiProviderEvidence(
  container: ServiceContainer,
): RuntimeProviderEvidence[] {
  if (!container.has(apiDocsToken)) return [];
  const routes = container.resolve(apiDocsToken).forwardedApiRoutes;
  return [...routes.routers, ...routes.undeclared].map(({ owner }) => ({
    name: owner,
    evidence: 'apiContribution',
  }));
}

/** A deliberately bounded scan of direct application dependencies plus known providers and runtime owners. */
export async function collectProviderInventory(
  rootDir: string,
  runtime: readonly RuntimeProviderEvidence[] = [],
  serverRegistrationsComplete = false,
): Promise<FoundationProviderInventory> {
  const app = await readManifest(path.join(rootDir, 'package.json'));
  const unreadable: string[] = app ? [] : ['applicationManifest'];
  const declared = new Set([
    ...Object.keys(app?.dependencies ?? {}),
    ...Object.keys(app?.devDependencies ?? {}),
    ...Object.keys(app?.optionalDependencies ?? {}),
  ]);
  const names = [
    ...new Set([
      ...declared,
      ...CATEGORIES.keys(),
      ...runtime.map(({ name }) => name),
    ]),
  ].sort();
  const entries: FoundationProviderEntry[] = [];
  // Serial manifest reads keep the scan bounded even in applications with many dependencies.
  for (const name of names) {
    if (!validPackageName(name) || name === app?.name) continue;
    const observed = runtime.filter((entry) => entry.name === name);
    const registered = observed.find(
      (entry) => entry.evidence === 'serverRegistration',
    );
    const resolvedManifest = registered?.rootDir
      ? await readManifest(path.join(registered.rootDir, 'package.json'))
      : undefined;
    const manifest =
      resolvedManifest?.name === name
        ? resolvedManifest
        : await findManifest(rootDir, name);
    const conventional = /(?:^|\/)app-plugin-[a-z0-9-]+$/.test(name);
    const exports = manifest?.exports;
    // A generic ./server or ./client export (for example react-dom/server) is not a plugin declaration.
    const hasPluginEntry = exports && './client/plugin' in exports;
    const known = CATEGORIES.has(name);
    if (!known && !conventional && !hasPluginEntry && observed.length === 0)
      continue;
    if (
      !manifest &&
      observed.length === 0 &&
      !(declared.has(name) && conventional)
    )
      continue;
    if (!manifest && (declared.has(name) || registered?.rootDir))
      unreadable.push(name);
    entries.push({
      name,
      ...(manifest?.displayName ? { displayName: manifest.displayName } : {}),
      ...(manifest?.description ? { description: manifest.description } : {}),
      version: registered?.version ?? manifest?.version ?? null,
      installed: manifest !== undefined,
      kind: conventional || !known ? 'plugin' : 'core',
      origin: known ? 'nocobase' : 'unverified',
      categories: CATEGORIES.get(name) ?? [],
      registration: observed.length > 0 ? 'observed' : 'unknown',
      evidence: [
        ...new Set([
          ...(manifest ? ['manifest' as const] : []),
          ...observed.map((entry) => entry.evidence),
        ]),
      ],
    });
  }
  return {
    entries,
    complete: unreadable.length === 0,
    unreadable,
    serverRegistrationsComplete,
  };
}

async function findManifest(
  rootDir: string,
  name: string,
): Promise<PackageManifest | undefined> {
  let directory = rootDir;
  for (;;) {
    const manifest = await readManifest(
      path.join(directory, 'node_modules', name, 'package.json'),
    );
    if (manifest?.name === name) return manifest;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

async function readManifest(
  file: string,
): Promise<PackageManifest | undefined> {
  try {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (!isRecord(value)) return undefined;
    return {
      ...(typeof value.name === 'string' ? { name: value.name } : {}),
      ...(typeof value.version === 'string' ? { version: value.version } : {}),
      ...(typeof value.displayName === 'string'
        ? { displayName: value.displayName }
        : {}),
      ...(typeof value.description === 'string'
        ? { description: value.description }
        : {}),
      ...(isRecord(value.exports) ? { exports: value.exports } : {}),
      ...(isRecord(value.dependencies)
        ? { dependencies: value.dependencies }
        : {}),
      ...(isRecord(value.devDependencies)
        ? { devDependencies: value.devDependencies }
        : {}),
      ...(isRecord(value.optionalDependencies)
        ? { optionalDependencies: value.optionalDependencies }
        : {}),
    };
  } catch {
    return undefined;
  }
}

function validPackageName(name: string): boolean {
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
