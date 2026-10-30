import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  realpath,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const inside = (root, file) =>
  file === root || file.startsWith(root + path.sep);
const secret = (name) =>
  /^(?:\.env(?:\.|$)|\.npmrc$|\.netrc$|credentials$|config\.yml$)|\.(?:pem|key|p12)$/.test(
    name,
  );

export const privateRuntimeBase = (sourceRoot) =>
  path.join(path.dirname(path.resolve(sourceRoot)), '.business-baseline');

export async function assertAncestorModulesAbsent(root) {
  const checked = [];
  let ancestor = path.dirname(path.resolve(root));
  for (;;) {
    const modules = path.join(ancestor, 'node_modules');
    const entry = await lstat(modules).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return undefined;
    });
    assert(!entry, `Ancestor node_modules must be absent: ${modules}`);
    checked.push(modules);
    if (path.dirname(ancestor) === ancestor) return checked;
    ancestor = path.dirname(ancestor);
  }
}

// Copy only enumerated public sources/dependencies. Never traverse an installation or a task directory.
export async function copyEntry(sourceRoot, targetRoot, name, expectedHash) {
  assert(!path.isAbsolute(name) && !name.split('/').includes('..'));
  assert(!name.split('/').some(secret), `Excluded private file: ${name}`);
  const source = path.join(sourceRoot, name);
  const target = path.join(targetRoot, name);
  const info = await lstat(source);
  let ancestor = path.dirname(target);
  while (
    !(await lstat(ancestor).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return undefined;
    }))
  )
    ancestor = path.dirname(ancestor);
  assert(
    inside(await realpath(targetRoot), await realpath(ancestor)),
    `Escaping destination parent: ${name}`,
  );
  await mkdir(path.dirname(target), { recursive: true });
  if (info.isSymbolicLink()) {
    const link = await readlink(source);
    assert(!path.isAbsolute(link), `Absolute dependency link: ${name}`);
    assert(
      inside(targetRoot, path.resolve(path.dirname(target), link)),
      `Escaping dependency link: ${name}`,
    );
    assert(
      !expectedHash || hash('symlink:' + link) === expectedHash,
      `Frozen dependency link changed: ${name}`,
    );
    await symlink(link, target);
  } else {
    assert(info.isFile(), `Expected a file: ${name}`);
    // copyFile creates a separate inode even when the input is hard-linked to pnpm's store.
    await copyFile(source, target, constants.COPYFILE_EXCL);
    await chmod(target, info.mode & 0o777);
    assert.equal(
      (await lstat(target)).nlink,
      1,
      `Hard-linked dependency: ${name}`,
    );
    assert(
      !expectedHash || hash(await readFile(target)) === expectedHash,
      `Frozen dependency bytes changed: ${name}`,
    );
  }
}

export async function assertPrivateBoundary(root) {
  root = path.resolve(root);
  assert.equal(await realpath(root), root, 'Private root must not redirect');
  const ancestorModules = await assertAncestorModulesAbsent(root);
  let files = 0;
  let links = 0;
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (let start = 0; start < entries.length; start += 24) {
      await Promise.all(
        entries.slice(start, start + 24).map(async (entry) => {
          const file = path.join(directory, entry.name);
          if (entry.isSymbolicLink()) {
            const link = await readlink(file);
            assert(!path.isAbsolute(link), `Absolute private link: ${file}`);
            assert(
              inside(root, await realpath(file)),
              `Private link escapes: ${file}`,
            );
            links++;
          } else if (entry.isDirectory()) await walk(file);
          else {
            assert.equal(
              (await lstat(file)).nlink,
              1,
              `Hard-linked private file: ${file}`,
            );
            files++;
          }
        }),
      );
    }
  }
  await walk(root);
  return { files, links, ancestorModules };
}

export async function privateRootFor(appRoot, sourceRoot) {
  sourceRoot = path.resolve(sourceRoot);
  const base = privateRuntimeBase(sourceRoot);
  assert(
    !inside(path.join(sourceRoot, '.business-baseline'), path.resolve(appRoot)),
    'Checkout-nested runtimes must remain archived; prepare an external private root',
  );
  let candidate = path.resolve(appRoot);
  while (inside(base, candidate) && candidate !== base) {
    const marker = path.join(candidate, '.baseline-private.json');
    if (await lstat(marker).catch(() => null)) {
      assert.equal(path.dirname(candidate), base);
      assert(path.basename(candidate).startsWith('private-'));
      const identity = JSON.parse(await readFile(marker, 'utf8'));
      assert.equal(
        identity.root,
        candidate,
        'Private runtime moved without a new boundary check',
      );
      assert.equal(path.resolve(identity.sourceRoot), sourceRoot);
      await assertAncestorModulesAbsent(candidate);
      return candidate;
    }
    candidate = path.dirname(candidate);
  }
  return undefined;
}

export function isolatedEnvironment(environment, sourceRoot) {
  sourceRoot = path.resolve(sourceRoot);
  const result = { ...environment };
  for (const name of [
    'NODE_PATH',
    'NOCOBASE_TOOL_ROOT',
    'INIT_CWD',
    'PNPM_SCRIPT_SRC_DIR',
  ])
    delete result[name];
  result.PATH = (result.PATH ?? '')
    .split(path.delimiter)
    .filter((entry) => !inside(sourceRoot, entry))
    .join(path.delimiter);
  // pnpm's frozen shims contain absolute NODE_PATH fallbacks. Keep their bytes, but disable those fallbacks natively.
  result.NODE_OPTIONS = '--no-global-search-paths';
  result.NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD = '1';
  return result;
}

