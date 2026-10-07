// Packs a command line into standalone tarballs that bundle their own Node.js, one per target, for an application to
// serve (`/api/agents/dist` of `@nocobase/app-plugin-agents`): the application's own CLI (`nocobase.cli`, run by
// `@nocobase/app-cli-client`), or the runner, `nocobase-runner` (`@nocobase/agent-runner`). Nothing is published to a
// registry; a machine needs nothing installed to run them.
//
// 1. Stage the package: for the CLI, a package of its own (`bin/run.js`, its `nocobase.cli`, the skills it ships) that
//    depends on `@nocobase/app-cli-client`; for the runner, `@nocobase/agent-runner` itself.
// 2. Vendor every dependency that is linked from a source checkout (a workspace package): build it, `pnpm pack` it
//    (which turns `workspace:` and `catalog:` ranges into versions) into `vendor/`, and point the manifest at the file.
//    Dependencies installed from a registry stay registry dependencies.
// 3. Install the production dependencies once with npm, leaving optional dependencies out (the only ones are the
//    Claude Agent SDK's platform packages, each a bundled Claude Code binary the runner never uses). Nothing installed
//    is native, so the same tree serves every target.
// 4. Per target, add that target's `node` binary (downloaded from nodejs.org and checked against its SHASUMS256.txt,
//    cached under `node_modules/.cache/nocobase-cli/node`; `--host-node` uses this machine's own for its own target)
//    and a `bin/<bin>` launcher that runs `bin/run.js` with it, and pack `<bin>/` as
//    `<product>-v<version>-<target>.tar.gz`.
// 5. Record each tarball's SHA-256 and size in the product's manifest:
//
//      <out>/<channel>/<product>/manifest.json
//      <out>/<channel>/<product>/<version>/<product>-v<version>-<target>.tar.gz
//
//    which the application reads from `storage/runners/dist` (`agents.dist.dir`). Each product has a directory and a
//    manifest of its own, so the CLI and the runner are built, and mounted into storage, apart.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, realpathSync } from 'node:fs';
import {
  chmod,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CommandError } from '../command/errors.ts';
import { cliEntry, runtimeBrand, type CliApplication } from './cli-brand.ts';

/** The targets a build packs when it names none. Windows is not supported. */
export const CLI_TARGETS: readonly string[] = Object.freeze([
  'darwin-arm64',
  'darwin-x64',
  'linux-x64',
  'linux-arm64',
]);

/** The runner's product and command (`RUNNER_PRODUCT` of `@nocobase/agent-protocol`). */
export const RUNNER_COMMAND = 'nocobase-runner';

const CLIENT_PACKAGE = '@nocobase/app-cli-client';
const RUNNER_PACKAGE = '@nocobase/agent-runner';
const TARGET = /^(darwin|linux)-(x64|arm64)$/u;
const CHANNEL = /^[a-z][a-z0-9-]*$/u;
const VERSION = /^[0-9A-Za-z.+-]{1,64}$/u;

export interface CliPackOptions {
  readonly application: CliApplication;
  /** The runner instead of the application's CLI. */
  readonly runner: boolean;
  /** Where the channels go: `<out>/<channel>/<product>/…`. */
  readonly out: string;
  readonly channel: string;
  readonly targets: readonly string[];
  /** The packed version; the CLI's or the runner's own otherwise. */
  readonly version?: string;
  /** The Node.js version the tarballs carry; this process's by default. */
  readonly nodeVersion: string;
  /** Use this machine's Node.js binary for its own target instead of downloading one. */
  readonly hostNode: boolean;
  /** Do not build the vendored workspace packages first. */
  readonly skipBuild: boolean;
  /** Keep the staging directory, and say where it is. */
  readonly keepStaging: boolean;
  /** Progress, on stderr. */
  readonly log: (line: string) => void;
}

/** One tarball, as the product's manifest records it. */
export interface PackedTarget {
  /** Relative to the product's directory: `<version>/<file>`. */
  readonly file: string;
  readonly sha256: string;
  readonly size: number;
}

export interface CliPackResult {
  readonly product: string;
  readonly version: string;
  readonly channel: string;
  readonly node: string;
  /** The product's directory, `<out>/<channel>/<product>`. */
  readonly dir: string;
  readonly manifest: string;
  readonly targets: Readonly<Record<string, PackedTarget>>;
}

