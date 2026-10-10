// The Node.js and pnpm a run's agent gets: the runner's own, so an agent does not depend on what the machine has
// installed. The runner's Node is the one it runs on (`process.execPath`), and its pnpm the `pnpm` package it ships
// with. Launchers for both go into the run's bin directory, first on the agent's PATH, beside the application's CLI.
// `config set agent-tools system` leaves the machine's own on PATH instead.
import { createRequire } from 'node:module';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

/** Writes `node` and `pnpm` launchers into `binDir`. Returns the tools written; pnpm only when it is bundled. */
export async function writeRunnerTools(
  binDir: string,
  /** Null when none is bundled. */
  pnpmEntry: string | null = bundledPnpmEntry() ?? null,
  node: string = process.execPath,
): Promise<string[]> {
  await mkdir(binDir, { recursive: true, mode: 0o700 });
  await writeLauncher(binDir, 'node', quote(node));
  if (pnpmEntry === null) return ['node'];
  await writeLauncher(binDir, 'pnpm', `${quote(node)} ${quote(pnpmEntry)}`);
  return ['node', 'pnpm'];
}
