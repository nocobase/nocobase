import { readFile, rename, writeFile } from 'node:fs/promises';
import { EXIT_INVALID, InstallerError } from './errors.ts';
import { installerCommandLine } from './invocation.ts';
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
 * Where an installation's releases come from: a deployment archive built elsewhere. Earlier installers also built a
 * published template on the server and recorded `{ kind: 'template' }`, which this installer refuses to manage.
 */
export interface ReleaseSource {
  kind: 'archive';
}

export interface ReleaseRecord {
  /** `<version>_<build time>`, also the directory under `releases/`. */
  id: string;
  version: string;
  builtAt: string;
  installedAt: string;
  buildTarget: BuildTarget;
  /** The release can be mounted at any path. */
  relocatable?: true;
  /**
   * The one path a release that is not relocatable was built for. A record written by an earlier installer has
   * neither field, and is fixed to `InstallerState.basePath`, since that installer refused any other path.
   */
  basePath?: string;
}

/** Where a release has to be mounted, or `undefined` when it can be mounted anywhere. */
export function fixedMountPathOf(
  record: ReleaseRecord,
  state: Pick<InstallerState, 'basePath'>,
): string | undefined {
  return record.relocatable ? undefined : (record.basePath ?? state.basePath);
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
}

/** `installer.json`: what the installer knows about the application it manages. */
export interface InstallerState {
  schemaVersion: 1;
  /** The application's `package.json` name, which owns its migration history; every release must carry the same. */
  appName: string;
  /**
   * The mount path the installation had when it was installed. `APP_BASE_PATH` in `app.env` is what the application
   * uses now; a release that is not relocatable only runs while the two agree.
   */
  basePath: string;
  source: ReleaseSource;
  /** pm2 process name. */
  name: string;
  /** Where the installer is fetched from. */
  registry: string;
  dialect: string;
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
            run: installerCommandLine(['status', '--dir', layout.root], {
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
  // `{ kind: 'template' }` was the published Hub template built on the server, which this installer no longer offers.
  if ((state.source as { kind: string }).kind !== 'archive') {
    throw new InstallerError(
      'STATE_UNSUPPORTED',
      `${layout.root} was installed from a published template, which this app-installer no longer builds; it manages installations from deployment archives only.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'Keep managing it with the app-installer version that installed it, or install the application again from a deployment archive built by `pnpm build --tar`.',
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
 * on disk. Rolling back "to 1.0.0" while a later build of 1.0.0 runs means the earlier build, not the one already running.
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
