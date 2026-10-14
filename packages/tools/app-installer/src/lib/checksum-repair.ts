import { createHash } from 'node:crypto';
import { runAppCli, type AppCliOptions } from './app-cli.ts';
import { EXIT_INVALID, InstallerError } from './errors.ts';

export interface ChecksumRepair {
  connection: string;
  kind: 'migrations' | 'seeds';
  packageName: string;
  name: string;
  recordedChecksum: string;
  sourceChecksum: string;
}

export interface ChecksumRepairPlan {
  token: string;
  changes: ChecksumRepair[];
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/** Reject an unsupported or incomplete CLI response instead of treating it as an empty repair plan. */
export function checksumRepairs(result: unknown): ChecksumRepair[] {
  const invalid = (): never => {
    throw new InstallerError(
      'CHECKSUM_CHECK_INVALID',
      'The target application must support db repair --dry-run --json with complete checksum results. No upgrade was applied.',
      { exitCode: EXIT_INVALID },
    );
  };
  if (
    !object(result) ||
    result.dryRun !== true ||
    !Array.isArray(result.results)
  )
    return invalid();
  const changes: ChecksumRepair[] = [];
  for (const entry of result.results) {
    if (
      !object(entry) ||
      !nonempty(entry.connection) ||
      (entry.kind !== 'migrations' && entry.kind !== 'seeds')
    )
      return invalid();
    if (entry.status === 'skipped') continue;
    if (entry.status !== 'completed' || !Array.isArray(entry.repaired))
      return invalid();
    for (const record of entry.repaired) {
      if (
        !object(record) ||
        !nonempty(record.packageName) ||
        !nonempty(record.name) ||
        !nonempty(record.recordedChecksum) ||
        !nonempty(record.sourceChecksum)
      )
        return invalid();
      changes.push({
        connection: entry.connection,
        kind: entry.kind,
        packageName: record.packageName,
        name: record.name,
        recordedChecksum: record.recordedChecksum,
        sourceChecksum: record.sourceChecksum,
      });
    }
  }
  return changes.sort((a, b) => {
    const left = JSON.stringify(a);
    const right = JSON.stringify(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export async function previewChecksumRepair(
  cli: AppCliOptions,
  identity: { appName: string; from: string; version: string },
): Promise<ChecksumRepairPlan> {
  const envelope = await runAppCli(['db', 'repair', '--dry-run'], cli);
  const changes = checksumRepairs(envelope.result);
  // Build timestamps can change when an npm application is rebuilt for the confirmation run.
  // Bind approval to the installation, current release, target version and exact checksum changes instead.
  const token = createHash('sha256')
    .update(JSON.stringify({ directory: cli.cwd, ...identity, changes }))
    .digest('hex');
  return { token, changes };
}

export function requireChecksumApproval(
  plan: ChecksumRepairPlan,
  approved?: string,
): void {
  if (!plan.changes.length && approved === undefined) return;
  if (approved === plan.token) return;
  throw new InstallerError(
    'CHECKSUM_REPAIR_REQUIRED',
    'Review every migration and seed checksum change before authorizing repair. --yes alone does not authorize checksum repair.',
    {
      exitCode: EXIT_INVALID,
      details: { checksumRepair: plan },
      suggestions: [
        ...plan.changes.map((change) => ({
          message: `${change.connection}/${change.kind}: ${change.packageName}:${change.name} ${change.recordedChecksum} -> ${change.sourceChecksum}`,
        })),
        {
          message: `After reviewing this plan, repeat the same upgrade with --repair-checksums ${plan.token}. The installer backs up before repairing.`,
        },
      ],
    },
  );
}
