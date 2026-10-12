import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { extract } from 'tar';
import { EXIT_INVALID, InstallerError, isInstallerError } from './errors.ts';
import {
  RELEASE_APP_DIR,
  releaseDir,
  releaseId,
  stagingDir,
  type Layout,
} from './layout.ts';
import { currentNodeMajor, rebuildCommandLine } from './prechecks.ts';
import { CommandFailedError, tail } from './run-command.ts';
import type { BuildTarget } from './state.ts';

/** Every official database dialect; each has its driver in `@nocobase/db-<dialect>`. */
export const DIALECTS = [
  'sqlite',
  'postgres',
  'mysql',
  'mssql',
  'oracle',
  'dameng',
  'kingbase',
  'oceanbase',
] as const;

export type Dialect = (typeof DIALECTS)[number];

export function verifyBuildTarget(
  target: BuildTarget | undefined,
  expected: { platform: string; arch: string; nodeMajor: number } = {
    platform: process.platform,
    arch: process.arch,
    nodeMajor: currentNodeMajor(),
  },
): BuildTarget {
  if (
    !target ||
    target.platform !== expected.platform ||
    target.arch !== expected.arch ||
    target.nodeMajor !== expected.nodeMajor
  ) {
    throw new InstallerError(
      'BUILD_TARGET_MISMATCH',
      `The build targets ${target ? `${target.platform}-${target.arch} on Node ${target.nodeMajor}` : 'an unknown platform'}, but this machine is ${expected.platform}-${expected.arch} on Node ${expected.nodeMajor}.`,
    );
  }
  return target;
}

/** What a release's `dist/package.json` says about it. */
export interface ReleaseManifest {
  name?: string;
  version?: string;
  nocobase?: {
    buildTarget?: BuildTarget;
    /** Written by current builds: the client is not tied to a mount path. */
    relocatable?: boolean;
    /** Written by earlier builds instead: the one mount path their client was compiled for. */
    basePath?: string;
    builtAt?: string;
  };
}

export async function readReleaseManifest(
  dir: string,
): Promise<ReleaseManifest> {
  return JSON.parse(
    await readFile(path.join(dir, 'dist/package.json'), 'utf8'),
  ) as ReleaseManifest;
}

/** A release on disk, named and checked. */
export interface PreparedRelease {
  id: string;
  dir: string;
  appName: string;
  version: string;
  builtAt: string;
  /** The client can be mounted at any path; the installation chooses one. */
  relocatable: boolean;
  /** The one mount path an earlier, non-relocatable build was compiled for; absent from a relocatable one. */
  basePath?: string;
  buildTarget: BuildTarget;
  /** The release was already on disk under this id, so nothing was unpacked. */
  reused: boolean;
}

export interface UnpackOptions {
  layout: Layout;
  archive: string;
}

function stepFailure(
  code: string,
  step: string,
  error: unknown,
): InstallerError {
  // An interrupt, or a failure that already says what went wrong, passes through as it is.
  if (isInstallerError(error)) return error;
  const output =
    error instanceof CommandFailedError
      ? tail(`${error.stdout}\n${error.stderr}`)
      : undefined;
  return new InstallerError(
    code,
    `${step} failed${error instanceof Error ? `: ${error.message}` : '.'}`,
    { cause: error, ...(output ? { details: { output } } : {}) },
  );
}

/**
 * Unpacks a deployment archive into a staging directory, reads which release it is from its manifest, checks that it
 * was built for this machine, and moves it to `releases/<id>/app`. A release already on disk under the same id is the
 * same build, so the staged copy is dropped and the existing one is used. Nothing here touches the running application,
 * and on failure the staging directory is removed.
 */
