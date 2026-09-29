import { execFile } from 'node:child_process';
import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const STATE_FILE = 'state.json';
const BUNDLE_FILE = 'candidate.bundle';
const STATE_SCHEMA = 1;
const ALLOWED_ARTIFACT_FILES = new Set([
  STATE_FILE,
  BUNDLE_FILE,
  'versions-before.json',
]);
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
const RELEASE_BRANCH_PATTERN = /^release(?:-beta)?\/(\d{4}-\d{2}-\d{2}\.\d+)$/u;

async function runGit(args, { cwd = process.cwd(), env = process.env } = {}) {
  try {
    return await execFileAsync('git', args, {
      cwd,
      env,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const output = [error.stdout?.trim(), error.stderr?.trim()]
      .filter(Boolean)
      .join('\n');
    throw new Error(
      `git ${args.join(' ')} failed.${output ? `\n${output}` : ''}`,
      { cause: error },
    );
  }
}

async function gitSucceeds(args, options) {
  try {
    await runGit(args, options);
    return true;
  } catch {
    return false;
  }
}

function validateSha(value, optionName) {
  if (!SHA_PATTERN.test(value)) {
    throw new Error(`${optionName} must be a full lowercase Git commit SHA.`);
  }
  return value;
}

function validateReleaseBranch(value) {
  const match = RELEASE_BRANCH_PATTERN.exec(value);
  if (!match) {
    throw new Error(
      '--branch must be release/<YYYY-MM-DD.N> or release-beta/<YYYY-MM-DD.N>.',
    );
  }
  return { batch: match[1], branch: value };
}

// Only the subject line is fixed, so merge-back and CI skipping can rely on it. Anything after it is free-form: the
// release workflows use the body to record the app template version.
export function validateReleaseMessage(message, batch) {
  const expected = `chore: release ${batch} [skip ci]`;
  if (message.split('\n')[0] !== expected) {
    throw new Error(
      `--message must start with the subject line ${JSON.stringify(expected)}.`,
    );
  }
  return message;
}

async function resolveRepositoryRoot(cwd) {
  const { stdout } = await runGit(['rev-parse', '--show-toplevel'], { cwd });
  const repoRoot = await realpath(stdout.trim());
  const workingDirectory = await realpath(cwd);
  if (repoRoot !== workingDirectory) {
    throw new Error('release-state must run from the checkout root.');
  }
  return repoRoot;
}

async function resolveArtifactDirectory(directory, repoRoot, { create }) {
  if (!path.isAbsolute(directory)) {
    throw new Error('--directory must be an absolute path.');
  }
  if (create) await mkdir(directory, { recursive: true });
  const resolvedDirectory = await realpath(directory);
  const relative = path.relative(repoRoot, resolvedDirectory);
  if (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  ) {
    throw new Error(
      'The release-state artifact directory must be outside the checkout.',
    );
  }
  return resolvedDirectory;
}

async function inspectArtifactDirectory(directory, { stateRequired }) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!ALLOWED_ARTIFACT_FILES.has(entry.name)) {
      throw new Error(
        `Unexpected release-state artifact entry: ${entry.name}. Use a dedicated directory.`,
      );
    }
    if (!entry.isFile()) {
      throw new Error(
        `Release-state artifact ${entry.name} must be a regular file.`,
      );
    }
  }
  if (stateRequired && !entries.some((entry) => entry.name === STATE_FILE)) {
    throw new Error(`Missing release-state artifact ${STATE_FILE}.`);
  }
  return new Set(entries.map((entry) => entry.name));
}

async function resolveCommit(sha, cwd) {
  const { stdout } = await runGit(
    ['rev-parse', '--verify', `${sha}^{commit}`],
    {
      cwd,
    },
  );
  return stdout.trim();
}

async function currentHead(cwd) {
  const { stdout } = await runGit(['rev-parse', '--verify', 'HEAD'], { cwd });
  return stdout.trim();
}

async function currentBranch(cwd) {
  const { stdout } = await runGit(
    ['symbolic-ref', '--quiet', '--short', 'HEAD'],
    { cwd },
  );
  return stdout.trim();
}

