// The Node.js and pnpm a run's agent gets: the runner's own, so an agent does not depend on what the machine has
// installed. The runner's Node is the one it runs on (`process.execPath`), and its pnpm the `pnpm` package it ships
// with. Launchers for both go into the run's bin directory, first on the agent's PATH, beside the application's CLI.
// `config set agent-tools system` leaves the machine's own on PATH instead.
//
// Either way `pnpm`, `npm` and `npx` (the machine's, found on PATH) get a wrapper in that directory: a call that reaches
// a registry (`REGISTRY_COMMANDS`, and every `npx`) goes through the npm launcher (npm-launcher.ts), which keeps the
// machine's configuration from sending `@nocobase/*` to NocoBase's private registry and uses that registry with the
// run's token only when the install needs it; every other call execs the real command at once.
import { createRequire } from 'node:module';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { which } from './cli.ts';
import { REGISTRY_COMMANDS } from './npm-registry.ts';

/** Which Node.js and pnpm an agent gets: the runner's own, or whatever the machine has on PATH. */
export type AgentTools = 'runner' | 'system';

/**
 * Keeps the runner's pnpm the one that runs: a repository's `packageManager` makes neither pnpm 11 (`pm-on-fail`) nor
 * pnpm 9 and 10 (`manage-package-manager-versions`) download another version.
 */
export const PINNED_PNPM_ENV: Readonly<Record<string, string>> = {
  pnpm_config_pm_on_fail: 'ignore',
  pnpm_config_manage_package_manager_versions: 'false',
  npm_config_manage_package_manager_versions: 'false',
};

/** The bundled pnpm's JavaScript entry; undefined when it is not installed beside the runner. */
export function bundledPnpmEntry(): string | undefined {
  try {
    const require = createRequire(import.meta.url);
    // pnpm exports nothing but its manifest, as `pnpm`.
    const manifest = require.resolve('pnpm');
    if (path.basename(manifest) !== 'package.json') return undefined;
    const { bin } = require(manifest) as {
      bin?: string | Record<string, string>;
    };
    const entry = typeof bin === 'string' ? bin : bin?.pnpm;
    return entry === undefined
      ? undefined
      : path.join(path.dirname(manifest), entry);
  } catch {
    return undefined;
  }
}

const quote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

async function writeLauncher(
  binDir: string,
  name: string,
  command: string,
): Promise<string> {
  const file = path.join(binDir, name);
  await writeFile(file, `#!/bin/sh\nexec ${command} "$@"\n`, { mode: 0o700 });
  await chmod(file, 0o700);
  return file;
}

/** How the npm launcher is started: this runner's Node with the resolve hooks the worker runs with. */
export function npmLauncherEntry(): string[] {
  const extension = import.meta.filename.endsWith('.ts') ? 'ts' : 'js';
  return [
    '--import',
    path.resolve(import.meta.dirname, '../../bin/source-hooks.js'),
    path.join(import.meta.dirname, `npm-launcher.${extension}`),
  ];
}

/**
 * A wrapper that hands a call reaching a registry to the npm launcher and execs `real` for any other; `always` hands
 * every call (`npx`).
 */
export function packageManagerScript(
  tool: 'pnpm' | 'npm',
  real: readonly string[],
  options: {
    readonly always?: boolean;
    readonly node?: string;
    readonly launcher?: readonly string[];
  } = {},
): string {
  const node = options.node ?? process.execPath;
  const launcher = [node, ...(options.launcher ?? npmLauncherEntry())]
    .map(quote)
    .join(' ');
  const command = real.map(quote).join(' ');
  const handOver = `exec ${launcher} ${tool} ${command} -- "$@"`;
  if (options.always === true)
    return `#!/bin/sh
${handOver}
`;
  return [
    '#!/bin/sh',
    'for arg do',
    '  case "$arg" in',
    `    ${REGISTRY_COMMANDS[tool].join('|')}) ${handOver} ;;`,
    '  esac',
    'done',
    `exec ${command} "$@"`,
    '',
  ].join('\n');
}

async function writeScript(
  binDir: string,
  name: string,
  script: string,
): Promise<void> {
  const file = path.join(binDir, name);
  await writeFile(file, script, { mode: 0o700 });
  await chmod(file, 0o700);
}

export interface PackageManagerOptions {
  /** The real pnpm, or null for the machine's on `searchPath`. */
  readonly pnpm?: readonly string[] | null;
  /** Where the machine's tools are looked for; `binDir` itself is skipped. */
  readonly searchPath?: string;
  readonly node?: string;
  readonly launcher?: readonly string[];
}

/** Writes the `pnpm`, `npm` and `npx` wrappers into `binDir` for those that exist. Returns the tools wrapped. */
export async function writePackageManagers(
  binDir: string,
  options: PackageManagerOptions = {},
): Promise<string[]> {
  await mkdir(binDir, { recursive: true, mode: 0o700 });
  const others = (options.searchPath ?? process.env.PATH ?? '')
    .split(path.delimiter)
    .filter((dir) => dir !== '' && path.resolve(dir) !== path.resolve(binDir))
    .join(path.delimiter);
  const found = (name: string): string[] | null => {
    const real = which(name, others);
    return real === undefined ? null : [real];
  };
  const script = {
    ...(options.node === undefined ? {} : { node: options.node }),
    ...(options.launcher === undefined ? {} : { launcher: options.launcher }),
  };
  const written: string[] = [];
  const tools: [string, 'pnpm' | 'npm', string[] | null, boolean][] = [
    ['pnpm', 'pnpm', options.pnpm ? [...options.pnpm] : found('pnpm'), false],
    ['npm', 'npm', found('npm'), false],
    ['npx', 'npm', found('npx'), true],
  ];
  for (const [name, tool, real, always] of tools) {
    if (real === null) continue;
    await writeScript(
      binDir,
      name,
      packageManagerScript(tool, real, { ...script, always }),
    );
    written.push(name);
  }
  return written;
}

/**
 * Writes `node` and `pnpm` launchers into `binDir`, with the `npm` and `npx` wrappers. Returns the runner's tools
 * written; pnpm only when it is bundled.
 */
export async function writeRunnerTools(
  binDir: string,
  /** Null when none is bundled. */
  pnpmEntry: string | null = bundledPnpmEntry() ?? null,
  node: string = process.execPath,
  searchPath?: string,
): Promise<string[]> {
  await mkdir(binDir, { recursive: true, mode: 0o700 });
  await writeLauncher(binDir, 'node', quote(node));
  if (pnpmEntry === null) {
    await writePackageManagers(binDir, {
      node,
      ...(searchPath === undefined ? {} : { searchPath }),
    });
    return ['node'];
  }
  await writePackageManagers(binDir, {
    node,
    pnpm: [node, pnpmEntry],
    ...(searchPath === undefined ? {} : { searchPath }),
  });
  return ['node', 'pnpm'];
}
