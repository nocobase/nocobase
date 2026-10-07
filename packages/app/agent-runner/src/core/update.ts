// Updating the runner itself from the application that serves it (`DIST_ROUTES` of @nocobase/agent-protocol), with the
// installation layout of `@nocobase/app-cli-client/install`: the runner updates the package of the command it runs
// under, the product the host names (`host.ts`).
//
// Only an installation (lib/install.ts) updates: the new version's standalone tarball is downloaded with the runner's
// key, checked against its SHA-256, unpacked beside the running one, and `current` is switched to it; the previous
// version stays until the next update, so a bad one can be switched back by hand. The process then has to restart:
// the daemon does that between runs when a service supervises it (it exits, and launchd or systemd starts the new
// `current`); the `update` command restarts the service or the background daemon itself.
import {
  applyUpdate as applyAt,
  latestArtifact,
  type AppliedUpdate,
  type ArtifactDownloader,
  type ArtifactReader,
  type Installation,
  type UpdateTarget,
} from '@nocobase/app-cli-client/install';

import { runnerHost } from '../host.ts';
import { currentTarget, type DistArtifact } from '../protocol/index.ts';

export { isNewer, type UpdateTarget } from '@nocobase/app-cli-client/install';

/** The runner the application serves for this machine. */
export async function latestRunner(
  client: ArtifactReader,
  target: string = currentTarget(),
): Promise<DistArtifact> {
  return latestArtifact(client, runnerHost().product, target);
}

export interface ApplyUpdateOptions {
  installation: Pick<Installation, 'prefix' | 'current'>;
  client: ArtifactDownloader;
  update: UpdateTarget;
  log?: (message: string) => void;
}

/** Installs `update` beside the running version and makes it current. Returns the version it replaced. */
export async function applyUpdate(
  options: ApplyUpdateOptions,
): Promise<AppliedUpdate> {
  return applyAt({ ...options, bin: runnerHost().bin });
}
