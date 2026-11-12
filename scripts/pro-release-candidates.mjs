// Find the joint beta release candidates in nocobase/nocobase3-pro and decide which are still in flight.
//
// Usage, from a Pro checkout whose `origin` can read (check) or write (prune) the Pro repository:
//   node pro-release-candidates.mjs check
//   node pro-release-candidates.mjs prune --keep release-candidate/<YYYY-MM-DD.N>
//
// v3-release-beta.yml pushes the tested Pro tree to release-candidate/<OSS batch> before the open-source packages are published, and its pro-release job publishes that commit, tags it release-beta/<batch>, merges it into Pro develop, and only then deletes the branch. A candidate is therefore in flight until both have happened: a release-beta/* tag points at its commit, and Pro develop contains it. Until then, its run may still publish Pro, so:
//
// - `check` is the first step of the standalone Pro beta and promotion workflows. It fails when a candidate is in flight, because a Pro release of its own would publish the same versions or take the same release-beta/* name.
// - `prune` runs in pro-candidate just before it pushes a new candidate, and deletes the candidates that are no longer in flight, other than the one named by --keep.
//
// A candidate older than 30 days is stale either way: GitHub re-runs a workflow run only within 30 days of it, so its run can no longer publish anything. `check` ignores it with a warning and `prune` deletes it. Only branches named release-candidate/<YYYY-MM-DD.N> are considered; anything else under release-candidate/ is left alone.
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const candidatePattern =
  /^refs\/heads\/(release-candidate\/\d{4}-\d{2}-\d{2}\.\d+)$/u;
export const staleAfterSeconds = 30 * 24 * 3600;

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

// Every release-candidate/<batch> branch on origin, with what decides whether it is still in flight.
export function listCandidates({
  cwd = process.cwd(),
  now = Date.now() / 1000,
} = {}) {
  git(
    cwd,
    'fetch',
    '--quiet',
    '--force',
    'origin',
    '+refs/tags/release-beta/*:refs/tags/release-beta/*',
    '+refs/heads/develop:refs/remotes/origin/develop',
  );
  const heads = git(
    cwd,
    'ls-remote',
    '--heads',
    'origin',
    'refs/heads/release-candidate/*',
  );
  const candidates = [];
  for (const line of heads.split('\n').filter(Boolean)) {
    const [sha, ref] = line.split('\t');
    const branch = candidatePattern.exec(ref)?.[1];
    if (!branch) {
      console.log(`Leaving ${ref}: not a release candidate name.`);
      continue;
    }
    git(
      cwd,
      'fetch',
      '--quiet',
      '--no-tags',
      'origin',
      `+${ref}:refs/pro-candidates/${branch}`,
    );
    const tags = git(cwd, 'tag', '--points-at', sha, '-l', 'release-beta/*')
      .split('\n')
      .filter(Boolean);
    const merged =
      spawnSync(
        'git',
        ['merge-base', '--is-ancestor', sha, 'refs/remotes/origin/develop'],
        { cwd },
      ).status === 0;
    const committed = Number(git(cwd, 'log', '-1', '--format=%ct', sha));
    candidates.push({
      branch,
      sha,
      tags,
      merged,
      committed,
      released: tags.length > 0 && merged,
      stale: now - committed > staleAfterSeconds,
    });
  }
  return candidates;
}

function describe({ branch, sha, tags, committed }) {
  const created = new Date(committed * 1000).toISOString();
  const state =
    tags.length > 0
      ? `tagged ${tags.join(', ')} but not merged into Pro develop yet`
      : 'not published yet';
  return `${branch} (${sha.slice(0, 12)}, created ${created}): ${state}`;
}

export function checkNoCandidateInFlight(options) {
  const candidates = listCandidates(options);
  for (const candidate of candidates.filter(
    ({ released, stale }) => !released && stale,
  )) {
    console.log(
      `::warning::Ignoring ${describe(candidate)}. It is older than 30 days, so its V3 Release Beta run can no longer be re-run; delete the branch once you have confirmed it.`,
    );
  }
  const inFlight = candidates.filter(
    ({ released, stale }) => !released && !stale,
  );
  if (inFlight.length === 0) {
    console.log('No joint beta release is in flight.');
    return;
  }
  const lines = [
    'A joint NocoBase 3 beta release (V3 Release Beta) is still in flight in nocobase/nocobase3-pro, so this Pro release would publish the same versions or take the same release-beta name:',
    ...inFlight.map((candidate) => `  ${describe(candidate)}`),
    'Finish that release first: open its V3 Release Beta run and use "Re-run failed jobs"; it publishes the candidate, merges it into Pro develop, and deletes the branch. If that run will never be resumed, delete the branch (git push origin --delete <branch>) and start this workflow again. Candidates older than 30 days are ignored, because their runs can no longer be re-run.',
  ];
  throw new Error(lines.join('\n'));
}

export function pruneCandidates({ keep, ...options }) {
  for (const candidate of listCandidates(options)) {
    const { branch, sha, released, stale } = candidate;
    if (branch === keep) continue;
    if (!released && !stale) {
      console.log(
        `Keeping ${describe(candidate)}; its run can still be re-run.`,
      );
      continue;
    }
    git(
      options.cwd ?? process.cwd(),
      'push',
      '--quiet',
      `--force-with-lease=refs/heads/${branch}:${sha}`,
      'origin',
      `:refs/heads/${branch}`,
    );
    console.log(
      `Deleted ${branch}: ${released ? 'published and merged into Pro develop' : 'its run can no longer be re-run'}.`,
    );
  }
}

if (import.meta.main) {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === 'check' && rest.length === 0) {
      checkNoCandidateInFlight();
    } else if (
      command === 'prune' &&
      rest[0] === '--keep' &&
      /^release-candidate\/\S+$/u.test(rest[1] ?? '') &&
      rest.length === 2
    ) {
      pruneCandidates({ keep: rest[1] });
    } else {
      throw new Error(
        'Usage: pro-release-candidates.mjs check | prune --keep release-candidate/<batch>',
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split('\n')) console.log(`::error::${line}`);
    process.exitCode = 1;
  }
}
