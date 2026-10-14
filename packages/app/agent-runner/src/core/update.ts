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

import { runnerCommandLine, runnerHost } from '../host.ts';
import {
  currentTarget,
  PROTOCOL_VERSION,
  type DistResolution,
} from '../protocol/index.ts';

import { isNewer } from '@nocobase/app-cli-client/install';

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

/**
 * Whether the runner is behind the application, and how: `update` when the application offers a newer version, which
 * the normal update flow installs; `protocol` when it offers none but speaks a newer protocol than this runner (its
 * heartbeat answer's `protocolVersion`), so runs that need what this runner lacks are never handed to it although the
 * versions look the same; `none` otherwise.
 */
export function updateDecision(options: {
  readonly running: string;
  /** The version the application offers, if any. */
  readonly offered?: string | undefined;
  /** The protocol the application speaks, when it says. */
  readonly serverProtocol?: number | undefined;
  readonly runnerProtocol?: number;
}): 'update' | 'protocol' | 'none' {
  if (
    options.offered !== undefined &&
    isNewer(options.offered, options.running)
  )
    return 'update';
  const runnerProtocol = options.runnerProtocol ?? PROTOCOL_VERSION;
  return options.serverProtocol !== undefined &&
    options.serverProtocol > runnerProtocol
    ? 'protocol'
    : 'none';
}

/** What to tell the runner's owner when the application speaks a newer protocol but offers no newer runner. */
export function protocolBehindMessage(
  serverProtocol: number,
  runnerProtocol: number = PROTOCOL_VERSION,
): string {
  return (
    `the application speaks runner protocol ${serverProtocol} and this runner (${runnerHost().bin} ` +
    `${runnerHost().version}) speaks ${runnerProtocol}, so runs that need the newer protocol are not handed to it, ` +
    'and the application offers no newer version to update to. Run ' +
    `\`${runnerCommandLine('update')}\` to install what the application serves; when the application runs from ` +
    'source with the same version, run the runner from that source checkout instead.'
  );
}
