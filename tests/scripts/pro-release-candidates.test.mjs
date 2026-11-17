import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve(
  import.meta.dirname,
  '../../scripts/pro-release-candidates.mjs',
);
const env = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 't',
  GIT_AUTHOR_EMAIL: 't@t',
  GIT_COMMITTER_NAME: 't',
  GIT_COMMITTER_EMAIL: 't@t',
};
const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();

// A Pro remote with develop, and a seed clone that creates candidates.
function proRemote(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'pro-candidates-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const remote = path.join(directory, 'remote.git');
  git(directory, 'init', '-q', '--bare', '-b', 'develop', remote);
  const seed = path.join(directory, 'seed');
  git(directory, 'init', '-q', '-b', 'develop', seed);
  git(seed, 'remote', 'add', 'origin', remote);
  writeFileSync(path.join(seed, 'package.json'), '{}\n');
  git(seed, 'add', '.');
  git(seed, 'commit', '-qm', 'init');
  git(seed, 'push', '-q', 'origin', 'develop');
  const develop = git(seed, 'rev-parse', 'HEAD');

  // A candidate commit on top of develop, pushed to `branch`; `date` backdates it.
  function candidate(branch, { date, tag, merge, runUrl } = {}) {
    git(seed, 'checkout', '-q', '--detach', develop);
    writeFileSync(path.join(seed, 'CHANGELOG.md'), `${branch}\n`);
    git(seed, 'add', '-A');
    const message = ['-m', `chore: release ${branch}`];
    if (runUrl) {
      message.push(
        '-m',
        `OSS-Release: nocobase-v3-beta/2026-11-11.1\nOSS-Run: ${runUrl}`,
      );
    }
    execFileSync('git', ['commit', '-q', ...message], {
      cwd: seed,
      env: date
        ? { ...env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date }
        : env,
    });
    const sha = git(seed, 'rev-parse', 'HEAD');
    git(seed, 'push', '-q', 'origin', `${sha}:refs/heads/${branch}`);
    if (tag) git(seed, 'push', '-q', 'origin', `${sha}:refs/tags/${tag}`);
    if (merge) {
      git(seed, 'fetch', '-q', 'origin', 'develop');
      git(seed, 'checkout', '-q', '-B', 'merge', 'origin/develop');
      git(seed, 'merge', '-q', '--no-ff', '--no-edit', sha);
      git(seed, 'push', '-q', 'origin', 'HEAD:refs/heads/develop');
    }
    return sha;
  }

  function run(...args) {
    const checkout = mkdtempSync(path.join(directory, 'run-'));
    git(directory, 'clone', '-q', remote, checkout);
    return spawnSync(process.execPath, [script, ...args], {
      cwd: checkout,
      env,
      encoding: 'utf8',
    });
  }

  const branches = () =>
    git(
      remote,
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/heads/release-candidate/',
    )
      .split('\n')
      .filter(Boolean)
      .sort();

  return { candidate, run, branches };
}

test('check passes without candidates, and with candidates that are published and merged, stale, or misnamed', (t) => {
  const { candidate, run } = proRemote(t);
  assert.equal(run('check').status, 0);
  candidate('release-candidate/2026-11-10.1', {
    tag: 'release-beta/2026-11-10.1',
    merge: true,
  });
  candidate('release-candidate/2026-09-01.1', {
    date: '2026-09-01T00:00:00Z',
  });
  candidate('release-candidate/manual');
  const result = run('check');
  assert.equal(result.status, 0, result.stdout);
  assert.match(
    result.stdout,
    /::warning::Ignoring release-candidate\/2026-09-01\.1 .*older than 30 days/u,
  );
});

