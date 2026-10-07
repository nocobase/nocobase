// The command the runner runs as, `nocobase-runner`: how it names itself in messages and starts itself again (a
// service, the background daemon), which version it reports, and which installation and served product it updates
// itself from.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { RUNNER_PRODUCT } from '@nocobase/agent-protocol';

export interface RunnerHost {
  /** The command, `nocobase-runner`. */
  readonly bin: string;
  /**
   * The root of the package, as it runs: `<prefix>/versions/<version>` when an application's install script installed
   * it (`@nocobase/app-cli-client/install`).
   */
  readonly packageRoot: string;
  /** The version the runner reports to applications and compares updates with. */
  readonly version: string;
  /** The product the applications serve it as (`DIST_ROUTES.resolve`), which the runner updates itself to. */
  readonly product: string;
}

// src/host.ts and dist/host.js both sit one level below the package root.
const OWN_ROOT: string = path.resolve(import.meta.dirname, '..');

const OWN_VERSION: string = (
  JSON.parse(readFileSync(path.join(OWN_ROOT, 'package.json'), 'utf8')) as {
    version: string;
  }
).version;

const HOST: RunnerHost = {
  bin: RUNNER_PRODUCT,
  packageRoot: OWN_ROOT,
  version: OWN_VERSION,
  product: RUNNER_PRODUCT,
};

export function runnerHost(): RunnerHost {
  return HOST;
}

/** A runner command as a person types it, such as `nocobase-runner update`. */
export function runnerCommandLine(...words: string[]): string {
  return [HOST.bin, ...words].join(' ');
}
