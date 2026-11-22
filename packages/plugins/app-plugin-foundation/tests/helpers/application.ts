import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface FixturePlugin {
  readonly name: string;
  readonly version?: string;
  readonly entries?: readonly ('client' | 'server' | 'cli')[];
  readonly peers?: readonly string[];
  readonly optionalPeers?: readonly string[];
  readonly nocobase?: Record<string, unknown>;
}

/**
 * An application directory on disk: its `package.json` and the plugin packages installed under `node_modules`, the
 * way the catalog finds them in a real application.
 */
export async function createApplicationFixture(options: {
  readonly dependencies?: readonly string[];
  readonly devDependencies?: readonly string[];
  readonly installed: readonly FixturePlugin[];
  readonly builtAt?: string;
  /** The CLI composition root to write, `cli/plugins.ts` as a source checkout has it or `cli/plugins.js` as a build does. */
  readonly cli?: {
    readonly file: 'plugins.ts' | 'plugins.js';
    readonly plugins: readonly string[];
  };
}): Promise<{
  readonly rootDir: string;
  readonly cleanup: () => Promise<void>;
}> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'foundation-app-'));
  const ranges = (names: readonly string[] = []) =>
    Object.fromEntries(names.map((name) => [name, '*']));
  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({
      name: 'fixture-app',
      ...(options.builtAt ? { nocobase: { builtAt: options.builtAt } } : {}),
      dependencies: ranges(options.dependencies),
      devDependencies: ranges(options.devDependencies),
    }),
  );
  if (options.cli) {
    const locals = options.cli.plugins.map((_, index) => `plugin${index}`);
    await mkdir(path.join(rootDir, 'cli'), { recursive: true });
    await writeFile(
      path.join(rootDir, 'cli', options.cli.file),
      [
        "import { defineCliPlugins } from '@nocobase/app-cli';",
        ...options.cli.plugins.map(
          (name, index) => `import ${locals[index]} from '${name}/cli';`,
        ),
        `export default defineCliPlugins([${locals.join(', ')}]);`,
        '',
      ].join('\n'),
    );
  }
  for (const plugin of options.installed) {
    const directory = path.join(rootDir, 'node_modules', plugin.name);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: plugin.name,
        version: plugin.version ?? '1.0.0',
        exports: Object.fromEntries(
          (plugin.entries ?? ['client', 'server']).map((entry) => [
            `./${entry}`,
            `./${entry}/index.js`,
          ]),
        ),
        peerDependencies: Object.fromEntries(
          [...(plugin.peers ?? []), ...(plugin.optionalPeers ?? [])].map(
            (name) => [name, 'workspace:^'],
          ),
        ),
        peerDependenciesMeta: Object.fromEntries(
          (plugin.optionalPeers ?? []).map((name) => [
            name,
            { optional: true },
          ]),
        ),
        ...(plugin.nocobase ? { nocobase: plugin.nocobase } : {}),
      }),
    );
  }
  return {
    rootDir,
    cleanup: () => rm(rootDir, { recursive: true, force: true }),
  };
}
