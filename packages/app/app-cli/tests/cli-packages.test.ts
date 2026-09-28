// @vitest-environment node
// How a direct dependency that names a CLI entry is found, which runs import it, and what its entry has to be.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  findCliPackages,
  loadCliPackages,
  selectCliPackages,
  type CliPackage,
} from '../src/runtime/cli-packages.ts';
import { pluginTopicFor } from '../src/plugins/define.ts';
import type { AppLocation } from '../src/runtime/location.ts';

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'cli-packages-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeJson(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

/** An application whose package.json declares these dependencies. */
function app(manifest: Record<string, unknown>): AppLocation {
  writeJson(path.join(root, 'package.json'), {
    name: 'crm',
    nocobase: { templateKind: 'app' },
    ...manifest,
  });
  return { kind: 'source', root };
}

/** Installs a package into the application's node_modules, with an optional entry module. */
function install(
  packageName: string,
  manifest: Record<string, unknown>,
  entry?: string,
): string {
  const directory = path.join(root, 'node_modules', packageName);
  writeJson(path.join(directory, 'package.json'), {
    name: packageName,
    type: 'module',
    ...manifest,
  });
  if (entry !== undefined) writeFileSync(path.join(directory, 'cli.js'), entry);
  return directory;
}

const CLI_MANIFEST = {
  nocobase: { cli: { entry: './cli' } },
  exports: { './cli': { types: './cli.d.ts', import: './cli.js' } },
};

/** What `defineCliPlugin` returns, spelled out, so the fixture needs nothing installed to import. */
function pluginModule(
  packageName: string,
  extra: string = 'buildHooks: {}, devHooks: {}',
  topic: string = pluginTopicFor(packageName),
): string {
  return `class Go { static run() {} }
export default { packageName: ${JSON.stringify(packageName)}, topic: ${JSON.stringify(topic)}, commands: {}, devCommands: { go: Go }, ${extra} };
`;
}

describe('finding CLI packages', () => {
  it('takes only direct @nocobase dependencies that name a CLI entry', () => {
    const location = app({
      dependencies: { '@nocobase/app-server': '1.0.0' },
      devDependencies: { '@nocobase/hub-cli': '1.0.0', 'left-pad': '1.0.0' },
    });
    install('@nocobase/app-server', {});
    const hub = install('@nocobase/hub-cli', CLI_MANIFEST);
    // Not a dependency of the application, so it contributes nothing even when installed.
    install('@nocobase/transitive-cli', CLI_MANIFEST);
    install('left-pad', CLI_MANIFEST);

    expect(findCliPackages(location)).toEqual({
      installed: [
        {
          packageName: '@nocobase/hub-cli',
          topic: 'hub',
          directory: hub,
          entry: './cli',
          exports: CLI_MANIFEST.exports,
        },
      ],
      unavailable: [],
    });
  });

  it('reports a required dependency nobody installed, by the topic its name gives', () => {
    const location = app({
      devDependencies: { '@nocobase/hub-cli': '1.0.0' },
      optionalDependencies: { '@nocobase/extra-cli': '1.0.0' },
    });

    expect(findCliPackages(location)).toEqual({
      installed: [],
      // An optional dependency may be absent.
      unavailable: [{ packageName: '@nocobase/hub-cli', topic: 'hub' }],
    });
  });

  it('treats an unreadable package.json as not installed', () => {
    const location = app({ devDependencies: { '@nocobase/hub-cli': '1.0.0' } });
    const directory = path.join(root, 'node_modules', '@nocobase', 'hub-cli');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'package.json'), '{ not json');

    expect(findCliPackages(location).unavailable).toEqual([
      { packageName: '@nocobase/hub-cli', topic: 'hub' },
    ]);
  });

  it('finds nothing outside an application', () => {
    expect(findCliPackages({ kind: 'none', root })).toEqual({
      installed: [],
      unavailable: [],
    });
  });
});