test('check refuses while a candidate is unpublished, or published but not merged into Pro develop', (t) => {
  const { candidate, run } = proRemote(t);
  const runUrl = 'https://github.com/nocobase/nocobase/actions/runs/123456';
  candidate('release-candidate/2026-11-11.1', { runUrl });
  const unpublished = run('check');
  assert.equal(unpublished.status, 1);
  assert.match(
    unpublished.stdout,
    /::error::A joint NocoBase 3 beta release \(V3 Release Beta\) is still in flight/u,
  );
  assert.match(
    unpublished.stdout,
    /release-candidate\/2026-11-11\.1 \([0-9a-f]{12}, created [^,]+, created by https:\/\/github\.com\/nocobase\/nocobase\/actions\/runs\/123456\): not published yet/u,
  );
  assert.match(unpublished.stdout, /Re-run failed jobs/u);
  assert.match(
    unpublished.stdout,
    /::error:: {2}git push https:\/\/github\.com\/nocobase\/nocobase3-pro\.git --delete release-candidate\/2026-11-11\.1$/mu,
  );

  const tagged = proRemote(t);
  tagged.candidate('release-candidate/2026-11-11.2', {
    tag: 'release-beta/2026-11-11.2',
  });
  const unmerged = tagged.run('check');
  assert.equal(unmerged.status, 1);
  assert.match(
    unmerged.stdout,
    /created by a V3 Release Beta run it does not record\): tagged release-beta\/2026-11-11\.2 but not merged into Pro develop yet/u,
  );
});

test('prune deletes published-and-merged and expired candidates, keeping the current batch and live ones', (t) => {
  const { candidate, run, branches } = proRemote(t);
  candidate('release-candidate/2026-11-12.2');
  candidate('release-candidate/2026-11-10.1', {
    tag: 'release-beta/2026-11-10.1',
    merge: true,
  });
  candidate('release-candidate/2026-11-10.2', {
    tag: 'release-beta/2026-11-10.2',
  });
  candidate('release-candidate/2026-11-11.1');
  candidate('release-candidate/2026-09-01.1', {
    date: '2026-09-01T00:00:00Z',
  });
  candidate('release-candidate/2026-09-02.1', {
    date: '2026-09-02T00:00:00Z',
  });
  candidate('release-candidate/manual', { date: '2026-09-01T00:00:00Z' });

  const result = run('prune', '--keep', 'release-candidate/2026-09-02.1');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(branches(), [
    'release-candidate/2026-09-02.1',
    'release-candidate/2026-11-10.2',
    'release-candidate/2026-11-11.1',
    'release-candidate/2026-11-12.2',
    'release-candidate/manual',
  ]);
});

test('prune --superseded also deletes unpublished candidates of other batches, but keeps tagged ones and the current batch', (t) => {
  const { candidate, run, branches } = proRemote(t);
  candidate('release-candidate/2026-11-12.2');
  candidate('release-candidate/2026-11-11.1', {
    runUrl: 'https://github.com/nocobase/nocobase/actions/runs/1',
  });
  candidate('release-candidate/2026-11-10.2', {
    tag: 'release-beta/2026-11-10.2',
  });
  candidate('release-candidate/2026-11-10.1', {
    tag: 'release-beta/2026-11-10.1',
    merge: true,
  });
  candidate('release-candidate/manual');

  const result = run(
    'prune',
    '--keep',
    'release-candidate/2026-11-12.2',
    '--superseded',
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(
    result.stdout,
    /Deleted release-candidate\/2026-11-11\.1: never published, and superseded .*actions\/runs\/1\)/u,
  );
  assert.deepEqual(branches(), [
    'release-candidate/2026-11-10.2',
    'release-candidate/2026-11-12.2',
    'release-candidate/manual',
  ]);
});

test('rejects anything but check and prune --keep <candidate> [--superseded]', (t) => {
  const { run } = proRemote(t);
  for (const args of [
    [],
    ['prune'],
    ['prune', '--keep', 'develop'],
    ['prune', '--keep', 'release-candidate/2026-11-12.1', '--all'],
    ['check', 'x'],
  ]) {
    const result = run(...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.match(result.stdout, /::error::Usage/u);
  }
});
