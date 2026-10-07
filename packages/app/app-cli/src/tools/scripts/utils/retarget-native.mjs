// Replaces the native binaries in `dist/node_modules` with the ones the deployment target needs.
//
// A `.node` file is compiled for one platform, architecture, C library, and Node ABI at once. A build made on a
// Mac for a Linux server therefore installs the wrong binary in every case, and the failure is a loader error at
// startup naming a file rather than a cause. This obtains the right one at build time, so the deployment stays a
// directory to copy rather than something to install and compile on the server.
//
// Which packages need it is decided by manifest signal rather than by name, so an application that adds a native
// dependency this repository has never seen is retargeted without anyone extending a list. See `server-deps.mjs`.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  findBinaries,
  findNativeModules,
  formatMegabytes,
  parseTarget,
  readJson,
  sizeOf,
} from './server-deps.mjs';

const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const distDir = path.join(rootDir, 'dist');
const nodeModulesDir = path.join(distDir, 'node_modules');

const target = parseTarget(process.argv.slice(2));

if (!fs.existsSync(nodeModulesDir)) {
  console.error('Missing dist/node_modules. Run pnpm build first.');
  process.exit(1);
}

/**
 * Records what the build targeted, so a binary that turns out to be wrong is diagnosable by comparing this with
 * the server rather than leaving a loader error that names a file and no cause. Written for a current-machine
 * build too — with that the default, it is the build most likely to reach the wrong server.
 */
function recordBuildTarget() {
  const distPackagePath = path.join(distDir, 'package.json');
  if (!fs.existsSync(distPackagePath)) return;
  const distPackage = readJson(distPackagePath);
  distPackage.nocobase = {
    ...distPackage.nocobase,
    buildTarget: {
      platform: target.platform,
      arch: target.arch,
      libc: target.libc,
      nodeAbi: target.abi,
      nodeMajor: target.nodeMajor,
    },
  };
  fs.writeFileSync(
    distPackagePath,
    `${JSON.stringify(distPackage, null, 2)}\n`,
  );
}

if (target.isCurrentMachine) {
  recordBuildTarget();
  // Said on every build, not only when it is wrong: the default produces binaries for this machine, so a
  // deployment build that forgot --target looks identical to a successful one until it reaches the server.
  console.log(
    `Native modules target this machine (${target.label}, Node ${target.nodeMajor}, ABI ${target.abi}).`,
  );
  console.log(
    'Deploying elsewhere? Rebuild with --target linux-x64 (or linux-arm64, linux-x64-musl) and --node-version.',
  );
  process.exit(0);
}

console.log(
  `Retargeting native modules for ${target.label} (Node ${target.nodeMajor}, ABI ${target.abi}).`,
);

/**
 * Packages `dist/pnpm-workspace.yaml` sets to `false` under `allowBuilds`. The build generates that file, so the
 * block is read line by line rather than with a YAML parser the deployment tree does not carry.
 */