export async function unpackRelease(
  options: UnpackOptions,
): Promise<PreparedRelease> {
  const staging = stagingDir(options.layout);
  const stagedApp = path.join(staging, RELEASE_APP_DIR);
  await rm(staging, { recursive: true, force: true });
  try {
    await mkdir(stagedApp, { recursive: true });
    try {
      // The library `pnpm build --tar` packs with, so a deployment needs no `tar` of its own. Synchronous for the same
      // reason the packing is: on a tree this size the promise form can leave the event loop with nothing pending.
      extract({
        file: options.archive,
        cwd: stagedApp,
        strict: true,
        sync: true,
      });
    } catch (error) {
      throw stepFailure(
        'UNPACK_FAILED',
        'Unpacking the deployment archive',
        error,
      );
    }
    let manifest: ReleaseManifest;
    try {
      manifest = await readReleaseManifest(stagedApp);
    } catch (error) {
      throw new InstallerError(
        'ARCHIVE_INVALID',
        `${options.archive} holds no dist/package.json; it is not a deployment archive from \`pnpm build --tar\`.`,
        { exitCode: EXIT_INVALID, cause: error },
      );
    }
    let buildTarget: BuildTarget;
    try {
      buildTarget = verifyBuildTarget(manifest.nocobase?.buildTarget);
    } catch (error) {
      if (!isInstallerError(error)) throw error;
      throw new InstallerError(error.code, error.message, {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'Build the archive for this machine in the application project, then run this again:',
            run: rebuildCommandLine(),
          },
        ],
      });
    }
    const version = manifest.version ?? '0.0.0';
    const builtAt = manifest.nocobase?.builtAt;
    const relocatable = manifest.nocobase?.relocatable === true;
    const basePath = relocatable ? undefined : manifest.nocobase?.basePath;
    if (!builtAt || (!relocatable && !basePath) || !manifest.name) {
      throw new InstallerError(
        'ARCHIVE_TOO_OLD',
        `${options.archive} does not record where its client can be mounted and when it was built; it comes from a \`pnpm build\` older than app-installer needs.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            {
              message:
                'Upgrade @nocobase/app-cli in the application project, build the archive again, then run this again:',
              run: rebuildCommandLine(),
            },
          ],
        },
      );
    }
    const id = releaseId(version, builtAt);
    const dir = releaseDir(options.layout, id);
    const reused = existsSync(dir);
    if (!reused) {
      await mkdir(options.layout.releasesDir, { recursive: true });
      await rename(staging, path.dirname(dir));
    }
    return {
      id,
      dir,
      appName: manifest.name,
      version,
      builtAt,
      relocatable,
      ...(basePath === undefined ? {} : { basePath }),
      buildTarget,
      reused,
    };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

/**
 * A deployment archive carries its database drivers in `dist/node_modules`, installed when it was built; nothing adds
 * one afterwards. A dialect whose driver is absent would fail only when the application first connects.
 */
export function checkArchiveDriver(dir: string, dialect: string): void {
  if (dialect === 'sqlite') return;
  const driver = `@nocobase/db-${dialect}`;
  if (existsSync(path.join(dir, 'dist/node_modules', driver, 'package.json'))) {
    return;
  }
  throw new InstallerError(
    'DRIVER_MISSING',
    `The archive holds no ${driver}, which the ${dialect} dialect needs; a deployment archive carries the drivers it was built with.`,
    {
      exitCode: EXIT_INVALID,
      suggestions: [
        {
          message: 'Add the driver in the application project:',
          run: { command: 'pnpm', args: ['add', driver] },
        },
        {
          message: 'Then build the archive again:',
          run: rebuildCommandLine(),
        },
      ],
    },
  );
}

/**
 * A release older than `APP_STORAGE_DIR` ignores it and keeps its data in `storage/` beside `dist/`, inside the release
 * directory, where the next upgrade would leave it behind. Its first database write shows it.
 */
export function assertStorageOutsideRelease(dir: string): void {
  if (!existsSync(path.join(dir, 'storage'))) return;
  throw new InstallerError(
    'STORAGE_IN_RELEASE',
    `The release wrote its data into ${path.join(dir, 'storage')} instead of the installation's storage directory: its @nocobase/app-server predates APP_STORAGE_DIR.`,
    {
      suggestions: [
        {
          message:
            'Upgrade @nocobase/app-server and @nocobase/app-cli in the application project, then build the archive again:',
          run: rebuildCommandLine(),
        },
      ],
    },
  );
}
