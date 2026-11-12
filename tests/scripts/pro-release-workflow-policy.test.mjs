import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const proWorkflows = [
  'v3-pro-release-beta.yml',
  'v3-pro-release-stable.yml',
  'v3-pro-promote-to-stable.yml',
];

async function workflow(name) {
  return readFile(path.join(root, '.github/workflows', name), 'utf8');
}

// The jobs of the open-source beta release that check out and publish Pro.
const jointProJobs = ['pro-candidate', 'pro-release'];

async function jointProJob(job) {
  const source = await workflow('v3-release-beta.yml');
  const start = source.indexOf(`\n  ${job}:\n`);
  assert.notEqual(start, -1, job);
  const rest = source.slice(start + 1);
  const end = rest.slice(1).search(/\n  [a-z][\w-]*:\n/u);
  return end === -1 ? rest : rest.slice(0, end + 1);
}

async function proSources() {
  const sources = [];
  for (const name of proWorkflows) {
    sources.push([name, await workflow(name)]);
  }
  for (const job of jointProJobs) {
    sources.push([`v3-release-beta.yml#${job}`, await jointProJob(job)]);
  }
  return sources;
}

test('Pro workflows do not export commercial artifacts or caches', async () => {
  for (const [name, source] of await proSources()) {
    assert.doesNotMatch(source, /actions\/upload-artifact/u, name);
    assert.doesNotMatch(source, /^\s+cache:/mu, name);
    // The joint release reads the open-source release state and nothing else.
    for (const [download] of source.matchAll(
      /uses: actions\/download-artifact@v4\n\s+with:\n\s+name: [^\n]+/gu,
    )) {
      assert.match(download, /name: release-source-state$/u, name);
    }
    if (!name.includes('#')) {
      assert.doesNotMatch(source, /actions\/download-artifact/u, name);
    }
  }
});

test('the open-source beta publishes only after Pro passed with its release candidate', async () => {
  const source = await workflow('v3-release-beta.yml');
  const release = source
    .split('\n  release:\n')[1]
    .split(/\n  [a-z][\w-]*:\n/u)[0];
  assert.match(release, /needs: \[[^\]]*\bpro-candidate\b[^\]]*\]/u);
  assert.match(
    release,
    /\(needs\.pro-candidate\.result == 'success' \|\| \(inputs\.skip_pro && needs\.pro-candidate\.result == 'skipped'\)\)/u,
  );
  const candidate = await jointProJob('pro-candidate');
  assert.match(candidate, /if: '!inputs\.skip_pro'/u);
  assert.match(candidate, /uses: \.\/\.github\/actions\/verify-create-app/u);
  const publish = await jointProJob('pro-release');
  for (const condition of [
    '!inputs.dry_run',
    '!inputs.skip_pro',
    "needs.pro-candidate.outputs.release == 'true'",
    "needs.release.outputs.published == 'true'",
  ]) {
    assert.ok(publish.includes(condition), condition);
  }
  assert.match(publish, /group: pro-release-write/u);
});

test('Pro publishes the pushed candidate commit without regenerating it', async () => {
  const candidate = await jointProJob('pro-candidate');
  // The write token is minted only after every validation step.
  assert.ok(
    candidate.indexOf('uses: ./.github/actions/verify-create-app') <
      candidate.indexOf('id: pro_write_token'),
  );
  assert.match(candidate, /git push --force-with-lease=/u);
  assert.match(candidate, /BRANCH="release-candidate\/\$\{OSS_BATCH\}"/u);

  const publish = await jointProJob('pro-release');
  assert.match(
    publish,
    /ref: \$\{\{ needs\.pro-candidate\.outputs\.candidate_sha \}\}/u,
  );
  for (const regeneration of [
    'sync-release-oss.mjs --branch develop --candidate',
    'generate-oss-peer-changesets',
    'changeset version',
    '--no-frozen-lockfile',
  ]) {
    assert.ok(!publish.includes(regeneration), regeneration);
  }
  const publishing = publish.indexOf('publish-commercial-packages');
  for (const check of [
    'test "$(git rev-parse HEAD)" = "$CANDIDATE_SHA"',
    'test "$TAG_SHA" = "$GITLINK"',
    'pnpm install --frozen-lockfile',
    'Installing or building changed the tested candidate',
  ]) {
    const position = publish.indexOf(check);
    assert.notEqual(position, -1, check);
    assert.ok(position < publishing, check);
  }
  // The candidate branch goes only after the merge back keeps its commit reachable.
  assert.ok(
    publish.indexOf('gh pr merge') <
      publish.indexOf('- name: Delete the Pro release candidate branch'),
  );
});

