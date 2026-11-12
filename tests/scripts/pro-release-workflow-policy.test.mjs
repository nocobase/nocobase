import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const jointProJobs = ['pro-candidate', 'pro-release', 'pro-candidate-cleanup'];

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

test('an unpublished candidate is cleaned up only when the release failed or was cancelled before npm', async () => {
  const cleanup = await jointProJob('pro-candidate-cleanup');
  for (const condition of [
    'always()',
    '!inputs.dry_run',
    '(failure() || cancelled())',
    "needs.pro-candidate.outputs.candidate_sha != ''",
    "needs.release.outputs.published != 'true'",
  ]) {
    assert.ok(cleanup.includes(condition), condition);
  }
  assert.doesNotMatch(cleanup, /actions\/checkout/u);
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

test('the Pro release tags the candidate once and pushes the release branch at it', async (t) => {
  const { directory, env, git, remote, proSha } = gitFixture(t);
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
});

test("candidate cleanup deletes only this run's own candidate branch", async (t) => {
  const cleanup = await jointProJob('pro-candidate-cleanup');
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