export async function preparePrivateRuntime({
  sourceRoot,
  targetRoot,
  sourceCommit,
  profileBytes,
}) {
  sourceRoot = path.resolve(sourceRoot);
  targetRoot = path.resolve(targetRoot);
  assert.equal(path.dirname(targetRoot), privateRuntimeBase(sourceRoot));
  assert(path.basename(targetRoot).startsWith('private-'));
  await assertAncestorModulesAbsent(targetRoot);
  assert(
    !(await lstat(targetRoot).catch(() => null)),
    'Private runtime already exists; preserve its source/evidence',
  );
  assert.equal(
    await realpath(path.dirname(targetRoot)),
    path.dirname(targetRoot),
  );
  const profile = JSON.parse(profileBytes);
  assert.equal(profile.runtime.sourceCommit, sourceCommit);
  await mkdir(targetRoot);
  const git = (args) =>
    execFileSync('git', args, {
      cwd: sourceRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  const sources = git([
    'ls-tree',
    '-rz',
    sourceCommit,
    '--',
    'packages',
    'scripts',
    'ui-library',
    'docs/package.json',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    '.gitignore',
    '.editorconfig',
    'eslint.config.js',
    '.prettierignore',
  ])
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const [metadata, name] = entry.split('\t');
      const [mode, type, object] = metadata.split(' ');
      assert.equal(type, 'blob');
      return { mode, object, name };
    })
    .filter(({ name }) => !secret(path.posix.basename(name)));
  const selected = sources.filter(
    ({ name }) => !profile.approved?.changes?.[name],
  );
  for (const { mode, name } of selected) {
    if (mode !== '120000') continue;
    const link = git(['show', `${sourceCommit}:${name}`]);
    assert(
      !path.isAbsolute(link) &&
        inside(
          targetRoot,
          path.resolve(path.dirname(path.join(targetRoot, name)), link),
        ),
      `Escaping source link: ${name}`,
    );
  }
  // Stream the selected public Git blobs; do not buffer a repository archive or copy untracked runtime files.
  const archive = spawn(
    'git',
    [
      'archive',
      '--format=tar',
      sourceCommit,
      '--',
      ...selected.map(({ name }) => name),
    ],
    { cwd: sourceRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const extract = spawn(
    'tar',
    ['-xf', '-', '--no-same-owner', '-C', targetRoot],
    { stdio: ['pipe', 'ignore', 'inherit'] },
  );
  const finished = (child) =>
    new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Private source copy exited ${code}`)),
      );
    });
  archive.stdout.pipe(extract.stdin);
  try {
    await Promise.all([finished(archive), finished(extract)]);
  } catch (error) {
    archive.kill();
    extract.kill();
    throw error;
  }
  for (const [name, registration] of Object.entries(
    profile.approved?.changes ?? {},
  )) {
    assert(
      name.startsWith('packages/app/app-skills/skills/') ||
        name.startsWith('packages/templates/app-template-examples/'),
    );
    await copyEntry(sourceRoot, targetRoot, name, registration.sha256);
  }
  let artifactFiles = 0;
  for (const [directory, files] of Object.entries(profile.runtime.artifacts)) {
    const prefix = directory === 'external' ? 'node_modules/.pnpm' : directory;
    const entries = Object.entries(files);
    for (let start = 0; start < entries.length; start += 16) {
      await Promise.all(
        entries
          .slice(start, start + 16)
          .map(([name, expected]) =>
            copyEntry(sourceRoot, targetRoot, prefix + '/' + name, expected),
          ),
      );
      artifactFiles += entries.slice(start, start + 16).length;
    }
  }
  // Root command resolution needs the root manifest's explicit dependencies, not the rest of node_modules.
  const manifest = JSON.parse(
    await readFile(path.join(targetRoot, 'package.json')),
  );
  const dependencies = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
  });
  for (const name of dependencies)
    await copyEntry(sourceRoot, targetRoot, 'node_modules/' + name);
  for (const entry of await readdir(path.join(sourceRoot, 'node_modules/.bin')))
    await copyEntry(sourceRoot, targetRoot, 'node_modules/.bin/' + entry);
  await mkdir(path.join(targetRoot, '.business-baseline'));
  await writeFile(
    path.join(
      targetRoot,
      '.business-baseline',
      `runtime-${profile.round}.json`,
    ),
    profileBytes,
    { flag: 'wx' },
  );
  const receipt = {
    root: targetRoot,
    sourceRoot,
    sourceCommit,
    profileSha256: hash(profileBytes),
    publicSourceFiles: sources.length,
    artifactFiles,
    copyMethod: 'copyFile (independent inodes), relative symlinks only',
    environment: {
      NODE_OPTIONS: '--no-global-search-paths',
      NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD: '1',
    },
    boundary: await assertPrivateBoundary(targetRoot),
  };
  await writeFile(
    path.join(targetRoot, '.baseline-private.json'),
    JSON.stringify(receipt, null, 2) + '\n',
    { flag: 'wx' },
  );
  return receipt;
}
