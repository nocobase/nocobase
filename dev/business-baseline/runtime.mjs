import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  realpath,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { assertPrivateBoundary, privateRootFor } from './isolation.mjs';

export const sourceCommit = '4c89e3cdd540965552834837313f47d4e0af8795';
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (repo, args) =>
  execFileSync(
    'git',
    repo === root
      ? args
      : [
          '--no-optional-locks',
          `--git-dir=${path.join(root, '.git')}`,
          `--work-tree=${repo}`,
          ...args,
        ],
    {
      cwd: repo,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    },
  );
const sourcePaths = [
  'packages',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
];

// Only dependency artifacts and public package source are inventoried; never application configuration or storage.
export async function treeHashes(directory) {
  const result = {};
  const walk = async (directory, prefix = '') => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      (error) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    for (let start = 0; start < entries.length; start += 16)
      await Promise.all(
        entries.slice(start, start + 16).map(async (entry) => {
          if (
            ['.git', '.cache', '.vite', '.vite-temp'].includes(entry.name) ||
            /^(?:\.env(?:\.|$)|\.npmrc$|\.netrc$|credentials$|config\.yml$)|\.(?:pem|key|p12)$/.test(
              entry.name,
            )
          )
            return;
          const name = prefix + entry.name;
          const file = path.join(directory, entry.name);
          if (entry.isSymbolicLink())
            result[name] = hash('symlink:' + (await readlink(file)));
          else if (entry.isDirectory()) await walk(file, name + '/');
          else result[name] = hash(await readFile(file));
        }),
      );
  };
  await walk(directory);
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function compareRuntime(actual, expected) {
  for (const key of [
    'sourceCommit',
    'lockSha256',
    'installedLockSha256',
    'sourceChanges',
    'resolutions',
    'artifacts',
  ])
    assert(
      isDeepStrictEqual(actual[key], expected[key]),
      `Runtime resource drift: ${key}`,
    );
}

async function sourceChanges(repo, round, approved) {
  const changed = git(repo, [
    'diff',
    '--name-only',
    sourceCommit,
    '--',
    ...sourcePaths,
    ':(exclude)**/.npmrc',
  ])
    .trim()
    .split('\n')
    .filter(Boolean);
  const added = git(repo, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    ...sourcePaths,
    ':(exclude)**/.npmrc',
  ])
    .trim()
    .split('\n')
    .filter(Boolean);
  const names = [...new Set([...changed, ...added])].sort();
  const result = {};
  for (const file of names) {
    assert(
      round === 'after' &&
        (file.startsWith('packages/app/app-skills/skills/') ||
          file.startsWith('packages/templates/app-template-examples/')),
      `Unregistered runtime source change: ${file}`,
    );
    const registration = approved?.changes?.[file];
    assert(
      registration?.reason && /^[a-f0-9]{64}$/.test(registration.sha256),
      `Resource change needs an exact reviewed hash: ${file}`,
    );
    const actual = hash(await readFile(path.join(repo, file)));
    assert.equal(
      actual,
      registration.sha256,
      `Unregistered resource bytes: ${file}`,
    );
    result[file] = actual;
  }
  assert.deepEqual(
    names,
    Object.keys(approved?.changes ?? {}).sort(),
    'Registered resource changes differ from actual changes',
  );
  return result;
}

