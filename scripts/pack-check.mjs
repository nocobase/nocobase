import { execFile, spawn } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

export function archiveNameForPackage(packageName) {
  return `${packageName.replace(/^@/u, '').replaceAll('/', '-')}.tgz`;
}

export function findUnresolvedProtocols(value, fieldPath = []) {
  if (typeof value === 'string') {
    return /^(?:workspace|catalog):/u.test(value)
      ? [{ field: fieldPath.join('.'), value }]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findUnresolvedProtocols(item, [...fieldPath, String(index)]),
    );
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      findUnresolvedProtocols(item, [...fieldPath, key]),
    );
  }

  return [];
}

export function hasTypeEntrypoints(manifest) {
  if (typeof manifest.types === 'string') return true;

  const visit = (value) => {
    if (!value || typeof value !== 'object') return false;
    if (!Array.isArray(value) && typeof value.types === 'string') return true;
    return Object.values(value).some(visit);
  };

  return visit(manifest.exports);
}

// Compiled packages publish runtime resources in dist and resolve them from the plugin's baseDir.
// Keep source directories out of these packages, preserving the publish contract that also protects older runtimes
// which search package-root resources first. Templates publish source instead of dist and are exempt.
const RUNTIME_RESOLVED_SOURCE_DIRECTORIES = ['database', 'server'];

export function findShadowedSourceDirectories(manifest) {
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.includes('dist')) return [];
  return RUNTIME_RESOLVED_SOURCE_DIRECTORIES.filter((directoryName) =>
    files.includes(directoryName),
  );
}

