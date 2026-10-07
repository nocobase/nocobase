import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
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
