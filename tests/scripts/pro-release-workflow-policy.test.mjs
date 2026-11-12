import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  copyFileSync,
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

test('pro-candidate writes the Pro changelog into the tested candidate as the standalone Pro beta does', async () => {
  const candidate = await jointProJob('pro-candidate');
  const standalone = await workflow('v3-pro-release-beta.yml');
  assert.equal(
    runBlock(candidate, 'Write the changelog'),
    runBlock(standalone, 'Write the changelog'),
  );
  const order = [
    '- name: Version Pro packages',
    '- name: Name the Pro release',
    '- name: Create a Pro pull request read token',
    '- name: Write the changelog',
    '- name: Stage the versioned Pro tree',
    '- name: Build and test Pro',
    '- name: Push the Pro release candidate',
  ].map((step) => candidate.indexOf(step));
  assert.ok(
    order.every((position) => position !== -1),
    order.join(),
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  const step = (name) =>
    candidate
      .split(/\n(?=      - name: )/u)
      .find((block) => block.startsWith(`      - name: ${name}\n`));
  assert.match(
    step('Write the changelog'),
    /TAG: \$\{\{ steps\.release_name\.outputs\.name \}\}/u,
  );
  assert.match(
    step('Create a Pro pull request read token'),
    /permission-pull-requests: read/u,
  );
  assert.match(
    step('Push the Pro release candidate'),
    /NAME: \$\{\{ steps\.release_name\.outputs\.name \}\}/u,
  );
});

// "Re-run failed jobs" reuses pro-candidate's outputs and never pushes its candidate again, so the candidate of a failed or cancelled run must survive until a rerun has merged it back.
test('only the merge back and the candidate prunes delete a release candidate', async () => {
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
  // The prune step deletes through scripts/pro-release-candidates.mjs, tested in pro-release-candidates.test.mjs.
  const pruning = steps
    .filter((step) => step.includes('pro-release-candidates.mjs" prune'))
    .map((step) => step.match(/- name: ([^\n]+)/u)[1]);
  assert.deepEqual([...deleting, ...pruning].sort(), [
    'Delete the Pro release candidate branch',
    'Delete the candidates this release superseded',
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
  // Earlier candidates are superseded only once this release is published, and never this run's own.
  assert.ok(
    publish.indexOf('- name: Point beta and latest at this release') <
      publish.indexOf('- name: Delete the candidates this release superseded'),
  );
  assert.match(
    runBlock(publish, 'Delete the candidates this release superseded'),
    /prune --keep "\$BRANCH" --superseded$/mu,
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

test('the joint Pro jobs never use the public npm token or registry', async () => {
  for (const job of jointProJobs) {
    const source = await jointProJob(job);
    assert.doesNotMatch(source, /secrets\.NPM_TOKEN\b/u, job);
    // The only mention of public npm is the check that rejects it as the Pro registry.
    for (const step of source.split(/\n(?=      - name: )/u)) {
      if (!step.includes('registry.npmjs.org')) continue;
      assert.match(step, /- name: Validate the Pro npm registry\n/u, job);
      assert.equal(
        step.match(/registry\.npmjs\.org/gu).length,
        1,
        `${job}:\n${step}`,
      );
      assert.match(
        step,
        /if \(registry\.hostname === "registry\.npmjs\.org"\) \{ console\.error\("::error::Commercial packages must not use public npm"\); process\.exit\(1\); \}/u,
      );
    }
  }
});

// No step of pro-release leaves the write token in .git/config for a later step, where pnpm publish's lifecycle scripts or an install could read it: each one that puts it in the remote resets the remote when it exits.
test('pro-release keeps the write token out of the remote between steps', async () => {
  const publish = await jointProJob('pro-release');
  for (const step of publish.split(/\n(?=      - name: )/u)) {
    if (!step.includes('x-access-token:')) continue;
    assert.match(
      step,
      /^\s+trap 'git remote set-url origin https:\/\/github\.com\/nocobase\/nocobase3-pro\.git' EXIT$/mu,
      step.slice(0, 200),
    );
  }
  const pointer = runBlock(
    publish,
    'Return the submodule pointer to v3-develop',
  );
  assert.ok(
    pointer.startsWith('WRITE_TOKEN="$PRO_TOKEN"\nunset PRO_TOKEN GH_TOKEN\n'),
    pointer.slice(0, 200),
  );
  assert.doesNotMatch(
    pointer.slice(pointer.indexOf('unset')),
    /\$\{?(?:GH|PRO)_TOKEN/u,
  );
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

// Run a workflow step's script in `cwd`, keeping the local remote instead of authenticating it and resetting it to GitHub.
function runStep(job, stepName, cwd, env, extra) {
  const script = runBlock(job, stepName).replace(
    /^(?:git remote set-url origin|trap ).*$/gmu,
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

// Name the Pro release, then push the candidate, as pro-candidate does around its changelog, build, and tests.
function pushCandidate(candidateJob, checkout, env, extra) {
  const named = runStep(candidateJob, 'Name the Pro release', checkout, env, {
    RUN_URL: 'https://github.com/nocobase/nocobase/actions/runs/1',
    ...extra,
  });
  if (named.status !== 0) return named;
  const pushed = runStep(
    candidateJob,
    'Push the Pro release candidate',
    checkout,
    env,
    {
      RUN_URL: 'https://github.com/nocobase/nocobase/actions/runs/1',
      NAME: named.outputs.name,
      ...extra,
    },
  );
  return { ...pushed, outputs: { ...named.outputs, ...pushed.outputs } };
}

test('the Pro candidate is pushed once per batch, reused on a rerun, and never replaced once released', async (t) => {
  const { directory, env, git, remote, proSha } = gitFixture(t);
  const candidateJob = await jointProJob('pro-candidate');
  const sourceSha = 'a'.repeat(40);
  const ossBatch = '2026-11-12.1';
  const releaseTag = `nocobase-v3-beta/${ossBatch}`;

  function candidate(name, changelog, extra = {}) {
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
    return pushCandidate(candidateJob, checkout, env, {
      OSS_BATCH: ossBatch,
      RELEASE_TAG: releaseTag,
      SOURCE_SHA: sourceSha,
      ...extra,
    });
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
    `chore: release ${first.outputs.batch} [skip ci]\n\nOSS-Release: ${releaseTag}\nOSS-Run: https://github.com/nocobase/nocobase/actions/runs/1`,
  );
  assert.equal(
    git(remote, 'rev-parse', `${first.outputs.sha}:vendor/nocobase3`),
    sourceSha,
  );

  // The same tree reuses the commit already pushed.
  const rerun = candidate('rerun', 'versioned\n');
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.deepEqual(rerun.outputs, first.outputs);

  // A different tree replaces a leftover nobody released, and keeps the name this run gave it.
  const replaced = candidate('replaced', 'versioned again\n');
  assert.equal(replaced.status, 0, replaced.stderr);
  assert.notEqual(replaced.outputs.sha, first.outputs.sha);
  assert.equal(replaced.outputs.name, first.outputs.name);
  assert.equal(branchSha(), replaced.outputs.sha);

  // The same tree pushed by another run is replaced, so the commit records the run that can still publish it.
  const otherRun = candidate('other-run', 'versioned again\n', {
    RUN_URL: 'https://github.com/nocobase/nocobase/actions/runs/2',
  });
  assert.equal(otherRun.status, 0, otherRun.stderr);
  assert.notEqual(otherRun.outputs.sha, replaced.outputs.sha);
  assert.match(
    git(remote, 'log', '-1', '--format=%B', otherRun.outputs.sha),
    /^OSS-Run: https:\/\/github\.com\/nocobase\/nocobase\/actions\/runs\/2$/mu,
  );
  const back = candidate('back', 'versioned again\n');
  assert.equal(back.status, 0, back.stderr);

  // Once a Pro release tag points at the candidate, a different tree must not replace it.
  git(remote, 'tag', back.outputs.name, back.outputs.sha);
  const refused = candidate('refused', 'something else\n');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stdout, /refusing to replace it/u);
  assert.equal(branchSha(), back.outputs.sha);
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
  // Published and merged back into Pro develop.
  git(
    seed,
    'push',
    '-q',
    remote,
    `${branches['release-candidate/2026-11-10.1']}:refs/tags/release-beta/2026-11-10.1`,
    `+${branches['release-candidate/2026-11-10.1']}:refs/heads/develop`,
  );
  const tools = path.join(directory, 'runner-temp', 'oss-tools');
  mkdirSync(tools, { recursive: true });
  copyFileSync(
    path.join(root, 'scripts/pro-release-candidates.mjs'),
    path.join(tools, 'pro-release-candidates.mjs'),
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
      RUNNER_TEMP: path.dirname(tools),
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

test('a new Pro batch number skips the numbers of candidates still pushed, and commit hooks cannot change the tree', async (t) => {
  const { directory, env, git, remote, proSha } = gitFixture(t);
  const candidateJob = await jointProJob('pro-candidate');
  const day = new Date().toISOString().slice(0, 10);
  const sourceSha = 'a'.repeat(40);

  // A failed run's candidate that was never tagged still holds the Pro batch <day>.3.
  const seed = path.join(directory, 'seed');
  git(seed, 'checkout', '-q', '--detach', proSha);
  git(
    seed,
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    `chore: release ${day}.3 [skip ci]`,
  );
  git(
    seed,
    'push',
    '-q',
    remote,
    'HEAD:refs/heads/release-candidate/2026-11-11.4',
  );
  git(seed, 'push', '-q', remote, `${proSha}:refs/tags/release-beta/${day}.1`);

  const checkout = path.join(directory, 'hooked');
  git(directory, 'clone', '-q', remote, checkout);
  git(checkout, 'checkout', '-q', proSha);
  writeFileSync(path.join(checkout, 'CHANGELOG.md'), 'versioned\n');
  git(checkout, 'add', '-A');
  git(
    checkout,
    'update-index',
    '--add',
    '--cacheinfo',
    `160000,${sourceSha},vendor/nocobase3`,
  );
  // A pre-commit hook that would add a file to the commit, as a lint-staged fix would.
  mkdirSync(path.join(checkout, '.hooks'));
  writeFileSync(
    path.join(checkout, '.hooks/pre-commit'),
    '#!/bin/sh\necho changed > hook.txt\ngit add hook.txt\n',
    { mode: 0o755 },
  );
  git(checkout, 'config', 'core.hooksPath', '.hooks');
  const tree = git(checkout, 'write-tree');

  const result = pushCandidate(candidateJob, checkout, env, {
    OSS_BATCH: '2026-11-12.1',
    RELEASE_TAG: 'nocobase-v3-beta/2026-11-12.1',
    SOURCE_SHA: sourceSha,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.name, `release-beta/${day}.4`);
  assert.equal(git(remote, 'rev-parse', `${result.outputs.sha}^{tree}`), tree);
});

test('pro-release refuses to publish once another Pro beta was released from a newer develop', async (t) => {
  const fixture = gitFixture(t);
  const { directory, git, remote, proSha } = fixture;
  const env = {
    ...fixture.env,
    PATH: `${fakeGh(directory)}${path.delimiter}${process.env.PATH}`,
  };
  const publish = await jointProJob('pro-release');
  const seed = path.join(directory, 'seed');
  const commit = (message) => {
    git(seed, 'checkout', '-q', '--detach', proSha);
    git(
      seed,
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@t',
      'commit',
      '-q',
      '--allow-empty',
      '-m',
      message,
    );
    return git(seed, 'rev-parse', 'HEAD');
  };
  const candidateSha = commit('candidate');
  git(
    seed,
    'push',
    '-q',
    remote,
    `${candidateSha}:refs/heads/release-candidate/2026-11-12.1`,
  );
  // An old release that never merged back, already missing from develop when pro-candidate ran.
  git(
    seed,
    'push',
    '-q',
    remote,
    `${commit('old')}:refs/tags/release-beta/2026-10-10.1`,
  );
  const name = 'release-beta/2026-11-12.2';
  const tag = (extra) => {
    const checkout = mkdtempSync(path.join(directory, 'tag-'));
    git(directory, 'clone', '-q', remote, checkout);
    const inputs = {
      NAME: name,
      CANDIDATE_SHA: candidateSha,
      CANDIDATE_BRANCH: 'release-candidate/2026-11-12.1',
      PRO_SHA: proSha,
      KNOWN_TAGS: 'release-beta/2026-10-10.1 ',
      MERGE_SHA: 'f'.repeat(40),
      ...extra,
    };
    const guard = runStep(
      publish,
      'Refuse to publish over a newer Pro beta',
      checkout,
      env,
      inputs,
    );
    if (guard.status !== 0) return guard;
    return runStep(
      publish,
      'Tag and push the release branch',
      checkout,
      env,
      inputs,
    );
  };

  const unknownOld = tag({ KNOWN_TAGS: '' });
  assert.notEqual(unknownOld.status, 0);

  const first = tag();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(
    git(remote, 'rev-parse', `refs/tags/${name}^{commit}`),
    candidateSha,
  );
  // Its own tag does not block a rerun.
  assert.equal(tag().status, 0);

  // A standalone Pro beta released meanwhile from a develop this candidate does not contain.
  git(
    seed,
    'push',
    '-q',
    remote,
    `${commit('standalone')}:refs/tags/release-beta/2026-11-12.1`,
  );
  const refused = tag();
  assert.notEqual(refused.status, 0);
  assert.match(
    refused.stdout,
    /::error::Another Pro beta was released after Pro develop was tested at [0-9a-f]{40}: release-beta\/2026-11-12\.1\. .*V3 Release Pro Beta with oss_sha set to f{40}/u,
  );
});

test('the pointer returns to the old commit only when the open-source merge back failed, and otherwise waits for release', async (t) => {
  const fixture = gitFixture(t);
  const { directory, git, remote, proSha } = fixture;
  const env = {
    ...fixture.env,
    PATH: `${fakeGh(directory)}${path.delimiter}${process.env.PATH}`,
  };
  const publish = await jointProJob('pro-release');
  const name = 'release-beta/2026-11-12.1';
  git(
    path.join(directory, 'seed'),
    'push',
    '-q',
    remote,
    `${proSha}:refs/heads/${name}`,
  );
  const pointer = (extra) => {
    const checkout = mkdtempSync(path.join(directory, 'pointer-'));
    git(directory, 'clone', '-q', remote, checkout);
    return runStep(
      publish,
      'Return the submodule pointer to v3-develop',
      checkout,
      env,
      {
        NAME: name,
        ...extra,
      },
    );
  };

  for (const merged of ['', 'true']) {
    const waiting = pointer({ MERGED: merged, MERGE_SHA: '' });
    assert.notEqual(waiting.status, 0, merged);
    assert.match(
      waiting.stdout,
      /::error::The open-source release has not merged back into v3-develop yet .*Re-run failed jobs/u,
    );
  }
  const done = pointer({
    MERGED: '',
    MERGE_SHA: '',
    MERGED_URL: 'https://github.com/nocobase/nocobase3-pro/pull/1',
  });
  assert.equal(done.status, 0, done.stderr);
  assert.equal(done.outputs.merged, 'true');
});

test('pro-release checks the versions with the candidate before reserving their tags at it', async (t) => {
  const fixture = gitFixture(t);
  const { directory, git, remote, proSha } = fixture;
  const publish = await jointProJob('pro-release');
  const specs = '@nocobase/one@1.0.0-beta.2 @nocobase/two@0.1.0-beta.5 ';
  const reserve = (verdict) => {
    const checkout = mkdtempSync(path.join(directory, 'reserve-'));
    git(directory, 'clone', '-q', remote, checkout);
    // Stands in for Pro's scripts/check-release-versions.mjs and records its arguments.
    mkdirSync(path.join(checkout, 'scripts'));
    writeFileSync(
      path.join(checkout, 'scripts/check-release-versions.mjs'),
      `process.getBuiltinModule('node:fs').writeFileSync(${JSON.stringify(path.join(directory, 'check-args.json'))}, JSON.stringify(process.argv.slice(2))); process.exit(${verdict});\n`,
    );
    return runStep(
      publish,
      'Verify the Pro versions and reserve their tags',
      checkout,
      fixture.env,
      {
        PRO_NPM_REGISTRY: 'https://pkg-v3.example.test/',
        SPECS: specs,
        CANDIDATE_SHA: proSha,
      },
    );
  };
  const tags = () =>
    git(
      remote,
      'for-each-ref',
      '--format=%(refname:short) %(objectname)',
      'refs/tags/@nocobase/',
    );

  // The release tag is pushed only once the check passed, so a candidate that may not be published is never tagged release-beta.
  const order = [
    '- name: Refuse to publish over a newer Pro beta',
    '- name: Verify the Pro versions and reserve their tags',
    '- name: Tag and push the release branch',
    '- name: Publish Pro packages',
  ].map((step) => publish.indexOf(step));
  assert.ok(
    order.every((position) => position !== -1),
    order.join(),
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );

  const refused = reserve(1);
  assert.notEqual(refused.status, 0);
  assert.equal(tags(), '');

  // A tag an abandoned candidate reserved is moved once the check accepted it (check-release-versions.mjs decides which may be).
  const seed = path.join(directory, 'seed');
  git(
    seed,
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    'abandoned candidate',
  );
  git(seed, 'push', '-q', remote, 'HEAD:refs/tags/@nocobase/two@0.1.0-beta.5');

  for (const attempt of [1, 2]) {
    const result = reserve(0);
    assert.equal(result.status, 0, `attempt ${attempt}: ${result.stderr}`);
  }
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(directory, 'check-args.json'), 'utf8')),
    [
      '--registry',
      'https://pkg-v3.example.test/',
      '--candidate',
      proSha,
      '@nocobase/one@1.0.0-beta.2',
      '@nocobase/two@0.1.0-beta.5',
    ],
  );
  assert.equal(
    tags(),
    `@nocobase/one@1.0.0-beta.2 ${proSha}\n@nocobase/two@0.1.0-beta.5 ${proSha}`,
  );
});

// A registry on 127.0.0.1 that serves `packages` ({ name: [versions] }) as minimal tarballs, in a child process so that synchronously spawned installs can reach it.
async function localRegistry(t, directory, packages) {
  const server = path.join(directory, 'registry.mjs');
  writeFileSync(
    server,
    `import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
const [work, json] = process.argv.slice(2);
const files = new Map();
const server = createServer((request, response) => {
  const route = decodeURIComponent(request.url.split('?')[0]);
  const file = files.get(route);
  if (!file) { response.statusCode = 404; response.end('{}'); return; }
  if (typeof file === 'string') response.setHeader('content-type', 'application/json');
  response.end(file);
});
server.listen(0, '127.0.0.1', () => {
  const base = 'http://127.0.0.1:' + server.address().port;
  for (const [name, versions] of Object.entries(JSON.parse(json))) {
    const document = { name, 'dist-tags': { latest: versions.at(-1) }, versions: {}, time: {} };
    for (const version of versions) {
      const folder = path.join(work, name + '-' + version);
      mkdirSync(path.join(folder, 'package'), { recursive: true });
      writeFileSync(path.join(folder, 'package/package.json'), JSON.stringify({ name, version }));
      execFileSync('tar', ['-czf', 'package.tgz', 'package'], { cwd: folder });
      const tarball = readFileSync(path.join(folder, 'package.tgz'));
      const route = '/' + name + '/-/' + name + '-' + version + '.tgz';
      files.set(route, tarball);
      document.versions[version] = { name, version, dist: { tarball: base + route, shasum: createHash('sha1').update(tarball).digest('hex'), integrity: 'sha512-' + createHash('sha512').update(tarball).digest('base64') } };
      document.time[version] = '2020-01-01T00:00:00.000Z';
    }
    files.set('/' + name, JSON.stringify(document));
  }
  process.stdout.write(base + '/\\n');
});
`,
  );
  const work = path.join(directory, 'registry');
  mkdirSync(work);
  const child = spawn(
    process.execPath,
    [server, work, JSON.stringify(packages)],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  t.after(() => child.kill());
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.stdout.once('data', (chunk) => resolve(String(chunk).trim()));
  });
}

test('the merge back keeps the pnpm settings Pro develop changed after the candidate, and installs without the write token', async (t) => {
  if (spawnSync('pnpm', ['--version']).status !== 0) {
    t.skip('pnpm is not installed');
    return;
  }
  const directory = mkdtempSync(path.join(tmpdir(), 'joint-pro-merge-back-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const registryUrl = await localRegistry(t, directory, {
    'pro-dep': ['1.0.0', '1.1.0'],
    'pro-new': ['1.0.0'],
  });
  const tokens = path.join(directory, 'install-tokens.json');
  const env = {
    ...process.env,
    PATH: `${fakeGh(directory)}${path.delimiter}${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.file.allow',
    GIT_CONFIG_VALUE_0: 'always',
    GIT_AUTHOR_NAME: 't',
    GIT_AUTHOR_EMAIL: 't@t',
    GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@t',
    XDG_CONFIG_HOME: path.join(directory, 'config'),
    XDG_CACHE_HOME: path.join(directory, 'cache'),
    npm_config_store_dir: path.join(directory, 'store'),
    INSTALL_TOKENS: tokens,
  };
  const git = (cwd, ...args) =>
    execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
  const write = (cwd, file, content) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    writeFileSync(path.join(cwd, file), content);
  };
  const commit = (cwd, message) => {
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-qm', message);
    return git(cwd, 'rev-parse', 'HEAD');
  };
  const install = (cwd) =>
    execFileSync('pnpm', ['install', '--no-frozen-lockfile'], {
      cwd,
      env: { ...env, CI: 'true' },
      stdio: 'ignore',
    });

  // The open-source repository: the commit Pro develop pins, the release commit the candidate pins, and the merged release commit on v3-develop.
  const oss = path.join(directory, 'oss');
  git(directory, 'init', '-q', '-b', 'v3-develop', oss);
  write(oss, 'VERSION', 'base\n');
  write(oss, 'scripts/resolve-sync-conflicts.mjs', '\n');
  const base = commit(oss, 'base');
  write(oss, 'VERSION', 'source\n');
  const source = commit(oss, 'release commit');
  git(oss, 'checkout', '-q', '-B', 'v3-develop', base);
  write(oss, 'VERSION', 'target\n');
  const target = commit(oss, 'merged release');

  // Pro develop, as pro-candidate tested it. Its sync scripts stand in for Pro's: the upstream block is the `# oss:` line, and the install is a real pnpm install against the local registry.
  const remote = path.join(directory, 'pro.git');
  git(directory, 'init', '-q', '--bare', '-b', 'develop', remote);
  const seed = path.join(directory, 'seed');
  git(directory, 'init', '-q', '-b', 'develop', seed);
  git(seed, 'remote', 'add', 'origin', remote);
  write(seed, '.gitignore', 'node_modules\n');
  write(seed, '.npmrc', `registry=${registryUrl}\n`);
  write(seed, 'package.json', '{ "name": "pro", "private": true }\n');
  write(
    seed,
    'scripts/sync-workspace-config.mjs',
    `import fs from 'node:fs';
const oss = fs.readFileSync('vendor/nocobase3/VERSION', 'utf8').trim();
const file = 'pnpm-workspace.yaml';
const synced = fs.readFileSync(file, 'utf8').replace(/^# oss: .*$/mu, '# oss: ' + oss);
if (process.argv[2] === '--check') process.exit(synced === fs.readFileSync(file, 'utf8') ? 0 : 1);
fs.writeFileSync(file, synced);
`,
  );
  write(
    seed,
    'scripts/sync-release-oss.mjs',
    `import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [, , branch, , , sha] = process.argv;
if (branch !== '--branch' || !/^[0-9a-f]{40}$/u.test(sha)) process.exit(2);
const leaked = ['PRO_TOKEN', 'GH_TOKEN', 'WRITE_TOKEN'].filter((name) => process.env[name] !== undefined);
fs.writeFileSync(process.env.INSTALL_TOKENS, JSON.stringify(leaked));
execFileSync('git', ['-C', 'vendor/nocobase3', 'checkout', '-q', '--detach', sha], { stdio: 'inherit' });
execFileSync('git', ['update-index', '--cacheinfo', '160000,' + sha + ',vendor/nocobase3'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/sync-workspace-config.mjs', '--write'], { stdio: 'inherit' });
execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
`,
  );
  const workspace = (catalog) =>
    `packages:\n  - packages/*\n# oss: base\nallowBuilds: {}\nsharedWorkspaceLockfile: true\nlinkWorkspacePackages: true\ncatalog:\n${catalog}`;
  const plugin = (version, dependencies) =>
    `${JSON.stringify(
      {
        name: '@pro/plugin',
        version,
        private: true,
        license: 'UNLICENSED',
        description: 'A commercial plugin',
        dependencies,
      },
      null,
      2,
    )}\n`;
  write(seed, 'pnpm-workspace.yaml', workspace('  pro-dep: 1.0.0\n'));
  write(
    seed,
    'packages/plugin/package.json',
    plugin('1.0.0-beta.1', { 'pro-dep': 'catalog:' }),
  );
  git(seed, 'submodule', 'add', '-q', oss, 'vendor/nocobase3');
  git(path.join(seed, 'vendor/nocobase3'), 'checkout', '-q', '--detach', base);
  install(seed);
  commit(seed, 'pro develop');
  git(seed, 'push', '-q', 'origin', 'develop');

  // The candidate, published as release-beta/<batch>: a new version, pinned to the release commit.
  const name = 'release-beta/2026-11-12.1';
  git(seed, 'checkout', '-q', '-b', name);
  write(
    seed,
    'packages/plugin/package.json',
    plugin('1.0.0-beta.2', { 'pro-dep': 'catalog:' }),
  );
  git(
    path.join(seed, 'vendor/nocobase3'),
    'checkout',
    '-q',
    '--detach',
    source,
  );
  execFileSync(process.execPath, ['scripts/sync-workspace-config.mjs'], {
    cwd: seed,
  });
  commit(seed, `chore: release 2026-11-12.1 [skip ci]`);
  git(seed, 'push', '-q', 'origin', name);

  // Meanwhile Pro develop changes a catalog entry and adds one that a plugin uses.
  git(seed, 'checkout', '-q', 'develop');
  git(path.join(seed, 'vendor/nocobase3'), 'checkout', '-q', '--detach', base);
  write(
    seed,
    'pnpm-workspace.yaml',
    workspace('  pro-dep: 1.1.0\n  pro-new: 1.0.0\n'),
  );
  write(
    seed,
    'packages/plugin/package.json',
    plugin('1.0.0-beta.1', { 'pro-dep': 'catalog:', 'pro-new': 'catalog:' }),
  );
  install(seed);
  commit(seed, 'feat: use pro-new');
  git(seed, 'push', '-q', 'origin', 'develop');

  const checkout = path.join(directory, 'release');
  git(directory, 'clone', '-q', remote, checkout);
  git(checkout, 'checkout', '-q', '--detach', `origin/${name}`);
  git(checkout, 'submodule', 'update', '--init', '-q');
  const tools = path.join(directory, 'runner-temp', 'oss-tools');
  mkdirSync(tools, { recursive: true });
  copyFileSync(
    path.join(root, 'scripts/reconcile-pro-release-metadata.mjs'),
    path.join(tools, 'reconcile-pro-release-metadata.mjs'),
  );

  const result = runStep(
    await jointProJob('pro-release'),
    'Return the submodule pointer to v3-develop',
    checkout,
    env,
    {
      RUNNER_TEMP: path.dirname(tools),
      NAME: name,
      MERGED: 'true',
      MERGE_SHA: target,
      PRO_TOKEN: 'write-token',
      GH_TOKEN: 'write-token',
    },
  );
  assert.doesNotMatch(
    result.stdout + result.stderr,
    /ERR_PNPM_CATALOG_ENTRY_NOT_FOUND/u,
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.outputs.merged, 'false');
  assert.deepEqual(JSON.parse(readFileSync(tokens, 'utf8')), []);

  const show = (file) => git(remote, 'show', `refs/heads/${name}:${file}`);
  assert.equal(
    show('pnpm-workspace.yaml'),
    workspace('  pro-dep: 1.1.0\n  pro-new: 1.0.0')
      .replace('# oss: base', '# oss: target')
      .trimEnd(),
  );
  assert.match(show('pnpm-lock.yaml'), /^ {2}pro-dep@1\.1\.0:$/mu);
  assert.match(show('pnpm-lock.yaml'), /^ {2}pro-new@1\.0\.0:$/mu);
  assert.doesNotMatch(show('pnpm-lock.yaml'), /pro-dep@1\.0\.0/u);
  assert.deepEqual(JSON.parse(show('packages/plugin/package.json')), {
    ...JSON.parse(
      plugin('1.0.0-beta.2', {
        'pro-dep': 'catalog:',
        'pro-new': 'catalog:',
      }),
    ),
  });
  assert.equal(
    git(remote, 'rev-parse', `refs/heads/${name}:vendor/nocobase3`),
    target,
  );
  assert.deepEqual(
    git(remote, 'log', '--format=%s', '-2', `refs/heads/${name}`).split('\n'),
    [
      `chore: bump oss to ${target} [skip ci]`,
      `chore: merge develop into ${name} [skip ci]`,
    ],
  );
});
