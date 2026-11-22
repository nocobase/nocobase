import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

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
  /**
   * The CLI registrations to write: a source checkout's `cli/plugins.ts`, parsed with the TypeScript this package
   * resolves, or, `deployed`, the `cli/plugins.json` a build writes in its place.
   */
  readonly cli?: {
    readonly deployed?: boolean;
    /** The packages it registers, each imported and listed. */
    readonly plugins?: readonly string[];
    /** The `cli/plugins.ts` text as written, instead of `plugins`. */
    readonly source?: string;
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
    const plugins = options.cli.plugins ?? [];
    const locals = plugins.map((_, index) => `plugin${index}`);
    await mkdir(path.join(rootDir, 'cli'), { recursive: true });
    if (options.cli.deployed) {
      await writeFile(
        path.join(rootDir, 'cli', 'plugins.json'),
        JSON.stringify({ plugins }),
      );
    } else {
      await writeFile(
        path.join(rootDir, 'cli', 'plugins.ts'),
        options.cli.source ??
          [
            "import { defineCliPlugins } from '@nocobase/app-cli';",
            ...plugins.map(
              (name, index) => `import ${locals[index]} from '${name}/cli';`,
            ),
            `export default defineCliPlugins([${locals.join(', ')}]);`,
            '',
          ].join('\n'),
      );
      // A source checkout has the TypeScript it builds with; link this package's own.
      await mkdir(path.join(rootDir, 'node_modules'), { recursive: true });
      await symlink(
        path.dirname(require.resolve('typescript/package.json')),
        path.join(rootDir, 'node_modules', 'typescript'),
        'dir',
      );
    }
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
