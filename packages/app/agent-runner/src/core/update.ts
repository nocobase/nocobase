// Updating the runner itself from the application that serves it (`DIST_ROUTES` of @nocobase/agent-protocol), with the
// installation layout of `@nocobase/app-cli-client/install`: the runner updates the package of the command it runs
// under, the product the host names (`host.ts`).
//
// Only an installation (lib/install.ts) updates: the new version's standalone tarball is downloaded with the runner's
// key, checked against its SHA-256 and unpacked beside the running one, or, when the application serves no tarball and
// names the runner's npm package instead (`accept=npm` on the resolve route, `npmUpgrade` in heartbeat answers to a
// runner with the `npm` feature), that exact version is installed with npm beside it; then `current` is switched to it;
// the previous
// version stays until the next update, so a bad one can be switched back by hand. The process then has to restart:
// the daemon does that between runs when a service supervises it (it exits with `RESTART_EXIT_CODE`, and launchd or
// systemd starts the new `current`); the `update` command restarts the service or the background daemon itself.
import {
  applyUpdate as applyAt,
  latestResolution,
  type AppliedUpdate,
  type ArtifactDownloader,
  type ArtifactReader,
  type Installation,
  type UpdateTarget,
} from '@nocobase/app-cli-client/install';

import { runnerHost } from '../host.ts';
import { currentTarget, type DistResolution } from '../protocol/index.ts';

export {
  isNewer,
  updateTargetOf,
  type UpdateTarget,
} from '@nocobase/app-cli-client/install';

/**
 * How the daemon's process exits once it stopped after updating itself: not 0, so a service that restarts only what
 * failed starts the new version too.
 */
export const RESTART_EXIT_CODE = 75;

/** The runner the application serves for this machine: a tarball, or the npm package it names when it serves none. */
export async function latestRunner(
  client: ArtifactReader,
  target: string = currentTarget(),
): Promise<DistResolution> {
  return latestResolution(client, runnerHost().product, target);
}

export interface ApplyUpdateOptions {
  installation: Pick<Installation, 'prefix' | 'current'>;
  client: ArtifactDownloader;
  update: UpdateTarget;
  /** The npm an npm update runs; found on PATH or beside the Node by default. */
  npm?: string;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

/** Installs `update` beside the running version and makes it current. Returns the version it replaced. */
export async function applyUpdate(
  options: ApplyUpdateOptions,
): Promise<AppliedUpdate> {
  return applyAt({ ...options, bin: runnerHost().bin });
}