export function validatePackageManifest(manifest, directory) {
  const errors = [];

  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    errors.push('name must be a non-empty string');
  }
  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    errors.push('version must be a non-empty string');
  }
  if (manifest.private === true) {
    errors.push('packages/ packages must not be private');
  }
  if (manifest.publishConfig?.access !== 'public') {
    errors.push('publishConfig.access must be "public"');
  }
  if (
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0 ||
    manifest.files.some((file) => typeof file !== 'string' || file.length === 0)
  ) {
    errors.push('files must be a non-empty array of strings');
  }

  for (const directoryName of findShadowedSourceDirectories(manifest)) {
    errors.push(
      `files must not publish the "${directoryName}" source directory beside dist; compiled runtime resources belong in dist`,
    );
  }

  // A subpath present in `exports` but absent from `publishConfig.exports` resolves in this repository, where source
  // exports are used, and fails only once the package is installed from a registry: Node reports
  // ERR_PACKAGE_PATH_NOT_EXPORTED for a subpath the source tree clearly has. `@nocobase/app-server` shipped without
  // `./i18n` exactly this way, and a generated application could not start.
  const sourceExports = manifest.exports;
  const publishExports = manifest.publishConfig?.exports;

  if (
    sourceExports &&
    publishExports &&
    typeof sourceExports === 'object' &&
    typeof publishExports === 'object'
  ) {
    const missing = Object.keys(sourceExports).filter(
      (subpath) => !(subpath in publishExports),
    );
    const extra = Object.keys(publishExports).filter(
      (subpath) => !(subpath in sourceExports),
    );

    if (missing.length > 0) {
      errors.push(
        `publishConfig.exports is missing ${missing.join(', ')}, which exports declares`,
      );
    }
    if (extra.length > 0) {
      errors.push(
        `publishConfig.exports declares ${extra.join(', ')}, which exports does not`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid publish metadata in ${path.join(directory, 'package.json')}:\n${errors
        .map((error) => `  - ${error}`)
        .join('\n')}`,
    );
  }
}

// packages/ groups its packages one level deep, as packages/<category>/<package>. The category directories themselves
// carry no package.json, so publishable packages are found by descending into each of them. Reading only the top level
// would discover nothing and let `pnpm pack:check` pass without checking anything.
async function listPackageDirectories(packagesDirectory) {
  const categories = await readdir(packagesDirectory, { withFileTypes: true });
  const directories = [];

  for (const category of categories) {
    if (!category.isDirectory()) continue;
    const categoryDirectory = path.join(packagesDirectory, category.name);
    for (const entry of await readdir(categoryDirectory, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      directories.push(path.join(categoryDirectory, entry.name));
    }
  }

  return directories;
}

export async function discoverPackages(repoRoot) {
  const packagesDirectory = path.join(repoRoot, 'packages');
  const directories = await listPackageDirectories(packagesDirectory);
  const packages = [];

  for (const directory of directories) {
    const manifestPath = path.join(directory, 'package.json');
    let manifest;

    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }

    validatePackageManifest(manifest, directory);

    try {
      const changelog = await readFile(
        path.join(directory, 'CHANGELOG.md'),
        'utf8',
      );
      if (!changelog.startsWith(`# ${manifest.name}\n`)) {
        throw new Error(
          `${manifest.name} CHANGELOG.md must start with "# ${manifest.name}".`,
        );
      }
      if (
        manifest.version !== '0.0.0' &&
        !changelog.includes(`## ${manifest.version}\n`)
      ) {
        throw new Error(
          `${manifest.name} CHANGELOG.md must include version ${manifest.version}.`,
        );
      }
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`${manifest.name} must include CHANGELOG.md.`, {
          cause: error,
        });
      }
      throw error;
    }

    packages.push({ directory, manifest });
  }

  return packages.sort((left, right) =>
    left.manifest.name.localeCompare(right.manifest.name),
  );
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve({ stderr, stdout });
        return;
      }

      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.${output ? `\n${output}` : ''}`,
        ),
      );
    });
  });
}

export async function readPackedManifest(archivePath) {
  const { stdout } = await execFileAsync('tar', [
    '-xOf',
    archivePath,
    'package/package.json',
  ]);
  return JSON.parse(stdout);
}

export function validatePackedManifest(sourceManifest, packedManifest) {
  if (
    packedManifest.name !== sourceManifest.name ||
    packedManifest.version !== sourceManifest.version
  ) {
    throw new Error(
      `Packed identity mismatch for ${sourceManifest.name}: expected ${sourceManifest.name}@${sourceManifest.version}, received ${packedManifest.name}@${packedManifest.version}.`,
    );
  }

  const unresolved = findUnresolvedProtocols(packedManifest);
  if (unresolved.length === 0) return;

  throw new Error(
    `Unresolved workspace/catalog protocols in ${sourceManifest.name}:\n${unresolved
      .map(({ field, value }) => `  ${field}: ${value}`)
      .join('\n')}`,
  );
}

async function smokeTestDevConfig(archivePath, packageDirectory) {
  const extractDirectory = await mkdtemp(
    path.join(packageDirectory, '.pack-check-'),
  );

  try {
    await execFileAsync('tar', ['-xzf', archivePath, '-C', extractDirectory]);

    for (const entry of [
      'eslint/index.js',
      'prettier/index.js',
      'vitest/node.js',
      'vitest/react.js',
      'vite/app.js',
      'database/database-manifests.js',
    ]) {
      await import(
        pathToFileURL(path.join(extractDirectory, 'package', 'dist', entry))
          .href
      );
    }
  } finally {
    await rm(extractDirectory, { force: true, recursive: true });
  }
}

// A `prepack` script chains the steps a package needs before it can be packed, typically `pnpm registry:build &&
// pnpm build`. When the workspace has just been built, the build half repeats work already on disk: in a release it
// recompiled fourteen packages one at a time. Prebuilt mode keeps every other step and drops only the build.
export function prepackStepsWithoutBuild(prepack) {
  if (typeof prepack !== 'string' || prepack.trim().length === 0) return [];
  return prepack
    .split('&&')
    .map((step) => step.trim())
    .filter((step) => step.length > 0 && !/^pnpm (?:run )?build$/u.test(step));
}

async function runPrepackWithoutBuild({ directory, manifest }, env) {
  for (const step of prepackStepsWithoutBuild(manifest.scripts?.prepack)) {
    await run('sh', ['-c', step], { cwd: directory, env });
  }

  // Skipping the build is only safe when the build already ran. Without this, a package whose dist is missing would
  // pack an archive holding nothing but its manifest, and publint would not notice every such case.
  if (Array.isArray(manifest.files) && manifest.files.includes('dist')) {
    try {
      await access(path.join(directory, 'dist'));
    } catch {
      throw new Error(
        `${manifest.name} has no dist directory. Run pnpm build before pack:check with PACK_CHECK_PREBUILT=1.`,
      );
    }
  }
}

