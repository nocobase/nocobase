import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EXIT_INVALID, InstallerError, isInstallerError } from './errors.ts';
import {
  APP_NAME,
  HUB_BASE_PATH,
  TEMPLATE_PACKAGE,
  buildRoot,
  releaseDir,
  type Layout,
} from './layout.ts';
import type { Reporter } from './output.ts';
import { currentNodeMajor } from './prechecks.ts';
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

/** SQLite ships with the template; any other dialect's driver has to be added before the build. */
export function driversFor(dialect: Dialect): string[] {
  return dialect === 'sqlite' ? [] : [`@nocobase/db-${dialect}`];
}

/**
 * The environment every install step runs with. pnpm 11 holds back versions younger than a day by default, which would
 * make a Hub released today uninstallable until tomorrow; the NocoBase documentation clears it the same way.
 */
export function installEnv(
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return { ...base, PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0' };
}

/** `pnpm create` prints pnpm's own notices around create-app's result; the result is the last line that parses. */
export function parseCreateResult(stdout: string): {
  status?: string;
  stage?: string;
  message?: string;
} {
  for (const line of stdout.trim().split('\n').reverse()) {
    if (!line.startsWith('{')) continue;
    try {
      return JSON.parse(line) as {
        status?: string;
        stage?: string;
        message?: string;
      };
    } catch {
      // Not the result line.
    }
  }
  return {};
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

export interface PrepareReleaseOptions {
  layout: Layout;
  version: string;
  registry: string;
  drivers: readonly string[];
  keepSource: boolean;
  reporter: Reporter;
  run?: RunCommand;
  /** Where to unpack the release; `releases/<version>/hub` unless a rebuild of the running version is staged beside it. */
  targetDir?: string;
}

export interface PreparedRelease {
  dir: string;
  buildTarget: BuildTarget;
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
 * Builds one release: the Hub template is generated and built in `.build/<version>/`, and only the deployment archive
 * it produces is unpacked into `releases/<version>/hub/`. The build directory, with the sources and development
 * dependencies, is removed afterwards unless `keepSource` is set. Nothing here touches the running Hub.
 *
 * On failure every directory this call created is removed again, so a retry starts clean.
 */
export async function prepareRelease(
  options: PrepareReleaseOptions,
): Promise<PreparedRelease> {
  const { layout, version, reporter } = options;
  const run = options.run ?? runCommand;
  const build = buildRoot(layout, version);
  const projectDir = path.join(build, APP_NAME);
  const target = options.targetDir ?? releaseDir(layout, version);
  const env = installEnv();

  if (existsSync(target)) {
    throw new InstallerError('RELEASE_EXISTS', `${target} already exists.`, {
      exitCode: EXIT_INVALID,
    });
  }

  let releaseCreated = false;
  try {
    await rm(build, { recursive: true, force: true });
    await mkdir(build, { recursive: true });
    // `pnpm create` looks up @nocobase/create-app with the configuration of the directory it runs in, not with
    // --registry, so the registry has to be named here too while NocoBase packages live outside the public npm.
    await writeFile(
      path.join(build, '.npmrc'),
      `@nocobase:registry=${normalizeRegistry(options.registry)}/\n`,
    );

    reporter.progress(`Generating the Hub ${version} project`);
    let createStdout: string;
    try {
      ({ stdout: createStdout } = await run(
        'pnpm',
        [
          'create',
          '@nocobase/app',
          APP_NAME,
          `--template=${TEMPLATE_PACKAGE}@${version}`,
          `--registry=${normalizeRegistry(options.registry)}`,
          '--json',
        ],
        { cwd: build, env, timeoutMs: 20 * 60_000 },
      ));
    } catch (error) {
      if (isInstallerError(error)) throw error;
      const result =
        error instanceof CommandFailedError
          ? parseCreateResult(error.stdout)
          : {};
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
    if (created.status !== 'success') {
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

    reporter.progress(`Building the Hub ${version}`);
    try {
      // The base path is compiled into the client; an APP_BASE_PATH left in the caller's shell must not leak in.
      await run('pnpm', ['build', '--tar'], {
        cwd: projectDir,
        env: { ...env, APP_BASE_PATH: HUB_BASE_PATH },
        timeoutMs: 30 * 60_000,
      });
    } catch (error) {
      throw stepFailure('BUILD_FAILED', 'pnpm build', error);
    }

    const archive = path.join(projectDir, 'storage/exports/dist.tar.gz');
    await mkdir(target, { recursive: true });
    releaseCreated = true;
    try {
      await run('tar', ['-xzf', archive, '-C', target]);
    } catch (error) {
      throw stepFailure(
        'UNPACK_FAILED',
        'Unpacking the deployment archive',
        error,
      );
    }

    const manifest = JSON.parse(
      await readFile(path.join(target, 'dist/package.json'), 'utf8'),
    ) as { nocobase?: { buildTarget?: BuildTarget } };
    const buildTarget = verifyBuildTarget(manifest.nocobase?.buildTarget);

    if (!options.keepSource) {
      await rm(build, { recursive: true, force: true });
      // Only removes `.build/` once it is empty; another version's kept build stays.
      await rmdir(layout.buildDir).catch(() => undefined);
    }
    return { dir: target, buildTarget };
  } catch (error) {
    if (releaseCreated) {
      await rm(path.dirname(target), { recursive: true, force: true });
    }
    if (!options.keepSource) {
      await rm(build, { recursive: true, force: true });
    }
    throw error;
  }
}