// "Re-run failed jobs" reuses pro-candidate's outputs and never pushes its candidate again, so the candidate of a
// failed or cancelled run must survive until a rerun has merged it back.
test('only the merge back and the stale-candidate prune delete a release candidate', async () => {
  const source = await workflow('v3-release-beta.yml');
  const deletion = /--method DELETE|git push[^\n]*(?:--delete|\s":)/u;
  const steps = source.split(/\n(?=      - name: )/u);
  const deleting = steps
    .filter(
      (step) =>
        deletion.test(step) &&
        /release-candidate|candidate_branch|CANDIDATE/u.test(step),
    )
    .map((step) => step.match(/- name: ([^\n]+)/u)[1]);
  assert.deepEqual(deleting.sort(), [
    'Delete the Pro release candidate branch',
    'Prune stale Pro release candidates',
  ]);
  assert.equal(
    source.match(/- name: Delete the Pro release candidate branch/gu).length,
    1,
  );
  const publish = await jointProJob('pro-release');
  assert.ok(
    publish.indexOf('- name: Merge release metadata back into Pro develop') <
      publish.indexOf('- name: Delete the Pro release candidate branch'),
  );
  const candidate = await jointProJob('pro-candidate');
  assert.ok(
    candidate.indexOf('- name: Prune stale Pro release candidates') <
      candidate.indexOf('- name: Push the Pro release candidate'),
  );

  // Nothing that runs because of a failure or a cancellation touches a candidate.
  const jobs = source.split(/\n(?=  [a-z][\w-]*:\n)/u);
  for (const block of [...jobs, ...steps]) {
    const condition =
      block.match(/^\s*if: (?:>-\n(?:\s+[^\n]+\n)+|[^\n]+)/mu)?.[0] ?? '';
    if (!/failure\(\)|cancelled\(\)|always\(\)/u.test(condition)) continue;
    for (const stepBlock of block.split(/\n(?=      - name: )/u)) {
      const stepCondition =
        stepBlock === block
          ? condition
          : (stepBlock.match(/^\s*if: [^\n]+/mu)?.[0] ?? condition);
      if (!/failure\(\)|cancelled\(\)|always\(\)/u.test(stepCondition))
        continue;
      assert.doesNotMatch(
        stepBlock,
        /release-candidate|candidate_branch/u,
        stepBlock.slice(0, 200),
      );
    }
  }
});

test('every step that can write outside the runner is disabled for dry runs', async () => {
  const remoteMutation =
    /git push|gh pr (?:create|merge)|gh release (?:create|edit)|publish-commercial-packages|npm dist-tag add|permission-contents: write|feishu-notify\.sh/u;

  for (const [name, source] of await proSources()) {
    const steps = source.split(/\n(?=      - name: )/u);
    for (const step of steps.filter((candidate) =>
      remoteMutation.test(candidate),
    )) {
      assert.match(step, /^\s*if: .*!inputs\.dry_run/mu, `${name}:\n${step}`);
    }
  }
});

test('the Pro registry serves only the @nocobase scope and the install can authenticate to it', async () => {
  for (const [name, source] of await proSources()) {
    const steps = source.split(/\n(?=      - name: )/u);
    const registrySteps = steps.filter((step) =>
      /^\s+registry-url: \$\{\{ secrets\.PRO_NPM_REGISTRY \}\}\s*$/mu.test(
        step,
      ),
    );
    for (const step of registrySteps) {
      assert.match(step, /^\s+scope: '@nocobase'\s*$/mu, `${name}:\n${step}`);
    }
    if (registrySteps.length > 0) {
      const installs = steps.filter(
        (step) =>
          step.includes('node ./scripts/sync-release-oss.mjs') ||
          (name.includes('#') && step.includes('pnpm install')),
      );
      assert.ok(installs.length > 0, name);
      for (const install of installs) {
        assert.match(
          install,
          /^\s+NODE_AUTH_TOKEN: \$\{\{ secrets\.PRO_NPM_TOKEN \}\}\s*$/mu,
          `${name}:\n${install}`,
        );
      }
    }
  }
});

function runBlock(job, stepName) {
  const lines = job.split('\n');
  const step = lines.findIndex((line) => line.trim() === `- name: ${stepName}`);
  assert.notEqual(step, -1, stepName);
  const run = lines.findIndex(
    (line, index) => index > step && line.trim() === 'run: |',
  );
  const indent = lines[run].search(/\S/u) + 2;
  const body = [];
  for (const line of lines.slice(run + 1)) {
    if (line.trim() !== '' && line.search(/\S/u) < indent) break;
    body.push(line.slice(indent));
  }
  return body.join('\n');
}

function gitFixture(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'joint-pro-release-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
  };
  const git = (cwd, ...args) =>
    execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
  const remote = path.join(directory, 'remote.git');
  git(directory, 'init', '-q', '--bare', '-b', 'develop', remote);
  const seed = path.join(directory, 'seed');
  git(directory, 'init', '-q', '-b', 'develop', seed);
  writeFileSync(path.join(seed, 'package.json'), '{}\n');
  git(seed, 'add', '.');
  git(
    seed,
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    'commit',
    '-qm',
    'init',
  );
  git(seed, 'push', '-q', remote, 'develop');
  return {
    directory,
    env,
    git,
    remote,
    proSha: git(seed, 'rev-parse', 'HEAD'),
  };
}