async function requireAncestor(base, source, cwd) {
  if (
    !(await gitSucceeds(['merge-base', '--is-ancestor', base, source], { cwd }))
  ) {
    throw new Error(`${base} is not an ancestor of ${source}.`);
  }
}

async function requireCleanWorktree(cwd) {
  const { stdout } = await runGit(
    ['status', '--porcelain=v1', '--untracked-files=all'],
    { cwd },
  );
  if (stdout) {
    throw new Error(
      `The restore checkout must be clean before release state is applied.\n${stdout.trimEnd()}`,
    );
  }
}

async function writeOutputs({ base, source }) {
  const hasChanges = source !== base;
  const lines = [
    `base_sha=${base}`,
    `source_sha=${source}`,
    `has_changes=${hasChanges}`,
  ];
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  }
  console.log(
    `Release state: ${base} -> ${source} (${hasChanges ? 'candidate changes' : 'no changes'})`,
  );
  return hasChanges;
}

export async function saveReleaseState({
  base,
  branch,
  directory,
  message,
  cwd = process.cwd(),
}) {
  validateSha(base, '--base');
  const { batch } = validateReleaseBranch(branch);
  validateReleaseMessage(message, batch);
  const repoRoot = await resolveRepositoryRoot(cwd);
  const artifactDirectory = await resolveArtifactDirectory(
    directory,
    repoRoot,
    { create: true },
  );
  await inspectArtifactDirectory(artifactDirectory, { stateRequired: false });
  await rm(path.join(artifactDirectory, STATE_FILE), { force: true });
  await rm(path.join(artifactDirectory, BUNDLE_FILE), { force: true });

  const resolvedBase = await resolveCommit(base, repoRoot);
  if (resolvedBase !== base) {
    throw new Error(`--base must name the exact commit ${resolvedBase}.`);
  }
  const headBefore = await currentHead(repoRoot);
  await requireAncestor(base, headBefore, repoRoot);

  const localBranchExists = await gitSucceeds(
    ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`],
    { cwd: repoRoot },
  );
  let activeBranch;
  try {
    activeBranch = await currentBranch(repoRoot);
  } catch {
    activeBranch = undefined;
  }
  if (localBranchExists && activeBranch !== branch) {
    throw new Error(
      `Local branch ${branch} already exists but is not the checked-out branch.`,
    );
  }
  if (!localBranchExists) {
    await runGit(['checkout', '-b', branch], { cwd: repoRoot });
  }

  await runGit(['add', '--all'], { cwd: repoRoot });
  const hasStagedChanges = !(await gitSucceeds(
    ['diff', '--cached', '--quiet'],
    {
      cwd: repoRoot,
    },
  ));
  if (hasStagedChanges) {
    await runGit(
      [
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '--no-gpg-sign',
        '-m',
        message,
      ],
      { cwd: repoRoot },
    );
  }

  const source = await currentHead(repoRoot);
  await requireAncestor(base, source, repoRoot);
  await requireCleanWorktree(repoRoot);
  const hasChanges = source !== base;
  const bundlePath = path.join(artifactDirectory, BUNDLE_FILE);
  if (hasChanges) {
    await runGit(
      ['bundle', 'create', bundlePath, `refs/heads/${branch}`, `^${base}`],
      { cwd: repoRoot },
    );
    await runGit(['bundle', 'verify', bundlePath], { cwd: repoRoot });
  }

  const state = {
    schema: STATE_SCHEMA,
    base,
    source,
    branch,
  };
  await writeFile(
    path.join(artifactDirectory, STATE_FILE),
    `${JSON.stringify(state, null, 2)}\n`,
    { flag: 'wx' },
  );
  await writeOutputs({ base, source });
  return { ...state, hasChanges };
}

function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('state.json must contain an object.');
  }
  const keys = Object.keys(state).sort();
  const expectedKeys = ['base', 'branch', 'schema', 'source'];
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error(
      'state.json must contain only schema, base, source, and branch.',
    );
  }
  if (state.schema !== STATE_SCHEMA) {
    throw new Error(`Unsupported release-state schema: ${state.schema}.`);
  }
  validateSha(state.base, 'state.base');
  validateSha(state.source, 'state.source');
  validateReleaseBranch(state.branch);
  return state;
}

export async function restoreReleaseState({
  base,
  branch,
  directory,
  expected,
  cwd = process.cwd(),
}) {
  validateSha(base, '--base');
  validateSha(expected, '--expected');
  validateReleaseBranch(branch);
  const repoRoot = await resolveRepositoryRoot(cwd);
  const artifactDirectory = await resolveArtifactDirectory(
    directory,
    repoRoot,
    { create: false },
  );
  const entries = await inspectArtifactDirectory(artifactDirectory, {
    stateRequired: true,
  });
  const state = validateState(
    JSON.parse(
      await readFile(path.join(artifactDirectory, STATE_FILE), 'utf8'),
    ),
  );
  if (state.base !== base) {
    throw new Error(`Release-state base ${state.base} does not match ${base}.`);
  }
  if (state.source !== expected) {
    throw new Error(
      `Release-state source ${state.source} does not match ${expected}.`,
    );
  }
  if (state.branch !== branch) {
    throw new Error(
      `Release-state branch ${state.branch} does not match ${branch}.`,
    );
  }

  const resolvedBase = await resolveCommit(base, repoRoot);
  if (resolvedBase !== base) {
    throw new Error(`--base must name the exact commit ${resolvedBase}.`);
  }
  const headBefore = await currentHead(repoRoot);
  if (headBefore !== base) {
    throw new Error(
      `Restore checkout HEAD is ${headBefore}; expected exact base ${base}.`,
    );
  }
  await requireCleanWorktree(repoRoot);

  const hasChanges = expected !== base;
  const hasBundle = entries.has(BUNDLE_FILE);
  if (hasChanges !== hasBundle) {
    throw new Error(
      hasChanges
        ? `Missing release-state artifact ${BUNDLE_FILE}.`
        : `Unexpected ${BUNDLE_FILE} for an unchanged release state.`,
    );
  }
  if (hasBundle) {
    const bundlePath = path.join(artifactDirectory, BUNDLE_FILE);
    await runGit(['bundle', 'verify', bundlePath], { cwd: repoRoot });
    await runGit(
      [
        'fetch',
        '--no-tags',
        '--no-write-fetch-head',
        bundlePath,
        `+refs/heads/${branch}:refs/release-state/candidate`,
      ],
      { cwd: repoRoot },
    );
    const fetchedSource = await resolveCommit(
      'refs/release-state/candidate',
      repoRoot,
    );
    if (fetchedSource !== expected) {
      throw new Error(
        `Bundle candidate is ${fetchedSource}; expected ${expected}.`,
      );
    }
  }

  const resolvedSource = await resolveCommit(expected, repoRoot);
  if (resolvedSource !== expected) {
    throw new Error(`--expected must name the exact commit ${resolvedSource}.`);
  }
  await requireAncestor(base, expected, repoRoot);
  await runGit(['checkout', '-B', branch, expected], { cwd: repoRoot });
  const restoredHead = await currentHead(repoRoot);
  if (restoredHead !== expected) {
    throw new Error(`Restored HEAD is ${restoredHead}; expected ${expected}.`);
  }
  await requireCleanWorktree(repoRoot);
  await requireAncestor(base, restoredHead, repoRoot);
  await writeOutputs({ base, source: restoredHead });
  return { ...state, hasChanges };
}

function parseArguments(args) {
  const command = args[0];
  if (!['restore', 'save'].includes(command)) {
    throw new Error('Usage: release-state.mjs <save|restore> [options]');
  }
  const options = {};
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const name = argument.slice(2);
    if (options[name] !== undefined) {
      throw new Error(`Duplicate option: ${argument}`);
    }
    const value = args[index + 1];
    if (!value) throw new Error(`${argument} requires a value.`);
    options[name] = value;
    index += 1;
  }

  const required =
    command === 'save'
      ? ['base', 'branch', 'directory', 'message']
      : ['base', 'branch', 'directory', 'expected'];
  const allowed = new Set(required);
  for (const name of required) {
    if (!options[name]) throw new Error(`--${name} is required.`);
  }
  for (const name of Object.keys(options)) {
    if (!allowed.has(name)) {
      throw new Error(`--${name} is not valid for ${command}.`);
    }
  }
  return { command, options };
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === 'save') await saveReleaseState(options);
  if (command === 'restore') await restoreReleaseState(options);
}