interface PackageManifest {
  name?: string;
  version?: string;
  description?: string;
  private?: boolean;
  bin?: string | Record<string, string>;
  files?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

async function readManifest(dir: string): Promise<PackageManifest> {
  return JSON.parse(
    await readFile(path.join(dir, 'package.json'), 'utf8'),
  ) as PackageManifest;
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Runs a command, its output on stderr; rejects when it fails. */
export function runCommand(
  command: string,
  args: readonly string[],
  options: {
    cwd: string;
    env?: Record<string, string>;
    log: (line: string) => void;
  },
): Promise<void> {
  options.log(`$ ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.pipe(process.stderr, { end: false });
    child.stderr.pipe(process.stderr, { end: false });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else
        reject(
          new CommandError(
            `${command} ${args.join(' ')} exited with ${code}.`,
            {
              code: 'CLI_BUILD_STEP_FAILED',
            },
          ),
        );
    });
  });
}

/** The directory of package `name` as Node resolves it from `fromDir`, or undefined. */
export function findPackageDir(
  fromDir: string,
  name: string,
): string | undefined {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', name);
    if (existsSync(path.join(candidate, 'package.json')))
      return realpathSync(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** A package linked from a source checkout, which no registry has in this version: it travels inside the tarball. */
function isLinked(dir: string): boolean {
  return !dir.split(path.sep).includes('node_modules');
}

async function sha256Of(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file))
    hash.update(chunk as Buffer);
  return hash.digest('hex');
}

/**
 * `pnpm pack`s the linked package in `dir` into `destination`, after building it unless `skipBuild`; returns the
 * tarball's file name.
 */
async function packLinked(
  dir: string,
  destination: string,
  options: Pick<CliPackOptions, 'skipBuild' | 'log'>,
): Promise<string> {
  const manifest = await readManifest(dir);
  if (!options.skipBuild && manifest.scripts?.['build'] !== undefined)
    await runCommand('pnpm', ['run', 'build'], { cwd: dir, log: options.log });
  const before = new Set(await readdir(destination));
  await runCommand('pnpm', ['pack', '--pack-destination', destination], {
    cwd: dir,
    log: options.log,
  });
  const packed = (await readdir(destination)).find(
    (entry) => !before.has(entry) && entry.endsWith('.tgz'),
  );
  if (packed === undefined)
    throw new CommandError(`pnpm pack wrote no tarball for ${dir}.`, {
      code: 'CLI_BUILD_STEP_FAILED',
    });
  return packed;
}

/**
 * Vendors the linked packages `roots` depend on, transitively, into `vendor/`; returns each vendored package's
 * tarball by name. `roots` are package directories whose own `dependencies` are read.
 */
async function vendorLinked(
  roots: readonly string[],
  vendor: string,
  options: Pick<CliPackOptions, 'skipBuild' | 'log'>,
): Promise<Map<string, string>> {
  const vendored = new Map<string, string>();
  const pending = [...roots];
  while (pending.length > 0) {
    const dir = pending.shift();
    if (dir === undefined) break;
    const deps = (await readManifest(dir)).dependencies ?? {};
    for (const name of Object.keys(deps)) {
      if (vendored.has(name)) continue;
      const depDir = findPackageDir(dir, name);
      if (depDir === undefined || !isLinked(depDir)) continue;
      vendored.set(name, await packLinked(depDir, vendor, options));
      pending.push(depDir);
    }
  }
  return vendored;
}

/** Unpacks a package tarball (`package/…`) into `dest`. */
async function unpackPackage(
  tarball: string,
  dest: string,
  log: (line: string) => void,
): Promise<void> {
  await mkdir(dest, { recursive: true });
  await runCommand(
    'tar',
    ['-xzf', tarball, '-C', dest, '--strip-components=1'],
    { cwd: dest, log },
  );
}

/** Copies each skill directory `entries` name (or each one inside it) into `skillsDir`; returns the slugs. */
export async function copySkills(
  root: string,
  entries: readonly string[],
  skillsDir: string,
): Promise<string[]> {
  const slugs: string[] = [];
  const copy = async (dir: string): Promise<void> => {
    const slug = path.basename(dir);
    if (slugs.includes(slug))
      throw new CommandError(`Two skills are named ${slug}.`, {
        code: 'CLI_CONFIG_INVALID',
      });
    await cp(dir, path.join(skillsDir, slug), {
      recursive: true,
      dereference: true,
    });
    slugs.push(slug);
  };
  for (const entry of entries) {
    const dir = path.resolve(root, entry);
    if (existsSync(path.join(dir, 'SKILL.md'))) {
      await copy(dir);
      continue;
    }
    let children: string[];
    try {
      children = (await readdir(dir)).sort();
    } catch {
      throw new CommandError(
        `nocobase.cli.skills names ${entry}, which is not a directory.`,
        { code: 'CLI_CONFIG_INVALID' },
      );
    }
    const skills = children.filter((child) =>
      existsSync(path.join(dir, child, 'SKILL.md')),
    );
    if (skills.length === 0)
      throw new CommandError(
        `nocobase.cli.skills names ${entry}, which holds no SKILL.md.`,
        { code: 'CLI_CONFIG_INVALID' },
      );
    for (const child of skills) await copy(path.join(dir, child));
  }
  return slugs;
}

/** The launcher a tarball starts its command with: `bin/run.js` under the Node.js the tarball carries. */
export function launcherScript(bin: string): string {
  return [
    '#!/bin/sh',
    `# Starts ${bin} with the Node.js this package carries. Generated by \`nocobase cli build\`.`,
    'self="$0"',
    'while [ -h "$self" ]; do',
    '  link="$(readlink "$self")"',
    '  case "$link" in',
    '    /*) self="$link" ;;',
    '    *) self="$(dirname "$self")/$link" ;;',
    '  esac',
    'done',
    'root="$(cd "$(dirname "$self")/.." && pwd -P)"',
    'exec "$root/bin/node" "$root/bin/run.js" "$@"',
    '',
  ].join('\n');
}

/** `linux-x64` as nodejs.org names it: the same, for the targets this packs. */
function nodeDistName(version: string, target: string): string {
  return `node-v${version}-${target}`;
}

/** The `node` binary of `version` for `target`: downloaded once, checked, and cached under `cacheDir`. */
async function nodeBinary(
  version: string,
  target: string,
  options: { cacheDir: string; hostNode: boolean; log: (line: string) => void },
): Promise<string> {
  const host = `${process.platform}-${process.arch}`;
  if (options.hostNode && target === host && version === process.versions.node)
    return process.execPath;
  const name = nodeDistName(version, target);
  const cached = path.join(options.cacheDir, name, 'node');
  if (existsSync(cached)) return cached;
  const base = `https://nodejs.org/dist/v${version}`;
  options.log(`Downloading Node.js ${version} for ${target} from ${base}`);
  const fetchOk = async (url: string): Promise<Response> => {
    const response = await fetch(url);
    if (!response.ok)
      throw new CommandError(`${url} answered ${response.status}.`, {
        code: 'NODE_DOWNLOAD_FAILED',
        suggestions: [
          'Check the Node.js version (--node-version) and the network, or pass --host-node to use this machine’s Node.js for its own platform.',
        ],
      });
    return response;
  };
  const sums = await (await fetchOk(`${base}/SHASUMS256.txt`)).text();
  const archive = `${name}.tar.gz`;
  const expected = sums
    .split('\n')
    .map((line) => line.trim().split(/\s+/u))
    .find(([, file]) => file === archive)?.[0];
  if (expected === undefined)
    throw new CommandError(`Node.js ${version} has no build for ${target}.`, {
      code: 'NODE_DOWNLOAD_FAILED',
    });
  const bytes = new Uint8Array(
    await (await fetchOk(`${base}/${archive}`)).arrayBuffer(),
  );
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected)
    throw new CommandError(
      `${archive} does not match its SHA-256 (expected ${expected}, got ${actual}).`,
      { code: 'NODE_DOWNLOAD_FAILED' },
    );
  const work = await mkdtemp(path.join(os.tmpdir(), 'nocobase-node-'));
  try {
    await writeFile(path.join(work, archive), bytes);
    await runCommand('tar', ['-xzf', archive, `${name}/bin/node`], {
      cwd: work,
      log: options.log,
    });
    await mkdir(path.dirname(cached), { recursive: true });
    await rename(path.join(work, name, 'bin', 'node'), `${cached}.partial`);
    await rename(`${cached}.partial`, cached);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
  return cached;
}

interface ProductManifest {
  schema: 1;
  product: string;
  bin: string;
  versions: Record<
    string,
    {
      builtAt: string;
      node: string;
      targets: Record<string, PackedTarget>;
    }
  >;
}

/** Checks what was asked before anything is built. */
export function checkPackOptions(
  options: Pick<
    CliPackOptions,
    'channel' | 'targets' | 'version' | 'nodeVersion'
  >,
): void {
  const usage = (message: string): CommandError =>
    new CommandError(message, { code: 'INVALID_USAGE', exit: 2 });
  if (!CHANNEL.test(options.channel))
    throw usage(`Not a channel name: ${options.channel}`);
  if (options.targets.length === 0) throw usage('Name at least one target.');
  for (const target of options.targets)
    if (!TARGET.test(target))
      throw usage(
        `Not a target: ${target}. Targets are ${CLI_TARGETS.join(', ')}.`,
      );
  if (options.version !== undefined && !VERSION.test(options.version))
    throw usage(`Not a version: ${options.version}`);
  if (!/^\d+\.\d+\.\d+$/u.test(options.nodeVersion))
    throw usage(`Not a Node.js version: ${options.nodeVersion}`);
}

/** Packs the application's CLI, or with `runner` the runner. */
export async function packCli(options: CliPackOptions): Promise<CliPackResult> {
  checkPackOptions(options);
  const { application, log } = options;
  const staging = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-'));
  try {
    const vendor = path.join(staging, 'vendor');
    await mkdir(vendor, { recursive: true });
    const root = path.join(staging, 'package');
    let bin: string;
    let manifest: PackageManifest;
    let linkedRoots: string[];

    if (options.runner) {
      bin = RUNNER_COMMAND;
      const runnerDir = findPackageDir(application.root, RUNNER_PACKAGE);
      if (runnerDir === undefined)
        throw new CommandError(
          `${RUNNER_PACKAGE} is not installed in this application.`,
          {
            code: 'CLI_PACKAGE_MISSING',
            suggestions: [
              `Add ${RUNNER_PACKAGE} to devDependencies and install, then build again.`,
            ],
          },
        );
      if (isLinked(runnerDir)) {
        const packed = await packLinked(runnerDir, staging, options);
        await unpackPackage(path.join(staging, packed), root, log);
        await rm(path.join(staging, packed));
      } else
        await cp(runnerDir, root, {
          recursive: true,
          filter: (source) => path.basename(source) !== 'node_modules',
        });
      manifest = await readManifest(root);
      linkedRoots = [runnerDir];
    } else {
      const brand = application.brand;
      if (brand === undefined)
        throw new CommandError('package.json has no nocobase.cli.', {
          code: 'CLI_NOT_DECLARED',
        });
      bin = brand.bin;
      const clientDir = findPackageDir(application.root, CLIENT_PACKAGE);
      if (clientDir === undefined)
        throw new CommandError(
          `${CLIENT_PACKAGE} is not installed in this application.`,
          {
            code: 'CLI_PACKAGE_MISSING',
            suggestions: [
              `Add ${CLIENT_PACKAGE} to devDependencies and install, then build again.`,
            ],
          },
        );
      const client = await readManifest(clientDir);
      await mkdir(path.join(root, 'bin'), { recursive: true });
      await writeFile(path.join(root, 'bin', 'run.js'), cliEntry(bin, false));
      await chmod(path.join(root, 'bin', 'run.js'), 0o755);
      const files = ['bin'];
      if (brand.skills !== undefined && brand.skills.length > 0) {
        const skillsDir = path.join(root, 'skills');
        await mkdir(skillsDir, { recursive: true });
        const slugs = await copySkills(
          application.root,
          brand.skills,
          skillsDir,
        );
        log(`Skills: ${slugs.join(', ')}`);
        files.push('skills');
      }
      const clientRange = isLinked(clientDir)
        ? `file:vendor/${await packLinked(clientDir, vendor, options)}`
        : (client.version ?? '*');
      manifest = {
        name: `${bin}-cli`,
        version: brand.version ?? application.version,
        description:
          brand.description ??
          `The ${brand.displayName ?? bin} command line, packaged by nocobase cli build.`,
        type: 'module',
        license: 'UNLICENSED',
        engines: { node: '>=24.0.0' },
        bin: { [bin]: './bin/run.js' },
        files,
        dependencies: { [CLIENT_PACKAGE]: clientRange },
        nocobase: { cli: runtimeBrand(brand) },
      };
      linkedRoots = [clientDir];
    }

    const version = options.version ?? manifest.version ?? '0.0.0';
    if (!VERSION.test(version))
      throw new CommandError(`Not a version: ${version}`, {
        code: 'INVALID_USAGE',
        exit: 2,
      });

    // Every linked package the tree needs travels as a file, listed at the top level so that npm installs a vendored
    // package's own workspace dependencies from the vendored files rather than looking for them in a registry.
    const vendored = await vendorLinked(linkedRoots, vendor, options);
    manifest.dependencies ??= {};
    for (const [name, file] of vendored)
      manifest.dependencies[name] = `file:vendor/${file}`;
    manifest.version = version;
    manifest.files = [...new Set([...(manifest.files ?? []), 'vendor'])];
    delete manifest.devDependencies;
    delete manifest.private;
    manifest.scripts = {};
    await cp(vendor, path.join(root, 'vendor'), { recursive: true });
    await writeJson(path.join(root, 'package.json'), manifest);

    await runCommand(
      'npm',
      [
        'install',
        '--omit=dev',
        '--omit=optional',
        '--omit=peer',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
      ],
      { cwd: root, log },
    );
    if (!existsSync(path.join(root, 'bin', 'run.js')))
      throw new CommandError(`The ${bin} package has no bin/run.js.`, {
        code: 'CLI_BUILD_STEP_FAILED',
      });

    const productDir = path.join(
      path.resolve(options.out),
      options.channel,
      bin,
    );
    const versionDir = path.join(productDir, version);
    await rm(versionDir, { recursive: true, force: true });
    await mkdir(versionDir, { recursive: true });
    const cacheDir = path.join(
      application.root,
      'node_modules',
      '.cache',
      'nocobase-cli',
      'node',
    );
    const targets: Record<string, PackedTarget> = {};
    for (const target of options.targets) {
      const tree = path.join(staging, 'targets', target);
      const top = path.join(tree, bin);
      await cp(root, top, { recursive: true, verbatimSymlinks: true });
      await rm(path.join(top, 'vendor'), { recursive: true, force: true });
      const node = await nodeBinary(options.nodeVersion, target, {
        cacheDir,
        hostNode: options.hostNode,
        log,
      });
      await copyFile(node, path.join(top, 'bin', 'node'));
      await chmod(path.join(top, 'bin', 'node'), 0o755);
      await writeFile(path.join(top, 'bin', bin), launcherScript(bin));
      await chmod(path.join(top, 'bin', bin), 0o755);
      const name = `${bin}-v${version}-${target}.tar.gz`;
      const file = path.join(versionDir, name);
      await runCommand('tar', ['-czf', file, '-C', tree, bin], {
        cwd: tree,
        log,
      });
      targets[target] = {
        file: `${version}/${name}`,
        sha256: await sha256Of(file),
        size: (await stat(file)).size,
      };
      await rm(tree, { recursive: true, force: true });
    }

    const manifestFile = path.join(productDir, 'manifest.json');
    let stored: ProductManifest = {
      schema: 1,
      product: bin,
      bin,
      versions: {},
    };
    if (existsSync(manifestFile)) {
      const previous = JSON.parse(
        await readFile(manifestFile, 'utf8'),
      ) as Partial<ProductManifest>;
      if (previous.product === bin && previous.versions !== undefined)
        stored = { ...stored, versions: previous.versions };
    }
    stored.versions[version] = {
      builtAt: new Date().toISOString(),
      node: options.nodeVersion,
      targets,
    };
    await writeJson(manifestFile, stored);
    log(
      `Packed ${bin} ${version} for ${options.targets.join(', ')} into ${versionDir}`,
    );
    return {
      product: bin,
      version,
      channel: options.channel,
      node: options.nodeVersion,
      dir: productDir,
      manifest: manifestFile,
      targets,
    };
  } finally {
    if (options.keepStaging) log(`Staging kept at ${staging}`);
    else await rm(staging, { recursive: true, force: true });
  }
}
