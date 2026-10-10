import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { AppCliConfig } from '../src/config.ts';

/** A CLI as an application would brand it. */
export const TEST_CLI: AppCliConfig = {
  bin: 'acme',
  displayName: 'Acme',
  stateDir: '.acme',
  homeEnv: 'ACME_HOME',
  keychainEnv: 'ACME_KEYCHAIN',
  runCredentialsFile: '.acme/run.json',
};

export function tempDir(prefix = 'app-cli-client-'): string {
  // realpath: macOS's /var is a link to /private/var.
  return execFileSync(
    'realpath',
    [mkdtempSync(path.join(os.tmpdir(), prefix))],
    { encoding: 'utf8' },
  ).trim();
}

export function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * A stand-in `npm` at `<dir>/npm` that logs its arguments to `<dir>/npm.log` and, for
 * `install --prefix <prefix> … <package>@<version>`, lays out what npm would: `<prefix>/node_modules/<package>` at that
 * version, whose bin (a Node script printing `<bin> <version> <arguments>`) is linked from `node_modules/.bin/<bin>`.
 * `bins` names the command each package provides. It fails when `<dir>/fail` exists.
 */
export function fakeNpm(dir: string, bins: Record<string, string>): string {
  mkdirSync(dir, { recursive: true });
  const npm = path.join(dir, 'npm');
  writeFileSync(
    npm,
    [
      '#!/bin/sh',
      `echo "$*" >> "${path.join(dir, 'npm.log')}"`,
      `if [ -e "${path.join(dir, 'fail')}" ]; then echo "npm error 404 Not Found" >&2; exit 1; fi`,
      'prefix=""',
      'for arg in "$@"; do',
      '  if [ "$prefix" = next ]; then prefix="$arg"; fi',
      '  if [ "$arg" = --prefix ]; then prefix=next; fi',
      '  spec="$arg"',
      'done',
      'package="${spec%@*}"',
      'version="${spec##*@}"',
      'case "$package" in',
      ...Object.entries(bins).map(([name, bin]) => `  ${name}) bin=${bin} ;;`),
      '  *) echo "npm error 404 $package" >&2; exit 1 ;;',
      'esac',
      'mkdir -p "$prefix/node_modules/$package/bin" "$prefix/node_modules/.bin"',
      'printf \'{ "name": "%s", "version": "%s" }\\n\' "$package" "$version" > "$prefix/node_modules/$package/package.json"',
      'printf \'#!/usr/bin/env node\\nconsole.log(["%s", "%s", ...process.argv.slice(2)].join(" "));\\n\' "$bin" "$version" > "$prefix/node_modules/$package/bin/run.js"',
      'chmod 755 "$prefix/node_modules/$package/bin/run.js"',
      'ln -s "../$package/bin/run.js" "$prefix/node_modules/.bin/$bin"',
      '',
    ].join('\n'),
  );
  chmodSync(npm, 0o755);
  return npm;
}
