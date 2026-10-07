import { compareVersions, type UpgradeNotice } from '@nocobase/agent-protocol';

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
  type DistService,
} from './dist.service.js';

/** The platform a runner reported, as the tarballs name it. */
export function runnerTarget(runner: Pick<Runner, 'os' | 'arch'>): string {
  return `${runner.os}-${runner.arch}`;
}

/**
 * A newer version of the product `runner` runs as (`nocobase-runner`, or a CLI that carries the runner) that the
 * application serves for its platform, if there is one. A runner that reported no product is offered none: it may be
 * carried by a CLI that no longer carries it.
 */
export async function upgradeFor(
  dist: DistService,
  runner: Pick<Runner, 'os' | 'arch' | 'version' | 'product'>,
): Promise<UpgradeNotice | undefined> {
  if (runner.product === null) return undefined;
  const latest = await dist.find(runner.product, runnerTarget(runner));
  if (!latest || compareVersions(latest.version, runner.version) <= 0)
    return undefined;
  return {
    minVersion: '0.0.0',
    latestVersion: latest.version,
    downloadUrl: latest.url,
    sha256: latest.sha256,
    channel: latest.channel,
    reason: `The application serves ${latest.product} ${latest.version} on the ${latest.channel} channel.`,
  };
}