function readSkippedBuilds() {
  const workspacePath = path.join(distDir, 'pnpm-workspace.yaml');
  const skipped = new Set();
  if (!fs.existsSync(workspacePath)) return skipped;
  let inAllowBuilds = false;
  for (const line of fs.readFileSync(workspacePath, 'utf8').split(/\r?\n/u)) {
    if (/^\S/u.test(line)) {
      inAllowBuilds = /^allowBuilds:\s*$/u.test(line);
      continue;
    }
    if (!inAllowBuilds) continue;
    const entry = /^\s+(['"]?)([^'"\s:#][^'":#]*)\1:\s*false\s*(#.*)?$/u.exec(
      line,
    );
    if (entry) skipped.add(entry[2].trim());
  }
  return skipped;
}

/**
 * A package whose install script `allowBuilds` skips never ran it, so it holds only the binaries it was published
 * with. Its install script says nothing about what reached the deployment, so it is classified by those binaries
 * instead: better-sqlite3's bundled prebuilds are still trimmed to the target's, and a package that ships none,
 * such as cpu-features, has no compiled addon to retarget and is left as installed.
 */
function classifySkipped(native) {
  if (native.kind !== 'fetched-at-install') return native;
  const count = native.binaries.length;
  if (count === 0) return { ...native, kind: 'skipped-build' };
  return {
    ...native,
    kind: count > 1 ? 'bundled-multi-platform' : 'bundled-single-platform',
  };
}

const skippedBuilds = readSkippedBuilds();
const natives = findNativeModules(nodeModulesDir).map((native) =>
  skippedBuilds.has(native.manifest.name) ? classifySkipped(native) : native,
);
if (natives.length === 0) {
  recordBuildTarget();
  console.log('No native modules found. This build is portable as it stands.');
  process.exit(0);
}

/** Runs a command and returns its result rather than throwing, so one failure can be reported in context. */
const run = (command, args, options = {}) =>
  spawnSync(command, args, { encoding: 'utf8', ...options });

let failures = 0;

/**
 * Re-fetches a package whose install script downloads a prebuilt binary.
 *
 * `prebuild-install` accepts the target explicitly, which is what makes a cross-platform build possible at all:
 * it downloads the published artifact for the requested platform instead of building for the current one. The
 * `--libc` flag matters as much as the architecture — a glibc binary on Alpine fails to load.
 */
function retargetFetched(native) {
  const args = [
    '--platform',
    target.platform,
    '--arch',
    target.arch,
    '--target',
    target.nodeVersion,
  ];
  if (target.libc === 'musl') args.push('--libc', 'musl');

  // Fetched with `npx --yes` rather than `pnpm exec`: prebuild-install is a transitive dependency of whichever
  // package uses it, and pruning removes it along with everything else the server never loads, so it is not
  // resolvable from the deployment tree by the time this runs. Run with the package as the working directory,
  // because prebuild-install reads the manifest it is installing for from there.
  const result = run('npx', ['--yes', 'prebuild-install', ...args], {
    cwd: native.packageDir,
  });

  if (result.status === 0) {
    console.log(`  ${native.manifest.name}: downloaded ${target.label} binary`);
    return true;
  }

  console.error(
    `  ${native.manifest.name}: no prebuilt binary for ${target.label} (Node ABI ${target.abi}).`,
  );
  console.error(
    `    ${(result.stderr || result.stdout || '').trim().split('\n').slice(-2).join('\n    ')}`,
  );
  return false;
}

/**
 * The names the target's member of a platform set may be published under, most likely first. Most sets follow the
 * napi-rs suffixes (`linux-x64-gnu`, `win32-x64-msvc`); some name only the platform and architecture, as sqlite-vec
 * does (`sqlite-vec-linux-x64`, `sqlite-vec-windows-x64`), which then means glibc on Linux.
 */
function platformPackageCandidates(base, target) {
  const names = [`${base}-${target.napiSuffix}`];
  if (target.platform === 'linux' && target.libc !== 'musl')
    names.push(`${base}-linux-${target.arch}`);
  if (target.platform === 'win32')
    names.push(
      `${base}-win32-${target.arch}`,
      `${base}-windows-${target.arch}`,
    );
  return [...new Set(names)];
}

/**
 * Swaps a platform-specific package for the target's member of the same set.
 *
 * These packages are the binary: `@napi-rs/canvas-darwin-arm64` and `@napi-rs/canvas-linux-x64-gnu` are separate
 * npm packages, and the parent picks one through `optionalDependencies`. Fetching the right one is an ordinary
 * download, so `npm pack` is enough and no build step is involved.
 *
 * When the set publishes no member for the target at all (npm answers 404 for every name), the stale package is
 * removed and the build goes on, as an install on that platform would leave the optional dependency out: the parent
 * then runs without it, which is its own decision to report. Any other failure to fetch still fails the build.
 */
function retargetPlatformPackage(native) {
  const currentName = native.manifest.name;
  // The set shares a prefix; the trailing platform segment is what differs.
  const base = currentName.replace(
    /-(darwin|linux|win32|windows|android)(-[a-z0-9]+)*(-(gnu|musl|msvc|gnueabihf))?$/u,
    '',
  );
  const candidates = platformPackageCandidates(base, target);

  if (candidates.includes(currentName)) {
    console.log(`  ${currentName}: already the ${target.label} build`);
    return true;
  }

  const parent = path.dirname(native.packageDir);
  const staging = path.join(
    parent,
    `.retarget-${path.basename(native.packageDir)}`,
  );

  let wanted;
  let unpublished = 0;
  for (const name of candidates) {
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });
    const packed = run('npm', ['pack', name, '--loglevel', 'error'], {
      cwd: staging,
    });
    if (packed.status === 0) {
      wanted = name;
      break;
    }
    if (/E404|404 Not Found/u.test(`${packed.stderr}${packed.stdout}`))
      unpublished += 1;
  }

  if (!wanted) {
    fs.rmSync(staging, { recursive: true, force: true });
    if (unpublished === candidates.length) {
      fs.rmSync(native.packageDir, { recursive: true, force: true });
      console.warn(
        `  ${currentName}: ${base} publishes no build for ${target.label}; removed, so it is absent there as an install would leave it.`,
      );
      return true;
    }
    console.error(
      `  ${currentName}: could not fetch ${candidates.join(' or ')} for ${target.label}.`,
    );
    return false;
  }

  const tarball = fs
    .readdirSync(staging)
    .find((entry) => entry.endsWith('.tgz'));
  if (!tarball) {
    console.error(`  ${currentName}: ${wanted} produced no tarball.`);
    fs.rmSync(staging, { recursive: true, force: true });
    return false;
  }

  run('tar', ['-xzf', tarball], { cwd: staging });
  const extracted = path.join(staging, 'package');
  if (!fs.existsSync(extracted)) {
    console.error(
      `  ${currentName}: ${wanted} tarball had no package directory.`,
    );
    fs.rmSync(staging, { recursive: true, force: true });
    return false;
  }

  // Installed under its own name, not the one being replaced. The parent selects among these packages by
  // requiring the name that matches the running platform, so a directory holding `@napi-rs/canvas-linux-x64-gnu`
  // under the name `canvas-darwin-arm64` satisfies a require for neither: the target's require misses it, and the
  // stale name resolves to a manifest declaring the wrong `cpu`/`os`.
  const installedAs = path.join(parent, wanted.split('/').pop());
  fs.rmSync(installedAs, { recursive: true, force: true });
  fs.renameSync(extracted, installedAs);
  fs.rmSync(native.packageDir, { recursive: true, force: true });
  fs.rmSync(staging, { recursive: true, force: true });

  console.log(`  ${currentName}: replaced with ${wanted}`);
  return true;
}

