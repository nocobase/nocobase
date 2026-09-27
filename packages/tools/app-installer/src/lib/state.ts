import { readFile, rename, writeFile } from 'node:fs/promises';
import { EXIT_INVALID, InstallerError } from './errors.ts';
import { installerCommand, shellQuote } from './invocation.ts';
import type { Layout } from './layout.ts';
import { compareVersions } from './version.ts';

export interface BuildTarget {
  platform: string;
  arch: string;
  libc?: string;
  nodeAbi?: number;
  nodeMajor: number;
}

/**
 * Where an installation's releases come from, fixed at install time: a published template built on the server, or a
 * deployment archive built elsewhere. An upgrade takes the same kind of source the install did.
 */
export type ReleaseSource =
  { kind: 'template'; template: string; package: string } | { kind: 'archive' };

export interface ReleaseRecord {
  /** `<version>_<build time>`, also the directory under `releases/`. */
  id: string;
  version: string;
  builtAt: string;
  installedAt: string;
  buildTarget: BuildTarget;
}

export interface HistoryEntry {
  action: 'install' | 'upgrade' | 'rollback';
  /** Release ids. */
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
 * An operation that stopped the application and has not finished. It is written before the application is stopped and
 * cleared once the operation ends either way, so finding one means the installer was interrupted during the downtime.
 */
export interface PendingOperation {
  action: 'upgrade' | 'rollback';
  /** Release ids. */
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
  /** Upgrade: `to` is the running version built again for this machine. */
  rebuild?: boolean;
}

/** `installer.json`: what the installer knows about the application it manages. */
export interface InstallerState {
  schemaVersion: 1;
  /** The application's `package.json` name, which owns its migration history; every release must carry the same. */
  appName: string;
  /** Compiled into the client and mounted by the server; every release must carry the same. */
  basePath: string;
  /** `nocobase.templateKind` of the installed application: `hub` hosts applications of its own, `app` does not. */
  templateKind: string;
  source: ReleaseSource;
  /** pm2 process name. */
  name: string;
  /** Where the installer, and a template, are fetched from. */
  registry: string;
  dialect: string;
  /** Template source: driver packages added before each build, so an upgrade adds them again. */
  drivers: string[];
  /** Id of the running release. */
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
        `${layout.root} holds no application installed by app-installer (installer.json is missing).`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            {
              message:
                'Run the command from the installation root, or name it with --dir.',
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
      `installer.json has schemaVersion ${String(state.schemaVersion)}, which this app-installer does not understand.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: 'Use a newer app-installer:',
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

export function findRelease(
  state: InstallerState,
  id: string,
): ReleaseRecord | undefined {
  return state.releases.find((record) => record.id === id);
}

/**
 * The release a `--to` names: an id exactly, or a version, meaning the newest build of it on record other than the
 * running one. A version is what a person remembers; the id is what `status` prints when two builds of one version are
 * on disk. Rolling back "to 1.0.0" while a rebuild of 1.0.0 runs means the earlier build, not the one already running.
 */
export function resolveReleaseRef(
  state: InstallerState,
  ref: string,
): ReleaseRecord | undefined {
  const exact = findRelease(state, ref);
  if (exact) return exact;
  const builds = [...state.releases]
    .filter((record) => record.version === ref)
    .sort((a, b) => b.builtAt.localeCompare(a.builtAt));
  return builds.find((record) => record.id !== state.current) ?? builds[0];
}

/** Semantic-version order of two releases' versions; builds of one version compare equal. */
export function compareReleaseVersions(
  a: ReleaseRecord,
  b: ReleaseRecord,
): number {
  return compareVersions(a.version, b.version) ?? 0;
}