async function checkPackage({
  archivePath,
  packageInfo,
  prebuilt,
  repoRoot,
  env,
}) {
  const { directory, manifest } = packageInfo;

  await rm(archivePath, { force: true });
  if (prebuilt) {
    await runPrepackWithoutBuild(packageInfo, env);
    await run(
      'pnpm',
      ['pack', '--out', archivePath, '--config.ignore-scripts=true'],
      { cwd: directory, env },
    );
  } else {
    await run('pnpm', ['pack', '--out', archivePath], {
      cwd: directory,
      env,
    });
  }

  const packedManifest = await readPackedManifest(archivePath);
  validatePackedManifest(manifest, packedManifest);
  await run('pnpm', ['exec', 'publint', 'run', archivePath], {
    cwd: repoRoot,
    env,
  });

  if (hasTypeEntrypoints(packedManifest)) {
    await run('pnpm', ['exec', 'attw', archivePath, '--profile', 'esm-only'], {
      cwd: repoRoot,
      env,
    });
  }

  if (manifest.name === '@nocobase/dev-config') {
    await smokeTestDevConfig(archivePath, directory);
  }
}

// Only prebuilt mode runs in parallel by default. Otherwise every prepack rebuilds its package, and builds share
// state: @nocobase/dev-config clears its dist before rebuilding it while other packages' builds run its
// nocobase-db-manifests binary from there.
export function resolveConcurrency(value, { prebuilt = false } = {}) {
  if (value === undefined || value.trim() === '') {
    return prebuilt ? availableParallelism() : 1;
  }
  const concurrency = Number(value);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(
      `PACK_CHECK_CONCURRENCY must be a positive integer, received ${JSON.stringify(value)}.`,
    );
  }
  return concurrency;
}

// Runs `task` over `items` with at most `concurrency` in flight. The first failure stops new tasks from starting and
// is rethrown once the tasks already running have settled, so no child process outlives the check.
export async function mapWithConcurrency(items, concurrency, task) {
  let next = 0;
  let failure;

  async function worker() {
    while (failure === undefined && next < items.length) {
      const index = next;
      next += 1;
      try {
        await task(items[index], index);
      } catch (error) {
        failure ??= { error };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  if (failure !== undefined) throw failure.error;
}

export async function packCheck({
  env = process.env,
  repoRoot = path.resolve(import.meta.dirname, '..'),
} = {}) {
  const packages = await discoverPackages(repoRoot);
  const configuredDirectory = env.PACK_DIR?.trim();
  const packDirectory = configuredDirectory
    ? path.resolve(configuredDirectory)
    : await mkdtemp(path.join(tmpdir(), 'nocobase-pack-check-'));
  const checkEnv = { ...env, PACK_DIR: packDirectory };
  const prebuilt = env.PACK_CHECK_PREBUILT === '1';
  const concurrency = resolveConcurrency(env.PACK_CHECK_CONCURRENCY, {
    prebuilt,
  });

  await mkdir(packDirectory, { recursive: true });
  console.log(
    `Checking ${packages.length} publishable packages with concurrency ${concurrency}${
      prebuilt ? ', reusing the existing build' : ''
    }...`,
  );

  try {
    let completed = 0;
    await mapWithConcurrency(packages, concurrency, async (packageInfo) => {
      const { name } = packageInfo.manifest;
      const archivePath = path.join(packDirectory, archiveNameForPackage(name));

      try {
        await checkPackage({
          archivePath,
          env: checkEnv,
          packageInfo,
          prebuilt,
          repoRoot,
        });
      } catch (error) {
        console.log(`${name} ... failed`);
        throw new Error(`Pack check failed for ${name}.`, { cause: error });
      }
      completed += 1;
      console.log(`[${completed}/${packages.length}] ${name} ... ok`);
    });

    console.log(`Pack checks passed for ${packages.length} packages.`);
  } finally {
    if (!configuredDirectory) {
      await rm(packDirectory, { force: true, recursive: true });
    }
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  await packCheck();
}