/**
 * Removes the binaries of every platform except the target's.
 *
 * A package shipping several is already correct for the target; the others are dead weight that a deployment
 * carries and never loads. Matching is by filename, and a binary whose name identifies no platform is kept —
 * deleting one that turns out to be the only usable build is far worse than shipping a few extra megabytes.
 */
function trimBundled(native) {
  // Bundled N-API addons such as better-sqlite3 13 name their Alpine builds linuxmusl, not linux.
  const platform =
    target.platform === 'linux' && target.libc === 'musl'
      ? 'linuxmusl'
      : target.platform;
  const wanted = `${platform}-${target.arch}`;
  let removed = 0;
  let removedBytes = 0;
  let keptAny = false;

  for (const binary of findBinaries(native.packageDir)) {
    const name = path.basename(binary);
    const namesAPlatform = /(darwin|linux|linuxmusl|win32|android)-/u.test(
      name,
    );
    if (!namesAPlatform || name.includes(wanted)) {
      keptAny = keptAny || name.includes(wanted);
      continue;
    }
    removedBytes += sizeOf(binary);
    fs.rmSync(binary, { force: true });
    removed += 1;
  }

  console.log(
    `  ${native.manifest.name}: kept the ${wanted} binary, removed ${removed} other(s) (${formatMegabytes(removedBytes)})`,
  );
  if (!keptAny && removed > 0) {
    console.error(
      `  ${native.manifest.name}: no binary named ${wanted} remained — verify this package supports the target.`,
    );
    return false;
  }
  return true;
}

for (const native of natives) {
  switch (native.kind) {
    case 'fetched-at-install':
      if (!retargetFetched(native)) failures += 1;
      break;
    case 'platform-package':
      if (!retargetPlatformPackage(native)) failures += 1;
      break;
    case 'bundled-multi-platform':
      if (!trimBundled(native)) failures += 1;
      break;
    case 'skipped-build':
      console.log(
        `  ${native.manifest.name}: build skipped by allowBuilds and no compiled addon shipped; left as installed`,
      );
      break;
    default:
      console.log(
        `  ${native.manifest.name}: one bundled binary and nothing to detect — verify by hand that it runs on ${target.label}.`,
      );
  }
}

recordBuildTarget();

if (failures > 0) {
  console.error(
    `\n${failures} native module(s) could not be retargeted for ${target.label}. The deployment would fail to start.`,
  );
  process.exit(1);
}
