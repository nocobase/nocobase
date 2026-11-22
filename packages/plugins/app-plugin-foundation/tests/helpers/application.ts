import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface FixturePlugin {
  readonly name: string;
  readonly version?: string;
  readonly entries?: readonly ('client' | 'server' | 'cli')[];
  readonly peers?: readonly string[];
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
          (plugin.peers ?? []).map((name) => [name, 'workspace:^']),
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
