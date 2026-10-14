import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { extract } from 'tar';
import { parse, stringify } from 'yaml';
import { EXIT_INVALID, InstallerError, isInstallerError } from './errors.ts';
import type { Layout } from './layout.ts';
import type { Reporter } from './output.ts';
import { unpackRelease, type PreparedRelease } from './release.ts';
import { CommandFailedError, tail, type RunCommand } from './run-command.ts';

export interface AppSpec {
  package: string;
  selector: string;
}

/** Bare names are official applications; other publishers use their full scoped package name. */
export function parseAppSpec(value: string): AppSpec {
  const match =
    /^(?:(@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*)|([a-z0-9][a-z0-9._-]*))(?:@([a-zA-Z0-9][a-zA-Z0-9.+_-]*))?$/u.exec(
      value,
    );
  if (!match) {
    throw new InstallerError(
      'INVALID_USAGE',
      '--app expects an application name, optionally followed by @<version or tag>, e.g. studio or @nocobase/studio@beta.',
      { exitCode: EXIT_INVALID },
    );
  }
  return {
    package: match[1] ?? `@nocobase/${match[2]}`,
    selector: match[3] ?? 'latest',
  };
}

/** Explicit application scope prevents a user's scoped registry from overriding --registry. */
function registryArgs(packageName: string, registry: string): string[] {
  return [
    `--registry=${registry}`,
    `--${packageName.split('/')[0]}:registry=${registry}`,
  ];
}

/** npm handles the user's registry authentication; resolve once, then pack that exact version. */
export async function resolveApp(
  spec: AppSpec,
  registry: string,
  run: RunCommand,
): Promise<AppSpec> {
  // Validate selectors read from state or --to as well as those supplied to install.
  parseAppSpec(`${spec.package}@${spec.selector}`);
  try {
    const result = await run(
      'npm',
      [
        'view',
        `${spec.package}@${spec.selector}`,
        'name',
        'version',
        '--json',
        ...registryArgs(spec.package, registry),
      ],
      { timeoutMs: 120_000 },
    );
    const metadata = JSON.parse(result.stdout) as {
      name?: string;
      version?: string;
    };
    if (
      metadata.name !== spec.package ||
      !metadata.version ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(
        metadata.version,
      )
    ) {
      throw new InstallerError(
        'APP_INVALID',
        `The registry did not resolve ${spec.package}@${spec.selector} to one application version.`,
      );
    }
    return { package: spec.package, selector: metadata.version };
  } catch (error) {
    if (isInstallerError(error)) throw error;
    throw new InstallerError(
      'APP_RESOLVE_FAILED',
      `Could not resolve ${spec.package}@${spec.selector} from ${registry}.`,
      {
        cause: error,
        ...(error instanceof CommandFailedError
          ? { details: { output: tail(`${error.stdout}\n${error.stderr}`) } }
          : {}),
      },
    );
  }
}

/** Build the published application itself, without scaffolding or rewriting its identity. */
export async function buildApp(options: {
  app: AppSpec;
  registry: string;
  layout: Layout;
  run: RunCommand;
  reporter: Reporter;
}): Promise<PreparedRelease> {
  const { app, registry, layout, run, reporter } = options;
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-build-'),
  );
  const env = {
    ...process.env,
    npm_config_registry: registry,
    NPM_CONFIG_REGISTRY: registry,
    PNPM_CONFIG_REGISTRY: registry,
    PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0',
    CI: 'true',
  };
  try {
    const pnpm = await run('pnpm', ['--version'], { cwd: temporary, env });
    if (
      Number.parseInt(pnpm.stdout, 10) < 11 ||
      !/^\d+\./u.test(pnpm.stdout.trim())
    ) {
      throw new InstallerError(
        'PNPM_REQUIRED',
        'Installing an npm application requires pnpm 11 or later.',
        { exitCode: EXIT_INVALID },
      );
    }
    reporter.progress(`Downloading ${app.package}@${app.selector}`);
    const packed = await run(
      'npm',
      [
        'pack',
        `${app.package}@${app.selector}`,
        '--ignore-scripts',
        '--json',
        ...registryArgs(app.package, registry),
      ],
      { cwd: temporary, env, timeoutMs: 120_000 },
    );
    const entries = JSON.parse(packed.stdout) as { filename: string }[];
    const filename = entries[0]?.filename;
    if (!filename || filename !== path.basename(filename))
      throw new InstallerError(
        'APP_INVALID',
        'npm pack returned no application tarball.',
      );
    extract({
      file: path.join(temporary, filename),
      cwd: temporary,
      strip: 1,
      strict: true,
      sync: true,
    });
    const manifest = JSON.parse(
      await readFile(path.join(temporary, 'package.json'), 'utf8'),
    ) as {
      name?: string;
      version?: string;
      nocobase?: { templateKind?: string };
      scripts?: { build?: string };
    };
    if (
      manifest.name !== app.package ||
      manifest.version !== app.selector ||
      manifest.nocobase?.templateKind !== 'app' ||
      !manifest.scripts?.build
    ) {
      throw new InstallerError(
        'APP_INVALID',
        `${app.package}@${app.selector} is not a buildable NocoBase application package.`,
        { exitCode: EXIT_INVALID },
      );
    }
    const workspaceFile = path.join(temporary, 'pnpm-workspace.yaml');
    const existing = await readFile(workspaceFile, 'utf8').catch(
      (error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
        throw error;
      },
    );
    const workspace = (parse(existing) ?? {}) as Record<string, unknown>;
    await writeFile(
      workspaceFile,
      stringify({
        verifyDepsBeforeRun: false,
        strictDepBuilds: false,
        ...workspace,
        allowBuilds: {
          esbuild: true,
          oracledb: true,
          'better-sqlite3': false,
          'tesseract.js': false,
          ...(workspace.allowBuilds as Record<string, boolean> | undefined),
        },
      }),
    );
    const npmrc = path.join(temporary, '.npmrc');
    await writeFile(
      npmrc,
      `\nregistry=${registry}\n@nocobase:registry=${registry}\n${app.package.split('/')[0]}:registry=${registry}\n`,
      { flag: 'a' },
    );
    reporter.progress(
      `Installing build dependencies for ${app.package}@${app.selector}`,
    );
    await run(
      'pnpm',
      [
        'install',
        '--no-frozen-lockfile',
        '--prod=false',
        '--config.strict-peer-dependencies=false',
        `--registry=${registry}`,
      ],
      { cwd: temporary, env, timeoutMs: 20 * 60_000 },
    );
    reporter.progress(
      `Building ${app.package}@${app.selector} for this server`,
    );
    await run('pnpm', ['build', '--tar'], {
      cwd: temporary,
      env,
      timeoutMs: 30 * 60_000,
    });
    const prepared = await unpackRelease({
      layout,
      archive: path.join(temporary, 'storage/exports/dist.tar.gz'),
    });
    if (prepared.appName !== app.package || prepared.version !== app.selector) {
      if (!prepared.reused)
        await rm(path.dirname(prepared.dir), { recursive: true, force: true });
      throw new InstallerError(
        'APP_INVALID',
        'The build changed the published application name or version.',
      );
    }
    return prepared;
  } catch (error) {
    if (isInstallerError(error)) throw error;
    throw new InstallerError(
      'APP_BUILD_FAILED',
      `Building ${app.package}@${app.selector} failed: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
        ...(error instanceof CommandFailedError
          ? { details: { output: tail(`${error.stdout}\n${error.stderr}`) } }
          : {}),
      },
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
