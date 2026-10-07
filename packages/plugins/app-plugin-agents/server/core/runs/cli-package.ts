/**
 * Where a run's CLI comes from, as the application configures it: a fixed package (`npm`, `tarball`,
 * `preinstalled`), or `served`, the CLI tarball the application serves for the runner's platform (the runners
 * plugin's distribution). A runner that cannot install a served tarball (no `archives` feature), or a platform with
 * none built, gets `fallback`: `preinstalled` unless configured, the CLI the install script put on the runner's host
 * beside the runner.
 */
import type { CliPackage } from '@nocobase/agent-protocol';
import type { DistService } from '../../distribution/index.js';
import type { Runner } from '../../../shared/runners.js';

export type AgentCliSource =
  CliPackage | { readonly kind: 'served'; readonly fallback?: CliPackage };

/** The platform a runner reported, as the tarballs name it. */
function targetOf(runner: Pick<Runner, 'os' | 'arch'>): string {
  return `${runner.os}-${runner.arch}`;
}

export async function cliPackageFor(
  name: string,
  source: AgentCliSource,
  dist: Pick<DistService, 'find'> | undefined,
  runner: Pick<Runner, 'os' | 'arch' | 'features'>,
): Promise<CliPackage> {
  if (source.kind !== 'served') return source;
  const artifact = dist ? await dist.find(name, targetOf(runner)) : null;
  if (artifact && runner.features.includes('archives'))
    return {
      kind: 'archive',
      version: artifact.version,
      url: artifact.url,
      sha256: artifact.sha256,
    };
  return source.fallback ?? { kind: 'preinstalled' };
}
