import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { classifyPluginRegistration } from '@nocobase/app-server/plugins';

import {
  isPluginPackageName,
  pluginCommandName,
  type FoundationLocalizedText,
  type FoundationPluginMetadata,
  type FoundationPluginView,
  type FoundationPluginsMeta,
} from '../shared/plugins.js';

interface ApplicationManifest {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly deployed: boolean;
  /** The packages the application's `cli/plugins` registers. */
  readonly cliPlugins: ReadonlySet<string>;
}

interface InstalledPlugin extends FoundationPluginMetadata {
  readonly version?: string;
  readonly entries: { client: boolean; server: boolean; cli: boolean };
  readonly requires: readonly string[];
  /** Those of `requires` declared optional: needed for all of the plugin's features, not for it to start. */
  readonly optionalRequires: readonly string[];
}

export interface FoundationPluginCatalogOptions {
  /** The directory holding the application's `package.json`, where plugin packages are resolved from. */
  readonly rootDir: string;
  /** The server registrations of the running application, in registration order. */
  readonly serverPlugins: () =>
    | readonly { readonly packageName: string; readonly version?: string }[]
    | undefined;
}

/**
 * The plugins an application declares and registers, classified the way `pnpm nocobase plugin inspect` classifies
 * them. Manifests are read once per process, since installed packages do not change while it runs; every call only
 * combines them with the registrations.
 */
export class FoundationPluginCatalog {
  private application?: Promise<ApplicationManifest>;
  private readonly installed = new Map<
    string,
    Promise<InstalledPlugin | undefined>
  >();

  public constructor(
    private readonly options: FoundationPluginCatalogOptions,
  ) {}

  /**
   * `clientPlugins` are the packages the browser's application registers, which only the browser knows. Without
   * them, a plugin with a page is taken as registered on its client side exactly when it is on its server side.
   *
   * They come from the request, so they only answer whether a plugin the application already declares or the server
   * registers is registered in the browser: a name outside that set is ignored and never looked up or cached.
   */
  public async list(clientPlugins?: readonly string[]): Promise<{
    readonly data: FoundationPluginView[];
    readonly meta: FoundationPluginsMeta;
  }> {
    const application = await this.readApplication();
    const serverPlugins = (this.options.serverPlugins() ?? []).filter(
      ({ packageName }) => isPluginPackageName(packageName),
    );
    const server = new Set(serverPlugins.map(({ packageName }) => packageName));
    const names = [
      ...new Set([
        ...server,
        ...[
          ...Object.keys(application.dependencies),
          ...Object.keys(application.devDependencies),
        ]
          .filter(isPluginPackageName)
          .sort(),
      ]),
    ];
    const client = clientPlugins ? new Set(clientPlugins) : undefined;
    const serverVersions = new Map(
      serverPlugins.map(({ packageName, version }) => [packageName, version]),
    );

    const classified = await Promise.all(
      names.map(async (packageName) => {
        const installed = await this.readInstalled(packageName);
        const entries = installed?.entries ?? {
          client: false,
          server: false,
          cli: false,
        };
        const dependencyField =
          packageName in application.dependencies
            ? ('dependencies' as const)
            : packageName in application.devDependencies
              ? ('devDependencies' as const)
              : undefined;
        const registration = classifyPluginRegistration({
          dependencyField,
          installed: installed !== undefined,
          entries,
          registered: {
            server: server.has(packageName),
            client: client
              ? client.has(packageName)
              : entries.client && entries.server && server.has(packageName),
            cli: application.cliPlugins.has(packageName),
          },
        });
        return { packageName, installed, dependencyField, registration };
      }),
    );
    const enabled = new Set(
      classified
        .filter(
          ({ registration }) =>
            registration.enabled || registration.state === 'registered',
        )
        .map(({ packageName }) => packageName),
    );

    const data = classified.map(
      ({ packageName, installed, dependencyField, registration }) => {
        const requires = installed?.requires ?? [];
        const optionalRequires = installed?.optionalRequires ?? [];
        const optional = new Set(optionalRequires);
        const isEnabled = enabled.has(packageName);
        const version = installed?.version ?? serverVersions.get(packageName);
        return {
          packageName,
          name: pluginCommandName(packageName),
          ...(version ? { version } : {}),
          ...(installed?.title !== undefined ? { title: installed.title } : {}),
          ...(installed?.description !== undefined
            ? { description: installed.description }
            : {}),
          ...(installed?.docs !== undefined ? { docs: installed.docs } : {}),
          ...(dependencyField ? { dependencyField } : {}),
          enabled: isEnabled,
          state: registration.state,
          skillsOnly: registration.skillsOnly,
          issues: registration.issues.map(({ code }) => code),
          requires,
          optionalRequires,
          // Enabling a plugin brings everything it builds on; an enabled one only lacks what it cannot work without.
          missingRequires: requires.filter(
            (name) => !enabled.has(name) && !(isEnabled && optional.has(name)),
          ),
        } satisfies FoundationPluginView;
      },
    );
    return { data, meta: { deployed: application.deployed } };
  }

