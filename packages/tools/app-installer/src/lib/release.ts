import { existsSync } from 'node:fs';
import {
  mkdir,
  readFile,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { extract } from 'tar';
import { EXIT_INVALID, InstallerError, isInstallerError } from './errors.ts';
import {
  RELEASE_APP_DIR,
  buildRoot,
  releaseDir,
  releaseId,
  stagingDir,
  type Layout,
  type TemplateDefinition,
} from './layout.ts';
import type { Reporter } from './output.ts';
import { currentNodeMajor, rebuildCommandLine } from './prechecks.ts';
import { normalizeRegistry } from './registry.ts';
import {
  CommandFailedError,
  runCommand,
  tail,
  type RunCommand,
} from './run-command.ts';
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

/** SQLite ships with every template; any other dialect's driver has to be added before the build. */
export function driversFor(dialect: Dialect): string[] {
  return dialect === 'sqlite' ? [] : [`@nocobase/db-${dialect}`];
}

/**
 * The environment every install step runs with. pnpm 11 holds back versions younger than a day by default, which would
 * make a template released today uninstallable until tomorrow; the NocoBase documentation clears it the same way.
 */
export function installEnv(
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return { ...base, PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0' };
}

/** What the installer reads from create-app's `--json` result. */
export interface CreateResult {
  /** Whether a result was printed and says the project was created. */
  ok: boolean;
  /** The stage a failure stopped at, such as `install`. */
  stage?: string;
  message?: string;
}

interface CreateJson {
  ok?: boolean;
  status?: string;
  stage?: string;
  message?: string;
  error?: { message?: string; details?: { stage?: unknown } };
}

/**
 * `pnpm create` prints pnpm's own notices around create-app's result; the result is the last line that parses. It is
 * the application CLI's envelope, with the stage under `error.details`. `pnpm create` runs whichever create-app the
 * registry serves as latest, so the flat `status`, `stage` and `message` a create-app before that envelope printed are
 * read too.
 */
export function parseCreateResult(stdout: string): CreateResult {
  for (const line of stdout.trim().split('\n').reverse()) {
    if (!line.startsWith('{')) continue;
    let parsed: CreateJson;
    try {
      parsed = JSON.parse(line) as CreateJson;
    } catch {
      continue;
    }
    const stage = parsed.error?.details?.stage;
    return {
      ok: parsed.ok ?? parsed.status === 'success',
      stage: typeof stage === 'string' ? stage : parsed.stage,
      message: parsed.error?.message ?? parsed.message,
    };
  }
  return { ok: false };
}

/**
 * The range the installed runtime accepts for a driver, read from `@nocobase/app-server`'s peer dependencies the same
 * way `nocobase config init` suggests it. A bare `pnpm add` would take the newest driver, which during a prerelease can
 * be one the runtime was never built against.
 */
export async function driverSpecifier(
  projectDir: string,
  driver: string,
): Promise<string> {
  try {
    const manifest = JSON.parse(
      await readFile(
        path.join(projectDir, 'node_modules/@nocobase/app-server/package.json'),
        'utf8',
      ),
    ) as { peerDependencies?: Record<string, string> };
    const range = manifest.peerDependencies?.[driver]?.trim();
    return range && !range.startsWith('workspace:')
      ? `${driver}@${range}`
      : driver;
  } catch {
    return driver;
  }
}

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
    templateKind?: string;
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
  /** `nocobase.templateKind` from the manifest: `hub` for a Hub, `app` for an application; absent from older builds. */
  templateKind?: string;
  /** The release was already on disk under this id, so nothing was unpacked. */
  reused: boolean;
}

export interface UnpackOptions {
  layout: Layout;
  archive: string;
  /**
   * What to assume when the manifest predates `nocobase.builtAt` and `nocobase.basePath`. Only a template build passes
   * this, since the installer knows its template's base path and has just built it; an archive from elsewhere that
   * lacks them is refused before this is called.
   */
  fallback?: { builtAt: string; basePath: string };
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
  const fromArchive = options.fallback === undefined;
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
      if (!fromArchive || !isInstallerError(error)) throw error;
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
    const builtAt = manifest.nocobase?.builtAt ?? options.fallback?.builtAt;
    const relocatable = manifest.nocobase?.relocatable === true;
    const basePath = relocatable
      ? undefined
      : (manifest.nocobase?.basePath ?? options.fallback?.basePath);
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
      templateKind: manifest.nocobase?.templateKind,
      reused,
    };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export interface BuildFromTemplateOptions {
  layout: Layout;
  template: TemplateDefinition;
  version: string;
  registry: string;
  drivers: readonly string[];
  keepSource: boolean;
  reporter: Reporter;
  run?: RunCommand;
}

/**
 * Builds one release from a published template: the project is generated and built in `.build/<version>/`, and only
 * the deployment archive it produces is unpacked into `releases/<id>/app`. The build directory, with the sources and
 * development dependencies, is removed afterwards unless `keepSource` is set. Nothing here touches the running
 * application; on failure every directory this call created is removed again, so a retry starts clean.
 */
export async function buildFromTemplate(
  options: BuildFromTemplateOptions,
): Promise<PreparedRelease> {
  const { layout, template, version, reporter } = options;
  const run = options.run ?? runCommand;
  const build = buildRoot(layout, version);
  const projectDir = path.join(build, template.projectName);
  const env = installEnv();
  const startedAt = new Date().toISOString();

  try {
    await rm(build, { recursive: true, force: true });
    await mkdir(build, { recursive: true });
    // `pnpm create` looks up @nocobase/create-app with the configuration of the directory it runs in, not with
    // --registry, so the registry has to be named here too while NocoBase packages live outside the public npm.
    await writeFile(
      path.join(build, '.npmrc'),
      `@nocobase:registry=${normalizeRegistry(options.registry)}/\n`,
    );

    reporter.progress(`Generating the ${template.title} ${version} project`);
    let createStdout: string;
    try {
      ({ stdout: createStdout } = await run(
        'pnpm',
        [
          'create',
          '@nocobase/app',
          template.projectName,
          `--template=${template.package}@${version}`,
          `--registry=${normalizeRegistry(options.registry)}`,
          '--json',
        ],
        { cwd: build, env, timeoutMs: 20 * 60_000 },
      ));
    } catch (error) {
      if (isInstallerError(error)) throw error;
      const result: CreateResult =
        error instanceof CommandFailedError
          ? parseCreateResult(error.stdout)
          : { ok: false };
      throw new InstallerError(
        'CREATE_FAILED',
        `create-app failed${result.stage ? ` at its ${result.stage} stage` : ''}: ${result.message ?? (error instanceof Error ? error.message : String(error))}`,
        {
          cause: error,
          ...(error instanceof CommandFailedError
            ? { details: { output: tail(error.stderr) } }
            : {}),
        },
      );
    }
    const created = parseCreateResult(createStdout);
    if (!created.ok) {
      throw new InstallerError(
        'CREATE_FAILED',
        `create-app did not succeed: ${created.message ?? 'no result'}`,
      );
    }

    for (const driver of options.drivers) {
      const specifier = await driverSpecifier(projectDir, driver);
      reporter.progress(`Adding ${specifier}`);
      try {
        await run('pnpm', ['add', specifier], {
          cwd: projectDir,
          env,
          timeoutMs: 10 * 60_000,
        });
      } catch (error) {
        throw stepFailure(
          'DRIVER_INSTALL_FAILED',
          `pnpm add ${specifier}`,
          error,
        );
      }
    }

    reporter.progress(`Building the ${template.title} ${version}`);
    try {
      // A template version from before relocatable builds compiles the base path into its client, so an APP_BASE_PATH
      // left in the caller's shell must not leak in. A current version ignores it.
      await run('pnpm', ['build', '--tar'], {
        cwd: projectDir,
        env: { ...env, APP_BASE_PATH: template.basePath },
        timeoutMs: 30 * 60_000,
      });
    } catch (error) {
      throw stepFailure('BUILD_FAILED', 'pnpm build', error);
    }

    const prepared = await unpackRelease({
      layout,
      archive: path.join(projectDir, 'storage/exports/dist.tar.gz'),
      // Published templates built before `pnpm build` recorded these have neither; the installer knows both.
      fallback: { builtAt: startedAt, basePath: template.basePath },
    });

    if (!options.keepSource) {
      await rm(build, { recursive: true, force: true });
      // Only removes `.build/` once it is empty; another version's kept build stays.
      await rmdir(layout.buildDir).catch(() => undefined);
    }
    return prepared;
  } catch (error) {
    if (!options.keepSource) {
      await rm(build, { recursive: true, force: true });
      await rmdir(layout.buildDir).catch(() => undefined);
    }
    throw error;
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