// Run a workflow step's script in `cwd`, keeping the local remote instead of authenticating it.
function runStep(job, stepName, cwd, env, extra) {
  const script = runBlock(job, stepName).replace(
    /^git remote set-url origin .*$/mu,
    '',
  );
  const output = path.join(cwd, '..', `${path.basename(cwd)}.output`);
  writeFileSync(output, '');
  const result = spawnSync('bash', ['-e', '-c', script], {
    cwd,
    env: { ...env, GITHUB_OUTPUT: output, ...extra },
    encoding: 'utf8',
  });
  const outputs = Object.fromEntries(
    readFileSync(output, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('=')),
  );
  return { ...result, outputs };
}

test('the Pro candidate is pushed once per batch, reused on a rerun, and never replaced once released', async (t) => {
  const { directory, env, git, remote, proSha } = gitFixture(t);
  const candidateJob = await jointProJob('pro-candidate');
  const sourceSha = 'a'.repeat(40);
  const ossBatch = '2026-11-12.1';
  const releaseTag = `nocobase-v3-beta/${ossBatch}`;

  function candidate(name, changelog) {
    const checkout = path.join(directory, name);
    git(directory, 'clone', '-q', remote, checkout);
    git(checkout, 'checkout', '-q', proSha);
    writeFileSync(path.join(checkout, 'CHANGELOG.md'), changelog);
    git(checkout, 'add', '-A');
    git(
      checkout,
      'update-index',
      '--add',
      '--cacheinfo',
      `160000,${sourceSha},vendor/nocobase3`,
    );
    return runStep(
      candidateJob,
      'Push the Pro release candidate',
      checkout,
      env,
      {
        OSS_BATCH: ossBatch,
        RELEASE_TAG: releaseTag,
        SOURCE_SHA: sourceSha,
      },
    );
  }
  const branchSha = () =>
    git(remote, 'rev-parse', `refs/heads/release-candidate/${ossBatch}`);

  const first = candidate('first', 'versioned\n');
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.outputs.name, /^release-beta\/\d{4}-\d{2}-\d{2}\.1$/u);
  assert.equal(first.outputs.branch, `release-candidate/${ossBatch}`);
  assert.equal(branchSha(), first.outputs.sha);
  assert.equal(
    git(remote, 'log', '-1', '--format=%B', first.outputs.sha),
    `chore: release ${first.outputs.batch} [skip ci]\n\nOSS-Release: ${releaseTag}`,
  );
  assert.equal(
    git(remote, 'rev-parse', `${first.outputs.sha}:vendor/nocobase3`),
    sourceSha,
  );

  // The same tree reuses the commit already pushed.
  const rerun = candidate('rerun', 'versioned\n');
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.deepEqual(rerun.outputs, first.outputs);

  // A different tree replaces a leftover nobody released.
  const replaced = candidate('replaced', 'versioned again\n');
  assert.equal(replaced.status, 0, replaced.stderr);
  assert.notEqual(replaced.outputs.sha, first.outputs.sha);
  assert.equal(branchSha(), replaced.outputs.sha);

  // Once a Pro release tag points at the candidate, a different tree must not replace it.
  git(remote, 'tag', replaced.outputs.name, replaced.outputs.sha);
  const refused = candidate('refused', 'something else\n');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stdout, /refusing to replace it/u);
  assert.equal(branchSha(), replaced.outputs.sha);
});