  private readApplication(): Promise<ApplicationManifest> {
    this.application ??= Promise.all([
      readJson(path.join(this.options.rootDir, 'package.json')),
      readCliPlugins(this.options.rootDir),
    ]).then(([manifest, cliPlugins]) => {
      const nocobase = record(manifest?.nocobase);
      return {
        dependencies: stringRecord(manifest?.dependencies),
        devDependencies: stringRecord(manifest?.devDependencies),
        // `pnpm build` records when it built the deployable `dist/package.json`, which lists only `dependencies`.
        deployed: typeof nocobase?.builtAt === 'string',
        cliPlugins,
      };
    });
    return this.application;
  }

  private readInstalled(
    packageName: string,
  ): Promise<InstalledPlugin | undefined> {
    let pending = this.installed.get(packageName);
    if (!pending) {
      pending = this.findInstalled(packageName);
      this.installed.set(packageName, pending);
    }
    return pending;
  }

  /** Resolves the package the way Node resolves a bare specifier from the application's root. */
  private async findInstalled(
    packageName: string,
  ): Promise<InstalledPlugin | undefined> {
    for (let directory = this.options.rootDir; ;) {
      const manifest = await readJson(
        path.join(directory, 'node_modules', packageName, 'package.json'),
      );
      if (manifest?.name === packageName) return installedPlugin(manifest);
      const parent = path.dirname(directory);
      if (parent === directory) return undefined;
      directory = parent;
    }
  }
}

function installedPlugin(manifest: Record<string, unknown>): InstalledPlugin {
  const exports = record(manifest.exports) ?? {};
  const peers = stringRecord(manifest.peerDependencies);
  const peersMeta = record(manifest.peerDependenciesMeta) ?? {};
  const nocobase = record(manifest.nocobase) ?? {};
  const requires = Object.keys(peers).filter(isPluginPackageName).sort();
  const title = localizedText(nocobase.title);
  const description = localizedText(nocobase.description);
  const docs = localizedText(nocobase.docs);
  return {
    ...(typeof manifest.version === 'string'
      ? { version: manifest.version }
      : {}),
    entries: {
      client: exports['./client'] !== undefined,
      server: exports['./server'] !== undefined,
      cli: exports['./cli'] !== undefined,
    },
    requires,
    optionalRequires: requires.filter(
      (name) => record(peersMeta[name])?.optional === true,
    ),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(docs !== undefined ? { docs } : {}),
  };
}

/**
 * The packages the application's CLI composition root registers. The running server never loads the CLI, so it reads
 * the root's import specifiers instead: `cli/plugins.ts` in a source checkout and the compiled `cli/plugins.js` a build
 * writes, which keeps them. A plugin's CLI entry is imported only to be registered there, which is what
 * `plugin register` writes and `plugin inspect` reads.
 */
async function readCliPlugins(rootDir: string): Promise<ReadonlySet<string>> {
  for (const file of ['plugins.ts', 'plugins.js']) {
    const source = await readFile(
      path.join(rootDir, 'cli', file),
      'utf8',
    ).catch(() => undefined);
    if (source === undefined) continue;
    return new Set(
      [...source.matchAll(/\bfrom\s+['"]([^'"]+)\/cli['"]/gu)]
        .map(([, packageName]) => packageName)
        .filter(isPluginPackageName),
    );
  }
  return new Set();
}

function localizedText(value: unknown): FoundationLocalizedText | undefined {
  if (typeof value === 'string') return value || undefined;
  const entries = Object.entries(record(value) ?? {}).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === 'string' && entry[1] !== '',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record(value) ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

async function readJson(
  file: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    return record(JSON.parse(await readFile(file, 'utf8')));
  } catch {
    return undefined;
  }
}