describe('choosing what a run imports', () => {
  const hub: CliPackage = {
    packageName: '@nocobase/hub-cli',
    topic: 'hub',
    directory: '/app/node_modules/@nocobase/hub-cli',
    entry: './cli',
    exports: {},
  };
  const audit: CliPackage = {
    ...hub,
    packageName: '@nocobase/audit-cli',
    topic: 'audit',
  };
  const found = { installed: [hub, audit], unavailable: [] };
  const none = new Set<string>();

  it('imports the package whose topic the command is under, and lets the rest claim theirs', () => {
    expect(
      selectCliPackages(found, {
        head: 'hub',
        wholeTree: false,
        registered: none,
      }),
    ).toEqual({ load: [hub], claimed: { audit: '@nocobase/audit-cli' } });
  });

  it('imports none for another command', () => {
    expect(
      selectCliPackages(found, {
        head: 'db',
        wholeTree: false,
        registered: none,
      }),
    ).toEqual({
      load: [],
      claimed: { hub: '@nocobase/hub-cli', audit: '@nocobase/audit-cli' },
    });
  });

  it('imports every one for help and for the commands that read the whole tree', () => {
    for (const options of [
      { head: undefined, wholeTree: false },
      { head: 'commands', wholeTree: true },
    ]) {
      expect(
        selectCliPackages(found, { ...options, registered: none }).load,
      ).toEqual([hub, audit]);
    }
  });

  it('leaves a package cli/plugins.ts registers to that registration', () => {
    expect(
      selectCliPackages(found, {
        head: 'hub',
        wholeTree: false,
        registered: new Set(['@nocobase/hub-cli']),
      }),
    ).toEqual({ load: [], claimed: { audit: '@nocobase/audit-cli' } });
  });
});

describe('loading a CLI entry', () => {
  function found(packageName: string): CliPackage {
    const [cliPackage] = findCliPackages({ kind: 'source', root }).installed;
    if (cliPackage?.packageName !== packageName) {
      throw new Error(`${packageName} was not found`);
    }
    return cliPackage;
  }

  beforeEach(() => {
    app({ devDependencies: { '@nocobase/hub-cli': '1.0.0' } });
  });

  it('imports the entry its exports resolve to', async () => {
    install(
      '@nocobase/hub-cli',
      CLI_MANIFEST,
      pluginModule('@nocobase/hub-cli'),
    );

    const [plugin] = await loadCliPackages([found('@nocobase/hub-cli')]);

    expect(plugin?.packageName).toBe('@nocobase/hub-cli');
    expect(Object.keys(plugin?.devCommands ?? {})).toEqual(['go']);
  });

  it('follows the default condition and a bare string target', async () => {
    for (const exports of [
      { './cli': { default: './cli.js' } },
      { './cli': './cli.js' },
    ]) {
      install(
        '@nocobase/hub-cli',
        { ...CLI_MANIFEST, exports },
        pluginModule('@nocobase/hub-cli'),
      );
      await expect(
        loadCliPackages([found('@nocobase/hub-cli')]),
      ).resolves.toHaveLength(1);
    }
  });

  it('rejects an entry that is not an exported subpath', async () => {
    install('@nocobase/hub-cli', {
      nocobase: { cli: { entry: './cli' } },
      exports: { '.': './index.js' },
    });
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /exports no importable "\.\/cli"/,
    );

    install('@nocobase/hub-cli', {
      nocobase: { cli: { entry: 'cli.js' } },
      exports: CLI_MANIFEST.exports,
    });
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /nocobase\.cli\.entry/,
    );
  });

  it('rejects an export that points outside the package', async () => {
    install('@nocobase/hub-cli', {
      ...CLI_MANIFEST,
      exports: { './cli': './../../elsewhere.js' },
    });
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /outside its own directory/,
    );
  });

  it('names the package when its entry fails to import', async () => {
    install(
      '@nocobase/hub-cli',
      CLI_MANIFEST,
      "throw new Error('broken entry');\n",
    );
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /Could not load the CLI entry of @nocobase\/hub-cli/,
    );
  });

  // Each case installs into its own application: Node caches a module by its path, so a rewritten entry at the same
  // path would import as the first one.
  it('rejects an entry that is not a CLI plugin', async () => {
    install('@nocobase/hub-cli', CLI_MANIFEST, 'export default {};\n');
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /defineCliPlugin/,
    );
  });

  it('rejects an entry that defines another package', async () => {
    install(
      '@nocobase/hub-cli',
      CLI_MANIFEST,
      pluginModule('@nocobase/other-cli'),
    );
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /packageName must be "@nocobase\/hub-cli"/,
    );
  });

  it('rejects an entry that mounts under a topic other than the one its name gives', async () => {
    install(
      '@nocobase/hub-cli',
      CLI_MANIFEST,
      pluginModule('@nocobase/hub-cli', undefined, 'db'),
    );
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /topic must be "hub"/,
    );
  });

  it('rejects hooks, which only a plugin in cli/plugins.ts can contribute', async () => {
    install(
      '@nocobase/hub-cli',
      CLI_MANIFEST,
      pluginModule(
        '@nocobase/hub-cli',
        "buildHooks: { afterBuild: [{ command: ['true'] }] }, devHooks: {}",
      ),
    );
    await expect(loadCliPackages([found('@nocobase/hub-cli')])).rejects.toThrow(
      /build or dev hooks/,
    );
  });
});
