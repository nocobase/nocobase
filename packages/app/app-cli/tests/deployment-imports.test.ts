// A deployment installs this package without its optional peers, so nothing it loads may import one at module top
// level. The failure this guards against is invisible here — the monorepo installs every peer — and shows up only as
// `Cannot find package 'typescript'` when a deployed application runs its first command.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };
import {
  builtinCommandFiles,
  isBuiltinAvailable,
} from '../src/runtime/builtin.ts';

const packageRoot = path.resolve(import.meta.dirname, '..');

const optionalPeers = Object.entries(packageMetadata.peerDependenciesMeta ?? {})
  .filter(([, meta]) => meta.optional)
  .map(([name]) => name);

/** Specifiers imported for their value at module top level; `import type` and `import()` are left out. */
function staticImports(source: string): string[] {
  const found: string[] = [];
  const pattern =
    /^\s*(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;
  for (const match of source.matchAll(pattern)) {
    if (match[1]) found.push(match[1]);
  }
  return found;
}

function packageNameOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

/** Every external package reached from `entries` through static imports of this package's own files. */
function externalImports(entries: readonly string[]): Map<string, string> {
  const reached = new Map<string, string>();
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of staticImports(readFileSync(file, 'utf8'))) {
      if (specifier.startsWith('node:')) continue;
      if (specifier.startsWith('.')) {
        const target = path.resolve(path.dirname(file), specifier);
        if (existsSync(target)) queue.push(target);
        continue;
      }
      const name = packageNameOf(specifier);
      if (!reached.has(name)) {
        reached.set(name, path.relative(packageRoot, file));
      }
    }
  }
  return reached;
}

describe('what a deployment loads', () => {
  it('declares the development tooling as optional peers', () => {
    expect(optionalPeers.sort()).toEqual([
      '@nocobase/dev-config',
      '@refinedev/cli',
      'prettier',
      'tar',
      'tsc-alias',
      'tsx',
      'typescript',
      'vite',
    ]);
  });

  it('imports no optional peer statically from the runtime or any deployment command', async () => {
    const selection = { kind: 'deployment' } as const;
    const commands = Object.values(await builtinCommandFiles(selection));
    const entries = [
      path.join(packageRoot, 'bin/run.js'),
      path.join(packageRoot, 'src/runtime/run.ts'),
      path.join(packageRoot, 'src/runtime/registry.ts'),
      path.join(packageRoot, 'src/help/runtime-help.ts'),
      path.join(packageRoot, 'src/index.ts'),
      ...commands,
    ];

    const reached = externalImports(entries);
    const offenders = optionalPeers
      .filter((name) => reached.has(name))
      .map((name) => `${name} (from ${reached.get(name)})`);

    expect(commands.length).toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });

  it('keeps the authoring entry free of the server runtime', () => {
    // A plugin's cli/index.ts imports this entry whenever the command tree is assembled, --help included. The
    // application's server is loaded only when a command asks for it, through withApp().
    const reached = externalImports([path.join(packageRoot, 'src/index.ts')]);
    expect(reached.has('@nocobase/app-server')).toBe(false);
    expect(reached.has('@nocobase/db')).toBe(false);
  });

  it('registers no development command in a deployment', () => {
    for (const id of ['dev', 'build', 'start', 'plugin:register']) {
      expect(isBuiltinAvailable(id, { kind: 'deployment' })).toBe(false);
    }
  });
});
