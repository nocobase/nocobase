// Finding the application's CLI for a run (`RunPayload.cli.package`), in this order:
//
// 1. a local override for the command name, from the registration (`nocobase-runner register --cli acme=/path`);
// 2. `preinstalled`: the command on the runner's PATH;
// 3. `npm`: `package@version`, installed once into `~/.nocobase-runner/cli/<name>/<version>/`;
// 4. `tarball`: downloaded, checked against its SHA-256, and installed the same way under its hash;
// 5. `archive`: a standalone tarball the application serves (Node bundled, no npm needed), downloaded with the runner's
//    key, checked against its SHA-256 and unpacked once into `~/.nocobase-runner/cli/<name>/archive-<version>-<sha>/`;
//    the command is its `bin/<name>`.
//
// The runner runs only what it found; it never bundles application commands. An install is locked per target, so
// concurrent runs install once.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { safeName, type RunnerPaths } from '../lib/home.ts';
import type { ApiClient } from '../lib/http.ts';
import { unpackTarball } from '../lib/install.ts';
import type { RunCli } from '../protocol/index.ts';
import { acquireLock } from '../core/checkout.ts';

const run = promisify(execFile);

export class CliUnavailableError extends Error {
  override name = 'CliUnavailableError';
}

export interface ResolveCliOptions {
  paths: RunnerPaths;
  cli: RunCli;
  /** Local overrides by command name. */
  overrides?: Readonly<Record<string, string>>;
  /** The runner's PATH, for `preinstalled`. */
  searchPath?: string;
  /** Runs npm; tests replace it. */
  npm?: (args: string[], cwd: string) => Promise<void>;
  fetch?: typeof fetch;
  /** The application's client, with the runner's key: what downloads an `archive`. */
  client?: Pick<ApiClient, 'download'>;
  log?: (message: string) => void;
}

/** The first `name` on `searchPath` that exists. */
export function which(name: string, searchPath: string): string | undefined {
  for (const dir of searchPath.split(path.delimiter)) {
    if (dir === '') continue;
    const candidate = path.join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function defaultNpm(args: string[], cwd: string): Promise<void> {
  await run('npm', args, { cwd, maxBuffer: 16 * 1024 * 1024 });
}

async function installInto(
  dir: string,
  spec: string,
  options: ResolveCliOptions,
): Promise<string> {
  const bin = path.join(dir, 'node_modules', '.bin', options.cli.name);
  if (existsSync(bin)) return bin;
  const lock = await acquireLock(`${dir}.lock`, { timeoutMs: 300_000 });
  try {
    if (existsSync(bin)) return bin;
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(path.join(dir, 'package.json'), '{"private":true}\n');
    options.log?.(`cli: installing ${spec} into ${dir}`);
    await (options.npm ?? defaultNpm)(
      [
        'install',
        '--no-save',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        spec,
      ],
      dir,
    );
    if (!existsSync(bin))
      throw new CliUnavailableError(
        `${spec} does not provide a ${options.cli.name} command.`,
      );
    return bin;
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error instanceof CliUnavailableError
      ? error
      : new CliUnavailableError(
          `Could not install ${spec}: ${error instanceof Error ? error.message : String(error)}`,
        );
  } finally {
    await lock.release();
  }
}

/** The executable (or JavaScript entry) of the run's CLI; `CliUnavailableError` when there is none. */
export async function resolveCli(options: ResolveCliOptions): Promise<string> {
  const { cli, paths } = options;
  const override = options.overrides?.[cli.name];
  if (override !== undefined) {
    if (!existsSync(override))
      throw new CliUnavailableError(
        `The local ${cli.name} at ${override} does not exist.`,
      );
    return override;
  }
  const base = path.join(paths.cliDir, safeName(cli.name));
  switch (cli.package.kind) {
    case 'preinstalled': {
      const found = which(
        cli.name,
        options.searchPath ?? process.env.PATH ?? '',
      );
      if (found === undefined)
        throw new CliUnavailableError(
          `${cli.name} is not installed on this runner, and the run expects it to be.`,
        );
      return found;
    }
    case 'npm': {
      const { package: name, version } = cli.package;
      return installInto(
        path.join(base, safeName(version)),
        `${name}@${version}`,
        options,
      );
    }
    case 'archive': {
      const { version, url, sha256 } = cli.package;
      const dir = path.join(
        base,
        `archive-${safeName(version)}-${sha256.slice(0, 12)}`,
      );
      const bin = path.join(dir, 'bin', cli.name);
      if (existsSync(bin)) return bin;
      if (options.client === undefined)
        throw new CliUnavailableError(
          `${cli.name} ${version} is served by the application, and this runner has no connection to download it.`,
        );
      await mkdir(base, { recursive: true, mode: 0o700 });
      const lock = await acquireLock(`${dir}.lock`, { timeoutMs: 300_000 });
      try {
        if (existsSync(bin)) return bin;
        options.log?.(`cli: downloading ${cli.name} ${version} from ${url}`);
        const bytes = await options.client
          .download(url)
          .catch((error: unknown) => {
            throw new CliUnavailableError(
              `Could not download ${cli.name} ${version}: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
        await unpackTarball(bytes, sha256, dir).catch((error: unknown) => {
          throw new CliUnavailableError(
            `Could not install ${cli.name} ${version}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
        if (!existsSync(bin))
          throw new CliUnavailableError(
            `The ${cli.name} ${version} archive has no bin/${cli.name}.`,
          );
        return bin;
      } finally {
        await lock.release();
      }
    }
    case 'tarball': {
      const { url, sha256 } = cli.package;
      const dir = path.join(base, sha256);
      if (existsSync(path.join(dir, 'node_modules', '.bin', cli.name)))
        return path.join(dir, 'node_modules', '.bin', cli.name);
      const response = await (options.fetch ?? fetch)(url).catch(
        (error: unknown) => {
          throw new CliUnavailableError(
            `Could not download ${url}: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      );
      if (!response.ok)
        throw new CliUnavailableError(
          `Downloading ${url} answered ${response.status}.`,
        );
      const bytes = Buffer.from(await response.arrayBuffer());
      const actual = createHash('sha256').update(bytes).digest('hex');
      if (actual !== sha256)
        throw new CliUnavailableError(
          `${url} does not match its SHA-256 (got ${actual}).`,
        );
      await mkdir(base, { recursive: true, mode: 0o700 });
      const tarball = path.join(base, `${sha256}.tgz`);
      await writeFile(tarball, bytes, { mode: 0o600 });
      return installInto(dir, tarball, options);
    }
  }
}
