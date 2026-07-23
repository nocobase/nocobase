#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

function fail(message) {
  throw new Error(message);
}

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) fail(result.stderr.trim() || `git ${args.join(' ')} failed`);
  return result.stdout.trim();
}

function requireSha(value, label) {
  if (typeof value !== 'string' || !SHA_PATTERN.test(value)) {
    fail(`${label} must be a lowercase 40-character Git object id`);
  }
  return value;
}

async function readManifest(file) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(`Cannot read integration manifest ${file}: ${error.message}`);
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || manifest.schemaVersion !== 1) {
    fail('Integration manifest must be a schemaVersion 1 object');
  }
  return manifest;
}

function verifyObject(sha, tree, label) {
  git(['cat-file', '-e', `${sha}^{commit}`]);
  const actualTree = git(['rev-parse', `${sha}^{tree}`]);
  if (actualTree !== tree) fail(`${label} tree mismatch: expected ${tree}, got ${actualTree}`);
}

function isAncestor(ancestor, descendant) {
  return spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant]).status === 0;
}

function validateTopology(manifest) {
  const identities = {};
  for (const ref of ['latestNext', 'cleanupBefore', 'task05DecisionInput', 'cleanupAfterCode']) {
    identities[ref] = {
      sha: requireSha(manifest[`${ref}Sha`], `${ref}Sha`),
      tree: requireSha(manifest[`${ref}Tree`], `${ref}Tree`),
    };
    verifyObject(identities[ref].sha, identities[ref].tree, ref);
  }
  if (!Array.isArray(manifest.cleanupCommits) || manifest.cleanupCommits.length === 0) {
    fail('cleanupCommits must be a non-empty ordered array');
  }
  const commits = manifest.cleanupCommits.map((value, index) => {
    const sha = requireSha(typeof value === 'string' ? value : value?.sha, `cleanupCommits[${index}].sha`);
    const tree = typeof value === 'object' && value ? value.tree : undefined;
    if (tree !== undefined) verifyObject(sha, requireSha(tree, `cleanupCommits[${index}].tree`), `cleanupCommits[${index}]`);
    return sha;
  });
  if (new Set(commits).size !== commits.length) fail('cleanupCommits contains duplicate commits');
  let previous = identities.cleanupBefore.sha;
  for (const [index, commit] of commits.entries()) {
    const parents = git(['rev-list', '--parents', '-n', '1', commit]).split(/\s+/u).slice(1);
    if (parents.length !== 1 || parents[0] !== previous) {
      fail(`cleanupCommits[${index}] must be the next commit on a linear first-parent chain`);
    }
    previous = commit;
  }
  if (previous !== identities.cleanupAfterCode.sha) fail('cleanupCommits must end at cleanupAfterCodeSha');
  if (!isAncestor(identities.latestNext.sha, identities.cleanupBefore.sha)) {
    fail('latestNextSha must be an ancestor of cleanupBeforeSha');
  }
  if (!isAncestor(identities.cleanupBefore.sha, identities.task05DecisionInput.sha)) {
    fail('task05DecisionInputSha must descend from cleanupBeforeSha');
  }
  if (!isAncestor(identities.task05DecisionInput.sha, identities.cleanupAfterCode.sha)) {
    fail('task05DecisionInputSha must be an ancestor of cleanupAfterCodeSha');
  }
  if (
    identities.task05DecisionInput.sha === identities.cleanupBefore.sha ||
    identities.task05DecisionInput.sha === identities.cleanupAfterCode.sha ||
    !commits.includes(identities.task05DecisionInput.sha)
  ) {
    fail('task05DecisionInputSha must be an intermediate commit in cleanupCommits');
  }
  return identities;
}

function parseArguments(argv) {
  const options = {};
  const names = new Set(['--manifest', '--before', '--after', '--next', '--task05-decision']);
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!names.has(name) || !value || value.startsWith('--')) fail(`Invalid or missing value for ${name || 'argument'}`);
    options[name.slice(2)] = value;
  }
  for (const name of names) {
    if (!options[name.slice(2)]) fail(`${name} is required`);
  }
  return options;
}

async function assertPathAbsent(target) {
  try {
    await access(target);
    fail(`Worktree target already exists: ${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const manifest = await readManifest(options.manifest);
  const identities = validateTopology(manifest);
  const worktrees = [
    [options.next, identities.latestNext.sha],
    [options.before, identities.cleanupBefore.sha],
    [options['task05-decision'], identities.task05DecisionInput.sha],
    [options.after, identities.cleanupAfterCode.sha],
  ];
  await Promise.all(worktrees.map(([target]) => assertPathAbsent(path.resolve(target))));
  for (const [target, sha] of worktrees) git(['worktree', 'add', '--detach', path.resolve(target), sha]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
