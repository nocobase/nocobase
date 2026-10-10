import {
  compareVersions,
  NPM_UPGRADE_FEATURE,
  type HeartbeatResponse,
  type NpmUpgradeNotice,
  type UpgradeNotice,
} from '@nocobase/agent-protocol';

import type { Runner } from '../../shared/runners.js';
import type { DistService } from './dist.service.js';
export {
  createDownloadTokenService,
  DOWNLOAD_TOKEN_MAX_DOWNLOADS,
  DOWNLOAD_TOKEN_TTL_MS,
  type DownloadRequest,
  type DownloadTokenService,
} from './download-tokens.js';

export {
  createDistService,
  DEFAULT_CHANNEL,
  type DistConfig,
  type DistFile,
  type DistNpmSource,
  type DistService,
} from './dist.service.js';

/** The platform a runner reported, as the tarballs name it. */
export function runnerTarget(runner: Pick<Runner, 'os' | 'arch'>): string {
  return `${runner.os}-${runner.arch}`;
}

/** An update for a runner: a tarball the application serves, or a package to install from npm. */
export type RunnerUpgrade = UpgradeNotice | NpmUpgradeNotice;

/**
 * A newer version of the product `runner` runs as (`nocobase-runner`, or a CLI that carries the runner) that the
 * application serves for its platform, if there is one. A runner that reported no product is offered none: it may be
 * carried by a CLI that no longer carries it.
 *
 * The tarball is offered whenever there is one. Only when the application has none of the product, and names it on npm
 * (`agents.dist.npm`), is the package offered, and then only to a runner with the `npm` feature: any other runner is
 * offered nothing, as before.
 */
export async function upgradeFor(
  dist: DistService,
  runner: Pick<Runner, 'os' | 'arch' | 'version' | 'product' | 'features'>,
): Promise<RunnerUpgrade | undefined> {
  if (runner.product === null) return undefined;
  const latest = await dist.find(runner.product, runnerTarget(runner));
  if (latest) {
    if (compareVersions(latest.version, runner.version) <= 0) return undefined;
    return {
      minVersion: '0.0.0',
      latestVersion: latest.version,
      downloadUrl: latest.url,
      sha256: latest.sha256,
      channel: latest.channel,
      reason: `The application serves ${latest.product} ${latest.version} on the ${latest.channel} channel.`,
    };
  }
  if (!runner.features.includes(NPM_UPGRADE_FEATURE)) return undefined;
  const npm = await dist.npmPackage(runner.product);
  if (!npm || compareVersions(npm.version, runner.version) <= 0)
    return undefined;
  return {
    latestVersion: npm.version,
    package: npm.package,
    channel: npm.channel,
    reason: `The application runs ${npm.product} ${npm.version}: install ${npm.package}@${npm.version} from npm.`,
  };
}

/** Where an update goes in a heartbeat answer: a tarball in `upgrade`, an npm package in `npmUpgrade`. */
export function upgradeFields(
  upgrade: RunnerUpgrade | undefined,
): Pick<HeartbeatResponse, 'upgrade' | 'npmUpgrade'> {
  if (upgrade === undefined) return {};
  return 'downloadUrl' in upgrade ? { upgrade } : { npmUpgrade: upgrade };
}