// A gh that answers `gh pr list` with MERGED_URL and logs every call.
function fakeGh(directory) {
  const bin = path.join(directory, 'gh-bin');
  mkdirSync(bin);
  writeFileSync(
    path.join(bin, 'gh'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
if (process.env.GH_LOG) fs.appendFileSync(process.env.GH_LOG, JSON.stringify(args) + '\\n');
if (args[0] === 'pr' && args[1] === 'list') { if (process.env.MERGED_URL) process.stdout.write(process.env.MERGED_URL + '\\n'); process.exit(0); }
if (args.includes('DELETE')) process.exit(0);
if (process.env.CURRENT_SHA) process.stdout.write(process.env.CURRENT_SHA + '\\n');
else process.exit(1);
`,
    { mode: 0o755 },
  );
  return bin;
}

test('the Pro release tags the candidate once and pushes the release branch at it', async (t) => {
  const fixture = gitFixture(t);
  const { directory, git, remote, proSha } = fixture;
  const env = {
    ...fixture.env,
    PATH: `${fakeGh(directory)}${path.delimiter}${process.env.PATH}`,
  };
  const publish = await jointProJob('pro-release');
  const name = 'release-beta/2026-11-12.1';
  const checkout = path.join(directory, 'release');
  git(directory, 'clone', '-q', remote, checkout);

  for (const attempt of [1, 2]) {
    const result = runStep(
      publish,
      'Tag and push the release branch',
      checkout,
      env,
      {
        NAME: name,
        CANDIDATE_SHA: proSha,
      },
    );
    assert.equal(result.status, 0, `attempt ${attempt}: ${result.stderr}`);
  }
  assert.equal(git(remote, 'rev-parse', `refs/tags/${name}^{commit}`), proSha);
  assert.equal(git(remote, 'rev-parse', `refs/heads/${name}`), proSha);

  const other = runStep(
    publish,
    'Tag and push the release branch',
    checkout,
    env,
    {
      NAME: name,
      CANDIDATE_SHA: 'b'.repeat(40),
    },
  );
  assert.notEqual(other.status, 0);
  assert.match(other.stdout, /already points to/u);

  // After the merge back deleted the release branch, a rerun does not push it again.
  git(remote, 'update-ref', '-d', `refs/heads/${name}`);
  const merged = runStep(
    publish,
    'Tag and push the release branch',
    checkout,
    env,
    {
      NAME: name,
      CANDIDATE_SHA: proSha,
      MERGED_URL: 'https://github.com/nocobase/nocobase3-pro/pull/1',
    },
  );
  assert.equal(merged.status, 0, merged.stderr);
  assert.equal(git(remote, 'branch', '--list', name), '');
});

test('pruning removes released and expired candidates of other batches only', async (t) => {
  const { directory, env, git, remote, proSha } = gitFixture(t);
  const candidateJob = await jointProJob('pro-candidate');
  const seed = path.join(directory, 'seed');
  const commit = (message, date) => {
    writeFileSync(path.join(seed, 'CHANGELOG.md'), `${message}\n`);
    git(seed, 'add', '-A');
    execFileSync(
      'git',
      ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', message],
      {
        cwd: seed,
        env: date
          ? { ...env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date }
          : env,
      },
    );
    return git(seed, 'rev-parse', 'HEAD');
  };
  const branches = {
    'release-candidate/2026-11-12.2': commit('current'),
    'release-candidate/2026-11-10.1': commit('released'),
    'release-candidate/2026-11-11.1': commit('recent and unreleased'),
    'release-candidate/2026-09-01.1': commit('expired', '2026-09-01T00:00:00Z'),
    'release-candidate/manual': commit('not a batch', '2026-09-01T00:00:00Z'),
  };
  for (const [branch, sha] of Object.entries(branches)) {
    git(seed, 'push', '-q', remote, `${sha}:refs/heads/${branch}`);
  }
  git(
    seed,
    'push',
    '-q',
    remote,
    `${branches['release-candidate/2026-11-10.1']}:refs/tags/release-beta/2026-11-10.1`,
  );
  const checkout = path.join(directory, 'prune');
  git(directory, 'clone', '-q', remote, checkout);
  git(checkout, 'checkout', '-q', proSha);

  const result = runStep(
    candidateJob,
    'Prune stale Pro release candidates',
    checkout,
    env,
    {
      OSS_BATCH: '2026-11-12.2',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const left = git(
    remote,
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/heads/release-candidate/',
  )
    .split('\n')
    .sort();
  assert.deepEqual(left, [
    'release-candidate/2026-11-11.1',
    'release-candidate/2026-11-12.2',
    'release-candidate/manual',
  ]);
});

test("the post-merge deletion removes only this run's own candidate branch, idempotently", async (t) => {
  const cleanup = await jointProJob('pro-release');
  const directory = mkdtempSync(path.join(tmpdir(), 'joint-pro-cleanup-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const log = path.join(directory, 'gh.log');
  writeFileSync(
    path.join(directory, 'gh'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GH_LOG, JSON.stringify(args) + '\\n');
if (args.includes('DELETE')) process.exit(0);
if (process.env.CURRENT_SHA) process.stdout.write(process.env.CURRENT_SHA + '\\n');
else process.exit(1);
`,
    { mode: 0o755 },
  );
  const candidateSha = 'c'.repeat(40);
  function clean(branch, current) {
    writeFileSync(log, '');
    const result = runStep(
      cleanup,
      'Delete the Pro release candidate branch',
      directory,
      {
        ...process.env,
        PATH: `${directory}${path.delimiter}${process.env.PATH}`,
      },
      {
        GH_LOG: log,
        BRANCH: branch,
        CANDIDATE_SHA: candidateSha,
        CURRENT_SHA: current,
      },
    );
    const calls = readFileSync(log, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    return { result, deleted: calls.some((call) => call.includes('DELETE')) };
  }

  const own = clean('release-candidate/2026-11-12.1', candidateSha);
  assert.equal(own.result.status, 0, own.result.stderr);
  assert.equal(own.deleted, true);
  assert.equal(
    clean('release-candidate/2026-11-12.1', 'd'.repeat(40)).deleted,
    false,
  );
  assert.equal(clean('release-candidate/2026-11-12.1', '').deleted, false);
  const develop = clean('develop', candidateSha);
  assert.notEqual(develop.result.status, 0);
  assert.equal(develop.deleted, false);
});
