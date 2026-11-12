import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
  assert.ok(
    publish.indexOf('Confirm this is the tested Pro release') <
      publish.indexOf('publish-commercial-packages'),
  );
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
      const install = steps.find((step) =>
        step.includes('node ./scripts/sync-release-oss.mjs'),
      );
      assert.ok(install, name);
      assert.match(
        install,
        /^\s+NODE_AUTH_TOKEN: \$\{\{ secrets\.PRO_NPM_TOKEN \}\}\s*$/mu,
        `${name}:\n${install}`,
      );
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

test('a rerun of the Pro release continues the release commit it already pushed', async (t) => {
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
  const proSha = git(seed, 'rev-parse', 'HEAD');
  const sourceSha = 'a'.repeat(40);

  // The step authenticates the remote first; the test keeps the local remote.
  const script = runBlock(
    await jointProJob('pro-release'),
    'Commit, tag, and push the tested candidate',
  ).replace(/^git remote set-url origin .*$/mu, '');

  function release(name, releaseTag) {
    const checkout = path.join(directory, name);
    git(directory, 'clone', '-q', remote, checkout);
    git(checkout, 'checkout', '-q', '--detach', proSha);
    writeFileSync(path.join(checkout, 'CHANGELOG.md'), 'versioned\n');
    git(checkout, 'add', '-A');
    git(
      checkout,
      'update-index',
      '--add',
      '--cacheinfo',
      `160000,${sourceSha},vendor/nocobase3`,
    );
    const output = path.join(directory, `${name}.output`);
    writeFileSync(output, '');
    execFileSync('bash', ['-e', '-c', script], {
      cwd: checkout,
      env: {
        ...env,
        GITHUB_OUTPUT: output,
        RELEASE_TAG: releaseTag,
        SOURCE_SHA: sourceSha,
      },
      stdio: 'pipe',
    });
    return Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split('=')),
    );
  }

  const first = release('first', 'nocobase-v3-beta/2026-11-12.1');
  assert.match(first.name, /^release-beta\/\d{4}-\d{2}-\d{2}\.1$/u);
  const rerun = release('rerun', 'nocobase-v3-beta/2026-11-12.1');
  assert.deepEqual(rerun, first);
  const next = release('next', 'nocobase-v3-beta/2026-11-12.2');
  assert.equal(next.name, first.name.replace(/\.1$/u, '.2'));

  const tags = git(remote, 'tag', '-l', 'release-beta/*').split('\n');
  assert.deepEqual(tags, [first.name, next.name]);
  assert.equal(
    git(remote, 'log', '-1', '--format=%B', first.name),
    `chore: release ${first.batch} [skip ci]\n\nOSS-Release: nocobase-v3-beta/2026-11-12.1`,
  );
  assert.equal(
    git(remote, 'rev-parse', `${first.name}:vendor/nocobase3`),
    sourceSha,
  );
});
