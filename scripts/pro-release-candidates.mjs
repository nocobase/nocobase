// Find the joint beta release candidates in nocobase/nocobase3-pro and decide which are still in flight.
//
// Usage, from a Pro checkout whose `origin` can read (check) or write (prune) the Pro repository:
//   node pro-release-candidates.mjs check
//   node pro-release-candidates.mjs prune --keep release-candidate/<YYYY-MM-DD.N>
//   node pro-release-candidates.mjs prune --keep release-candidate/<YYYY-MM-DD.N> --superseded
//
// v3-release-beta.yml pushes the tested Pro tree to release-candidate/<OSS batch> before the open-source packages are published, and its pro-release job publishes that commit, tags it release-beta/<batch>, merges it into Pro develop, and only then deletes the branch. A candidate is therefore in flight until both have happened: a release-beta/* tag points at its commit, and Pro develop contains it. Until then, its run may still publish Pro, so:
//
// - `check` is the first step of the standalone Pro beta and promotion workflows. It fails when a candidate is in flight, because a Pro release of its own would publish the same versions or take the same release-beta/* name.
// - `prune` runs in pro-candidate just before it pushes a new candidate, and deletes the candidates that are no longer in flight, other than the one named by --keep.
// - `prune --superseded` runs in pro-release once this run's Pro beta is published. It also deletes every other candidate no release-beta/* tag points at: such a candidate is left by a run that failed before publishing, typically in its open-source jobs, and can no longer be resumed, because its pro-release refuses to publish once a Pro beta its develop did not contain was released, which this one just was. A candidate a release-beta/* tag points at was published and still waits for its merge back, so it is kept.
//
// pro-candidate records the URL of the V3 Release Beta run that pushed a candidate in its commit message (`OSS-Run: <url>`), so `check` can link each blocking candidate to its run.
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
    const run = git(
      cwd,
      'log',
      '-1',
      '--format=%(trailers:key=OSS-Run,valueonly,separator=%x20)',
      sha,
    );
    candidates.push({
      branch,
      sha,
      tags,
      merged,
      committed,
      run,
      released: tags.length > 0 && merged,
      stale: now - committed > staleAfterSeconds,
    });
  }
  return candidates;
}

function describe({ branch, sha, tags, committed, run }) {
  const created = new Date(committed * 1000).toISOString();
  const state =
    tags.length > 0
      ? `tagged ${tags.join(', ')} but not merged into Pro develop yet`
      : 'not published yet';
  const origin = run
    ? `created by ${run}`
    : 'created by a V3 Release Beta run it does not record';
  return `${branch} (${sha.slice(0, 12)}, created ${created}, ${origin}): ${state}`;
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
    'Finish that release first: open its V3 Release Beta run, linked above, and use "Re-run failed jobs"; it publishes the candidate, merges it into Pro develop, and deletes the branch. If that run is truly abandoned, delete its branch in nocobase/nocobase3-pro and start this workflow again:',
    ...inFlight.map(
      ({ branch }) =>
        `  git push https://github.com/nocobase/nocobase3-pro.git --delete ${branch}`,
    ),
    'or delete it on https://github.com/nocobase/nocobase3-pro/branches. Candidates older than 30 days are ignored, because their runs can no longer be re-run.',
  ];
  throw new Error(lines.join('\n'));
}

export function pruneCandidates({ keep, superseded = false, ...options }) {
  for (const candidate of listCandidates(options)) {
    const { branch, sha, tags, released, stale } = candidate;
    if (branch === keep) continue;
    const abandoned = superseded && tags.length === 0;
    if (!released && !stale && !abandoned) {
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
    const reason = released
      ? 'published and merged into Pro develop'
      : stale
        ? 'its run can no longer be re-run'
        : `never published, and superseded by the Pro beta this run released (${describe(candidate)})`;
    console.log(`Deleted ${branch}: ${reason}.`);
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
      candidatePattern.test(`refs/heads/${rest[1] ?? ''}`) &&
      (rest.length === 2 || (rest.length === 3 && rest[2] === '--superseded'))
    ) {
      pruneCandidates({ keep: rest[1], superseded: rest.length === 3 });
    } else {
      throw new Error(
        'Usage: pro-release-candidates.mjs check | prune --keep release-candidate/<YYYY-MM-DD.N> [--superseded]',
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split('\n')) console.log(`::error::${line}`);
    process.exitCode = 1;
  }
}
