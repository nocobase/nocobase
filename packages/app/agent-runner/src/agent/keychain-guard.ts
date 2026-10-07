// Keychain guards: `security` (macOS) and `secret-tool` (Linux) scripts put first on the agent's PATH, beside the
// application CLI's shim, that keep the agent away from the keychain items of the run's CLI (`cliKeychainService`),
// where the person who signed in to that CLI keeps their API key. Everything else passes through to the real tool:
// the coding tools read their own logins from the same keychain (Claude Code on macOS runs
// `security find-generic-password -s "Claude Code-credentials" …`), and refusing that would sign every run out.
//
// A guard refuses:
// - whole-keychain reads and interactive mode (`-i`, `-p`, `dump-keychain`, `export`, `search`);
// - any command that names the CLI's service (`-s <service>`, `-s<service>`, `service <service>`), whether it reads,
//   replaces or deletes the item;
// - single-item reads that name no service at all, which could match the CLI's item.
//
// It stops the casual path only: the agent runs as the runner's user and can still call `/usr/bin/security` by its
// absolute path, as the README's "What is not protected" says.
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { which } from './cli.ts';

/** The tools guarded, by command name. */
export const KEYCHAIN_TOOLS: readonly string[] = ['security', 'secret-tool'];

const BULK = ['-i', '-p*', 'dump-keychain', 'export', 'search'];
const ITEM_READS = [
  'find-generic-password',
  'find-internet-password',
  'lookup',
];
const SERVICE_PATTERN = /^[A-Za-z0-9._@-]+$/u;

/** The guard script for `service`, passing allowed calls to `real`. */
export function keychainGuardScript(
  real: string,
  service: string,
  cliName: string,
): string {
  if (!SERVICE_PATTERN.test(service))
    throw new Error(`The keychain service ${service} cannot be guarded.`);
  const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
  return [
    '#!/bin/sh',
    `# Written by the runner: agent runs may not reach the ${service} keychain items.`,
    'deny() {',
    `  echo ${quote(`agent runs cannot use the ${service} keychain items; ${cliName} already acts as the run`)} >&2`,
    '  exit 1',
    '}',
    'cmd=""; scoped=""; prev=""',
    'for arg in "$@"; do',
    `  case "$arg" in ${service}|-s${service}) deny ;; esac`,
    '  if [ -z "$cmd" ]; then',
    '    case "$arg" in',
    `      ${BULK.join('|')}) deny ;;`,
    '      -*) ;;',
    '      *) cmd="$arg" ;;',
    '    esac',
    '  else',
    '    case "$arg" in -s?*) scoped=1 ;; esac',
    '    case "$prev" in -s|service) scoped=1 ;; esac',
    '  fi',
    '  prev="$arg"',
    'done',
    `case "$cmd" in ${ITEM_READS.join('|')}) [ -n "$scoped" ] || deny ;; esac`,
    `exec ${quote(real)} "$@"`,
    '',
  ].join('\n');
}

/**
 * Writes a guard into `binDir` for each keychain tool found on `searchPath` (outside `binDir`). Returns the tools
 * guarded; a host without the tool gets no guard, since the agent has nothing to call.
 */
export async function writeKeychainGuards(
  binDir: string,
  service: string,
  cliName: string,
  searchPath: string = process.env.PATH ?? '',
): Promise<string[]> {
  const others = searchPath
    .split(path.delimiter)
    .filter((dir) => dir !== '' && path.resolve(dir) !== path.resolve(binDir))
    .join(path.delimiter);
  const guarded: string[] = [];
  for (const tool of KEYCHAIN_TOOLS) {
    const real = which(tool, others);
    if (real === undefined) continue;
    await mkdir(binDir, { recursive: true, mode: 0o700 });
    const file = path.join(binDir, tool);
    await writeFile(file, keychainGuardScript(real, service, cliName), {
      mode: 0o700,
    });
    await chmod(file, 0o700);
    guarded.push(tool);
  }
  return guarded;
}