async function resolutions(appRoot, resourceRoot) {
  const result = {};
  const dependencies = path.join(appRoot, 'node_modules');
  for (const entry of await readdir(dependencies)) {
    if (entry.startsWith('.')) continue;
    const names = entry.startsWith('@')
      ? (await readdir(path.join(dependencies, entry))).map(
          (name) => `${entry}/${name}`,
        )
      : [entry];
    for (const name of names) {
      const resolved = await realpath(path.join(dependencies, name));
      assert(
        resolved.startsWith(resourceRoot + path.sep),
        `Dependency resolves outside this checkout: ${name}`,
      );
      const manifest = JSON.parse(
        await readFile(path.join(resolved, 'package.json')),
      );
      result[name] = {
        path: path.relative(resourceRoot, resolved),
        name: manifest.name,
        version: manifest.version,
      };
    }
  }
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export async function captureRuntime(
  appRoot,
  round = 'before',
  approved = {},
  resourceRoot = root,
) {
  assert(['before', 'after'].includes(round));
  const changes = await sourceChanges(resourceRoot, round, approved);
  const lockSha256 = hash(
    await readFile(path.join(resourceRoot, 'pnpm-lock.yaml')),
  );
  assert.equal(
    lockSha256,
    hash(
      Buffer.from(
        execFileSync('git', ['show', `${sourceCommit}:pnpm-lock.yaml`], {
          cwd: root,
          maxBuffer: 8 * 1024 * 1024,
        }),
      ),
    ),
    'Repository lockfile drift',
  );
  const installedLockSha256 = hash(
    await readFile(path.join(resourceRoot, 'node_modules/.pnpm/lock.yaml')),
  );
  assert.equal(
    installedLockSha256,
    lockSha256,
    'Installed lockfile differs from frozen lockfile',
  );
  const artifacts = {
    external: await treeHashes(path.join(resourceRoot, 'node_modules/.pnpm')),
  };
  // Workspace exports sometimes resolve to generated dist instead of TypeScript (notably dev-config).
  const manifests = git(root, [
    'ls-tree',
    '-r',
    '--name-only',
    sourceCommit,
    '--',
    'packages',
  ])
    .trim()
    .split('\n')
    .filter((name) => /^packages\/[^/]+\/[^/]+\/package\.json$/.test(name));
  for (const manifest of manifests) {
    const directory = path.dirname(manifest);
    const hashes = await treeHashes(path.join(resourceRoot, directory, 'dist'));
    if (Object.keys(hashes).length) artifacts[directory + '/dist'] = hashes;
    const links = await treeHashes(
      path.join(resourceRoot, directory, 'node_modules'),
    );
    if (Object.keys(links).length)
      artifacts[directory + '/node_modules'] = links;
  }
  return {
    sourceCommit,
    lockSha256,
    installedLockSha256,
    sourceChanges: changes,
    resolutions: await resolutions(appRoot, resourceRoot),
    artifacts,
  };
}

export async function checkSyncedSkills(appRoot) {
  const application = JSON.parse(
    await readFile(path.join(appRoot, 'package.json')),
  );
  const packages = [
    ...new Set(
      Object.keys({
        ...application.dependencies,
        ...application.devDependencies,
        ...application.optionalDependencies,
      }),
    ),
  ]
    .filter((name) => name.startsWith('@nocobase/'))
    .sort();
  const expectedOwners = {};
  for (const name of packages) {
    const packageRoot = path.join(appRoot, 'node_modules', name);
    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, 'package.json')),
    );
    if (manifest.nocobase?.cli) continue;
    const entries = await readdir(path.join(packageRoot, 'skills'), {
      withFileTypes: true,
    }).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    for (const entry of entries)
      if (entry.isDirectory()) {
        assert(
          !expectedOwners[entry.name],
          `Duplicate upstream Skill: ${entry.name}`,
        );
        expectedOwners[entry.name] = name;
      }
  }
  const owners = JSON.parse(
    await readFile(path.join(appRoot, '.agents/.skills-sync.json')),
  );
  assert.deepEqual(owners, expectedOwners, 'Installed Skill ownership drift');
  assert.deepEqual(
    (await readdir(path.join(appRoot, '.agents/skills'))).sort(),
    Object.keys(owners).sort(),
    'Unexpected installed Skill',
  );
  const result = {};
  for (const [name, owner] of Object.entries(owners)) {
    const source = path.join(appRoot, 'node_modules', owner, 'skills', name);
    const target = path.join(appRoot, '.agents/skills', name);
    assert(
      (await lstat(target)).isDirectory(),
      'Installed Skill must be a local copy',
    );
    const expected = await treeHashes(source);
    // The synchronizer excludes nested dependencies from distributed examples.
    for (const file of Object.keys(expected))
      if (file.split('/').includes('node_modules')) delete expected[file];
    const actual = await treeHashes(target);
    assert.deepEqual(actual, expected, `Synchronized Skill drift: ${name}`);
    result[name] = hash(JSON.stringify(actual));
  }
  return result;
}

export async function verifyRuntime(appRoot, profileName) {
  assert(['before', 'after'].includes(profileName));
  const bytes = await readFile(
    path.join(root, '.business-baseline', `runtime-${profileName}.json`),
  );
  const profile = JSON.parse(bytes);
  const privateRoot = await privateRootFor(appRoot, root);
  assert(
    privateRoot || path.resolve(appRoot).startsWith(root + path.sep),
    'External applications require a private runtime identity',
  );
  if (privateRoot) {
    const identity = JSON.parse(
      await readFile(path.join(privateRoot, '.baseline-private.json')),
    );
    assert.equal(
      identity.profileSha256,
      hash(bytes),
      'Private runtime profile changed',
    );
    await assertPrivateBoundary(privateRoot);
  }
  compareRuntime(
    await captureRuntime(
      appRoot,
      profileName,
      profile.approved,
      privateRoot ?? root,
    ),
    profile.runtime,
  );
  return {
    round: profileName,
    profileSha256: hash(bytes),
    packages: Object.keys(profile.runtime.resolutions).length,
    artifactFiles: Object.values(profile.runtime.artifacts).reduce(
      (sum, files) => sum + Object.keys(files).length,
      0,
    ),
  };
}

async function main() {
  const [command, round, registration] = process.argv.slice(2);
  assert(
    ['bind', 'check'].includes(command) && ['before', 'after'].includes(round),
    'Usage: node dev/business-baseline/runtime.mjs bind before | bind after <reviewed-changes.json> | check <before|after> [application-directory]',
  );
  const appRoot =
    command === 'check' && registration
      ? path.resolve(registration)
      : path.join(root, 'packages/templates/app-template-default');
  const output = path.join(root, '.business-baseline', `runtime-${round}.json`);
  if (command === 'bind') {
    const approved =
      round === 'after' ? JSON.parse(await readFile(registration)) : {};
    if (round === 'after') {
      assert.equal(
        approved.beforeProfileSha256,
        hash(
          await readFile(
            path.join(root, '.business-baseline/runtime-before.json'),
          ),
        ),
        'After changes must identify the frozen before profile',
      );
    } else assert.equal(registration, undefined);
    const runtime = await captureRuntime(appRoot, round, approved);
    if (round === 'after') {
      const before = JSON.parse(
        await readFile(
          path.join(root, '.business-baseline/runtime-before.json'),
        ),
      );
      compareRuntime(
        { ...runtime, sourceChanges: before.runtime.sourceChanges },
        before.runtime,
      );
    }
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(
      output,
      JSON.stringify({ round, approved, runtime }, null, 2) + '\n',
      { flag: 'wx' },
    );
  }
  console.log(JSON.stringify(await verifyRuntime(appRoot, round)));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
