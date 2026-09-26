import { readFile, rename, writeFile } from 'node:fs/promises';
import { EXIT_INVALID, InstallerError } from './errors.ts';
import { installerCommand, shellQuote } from './invocation.ts';
import type { Layout } from './layout.ts';

export interface BuildTarget {
  platform: string;
  arch: string;
  libc?: string;
  nodeAbi?: number;
  nodeMajor: number;
}

export interface ReleaseRecord {
  version: string;
  installedAt: string;
  buildTarget: BuildTarget;
}

export interface HistoryEntry {
  action: 'install' | 'upgrade' | 'rollback';
  from?: string;
  to: string;
  at: string;
  /** `rolled-back` for an upgrade that failed after the switch and was undone. */
  outcome?: 'completed' | 'rolled-back';
  /** Migration and seed tasks the upgrade applied; a rollback restores the database only when this is above zero. */
  migrations?: number;
  /** Backup directory, relative to the root, taken before the upgrade migrated anything. */
  backup?: string;
  databaseRestored?: boolean;
  /** An upgrade that built the running version again, for this machine, rather than moving to another version. */
  rebuild?: boolean;
}

/**
 * An operation that stopped the Hub and has not finished. It is written before the Hub is stopped and cleared once the
 * operation ends either way, so finding one means the installer was interrupted during the downtime.
 */
export interface PendingOperation {
  action: 'upgrade' | 'rollback';
  from: string;
  to: string;
  startedAt: string;
  /** Upgrade: the backup, recorded only once it is complete. */
  backup?: string;
  /**
   * Upgrade: set just before `current` moves to the new release. From then on the new release may have migrated the
   * database, so undoing the upgrade has to restore it; before, nothing but the stop has happened.
   */
  switched?: boolean;
  /** Rollback: the backup it restores, so an interrupted rollback restores it again when it is finished. */
  restoreFrom?: string;
  /** Upgrade: `from` and `to` are the same version, built again for this machine. */
  rebuild?: boolean;
}

/** `installer.json`: what the installer knows about the Hub it manages. */
export interface InstallerState {
  schemaVersion: 1;
  /** pm2 process name. */
  name: string;
  registry: string;
  dialect: string;
  /** Driver packages added before each build, so an upgrade adds them again. */
  drivers: string[];
  current: string;
  releases: ReleaseRecord[];
  history: HistoryEntry[];
  pending?: PendingOperation;
}

export async function readState(layout: Layout): Promise<InstallerState> {
  let text: string;
  try {
    text = await readFile(layout.stateFile, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new InstallerError(
        'NOT_INSTALLED',
        `${layout.root} holds no Hub installed by hub-installer (installer.json is missing).`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            {
              message:
                'Run the command from the Hub root, or name it with --dir.',
            },
          ],
        },
      );
    }
    throw error;
  }
  const state = JSON.parse(text) as InstallerState;
  if (state.schemaVersion !== 1) {
    throw new InstallerError(
      'STATE_UNSUPPORTED',
      `installer.json has schemaVersion ${String(state.schemaVersion)}, which this hub-installer does not understand.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: 'Use a newer hub-installer:',
            run: installerCommand(`status --dir ${shellQuote(layout.root)}`, {
              version: 'latest',
              ...(typeof state.registry === 'string'
                ? { registry: state.registry }
                : {}),
            }),
          },
        ],
      },
    );
  }
  return state;
}

/** Writes the state through a temporary file and a rename, so a crash never leaves half a document behind. */
export async function writeState(
  layout: Layout,
  state: InstallerState,
): Promise<void> {
  const temporary = `${layout.stateFile}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(temporary, layout.stateFile);
}
