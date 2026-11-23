import assert from 'node:assert/strict';
import {
  readdirSync,
  readFileSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

const workflow = (name) =>
  readFileSync(
    new URL(`../../.github/workflows/v3-${name}.yml`, import.meta.url),
    'utf8',
  );

// The jobs of the release that test and publish Pro write only nocobase/nocobase3-pro, whose branches are develop
// and main, with the Pro registry token; tests/scripts/pro-release-workflow-policy.test.mjs covers them.
const ossJobs = (source) =>
  source.replace(
    /\n  (?:pro-check|pro-candidate|pro-release):\n[\s\S]*?(?=\n  [a-z][\w-]*:\n|$)/gu,
    '\n',
  );

const triggerBranches = (source, event) => {
  const match = source.match(
    new RegExp(`^  ${event}:\\n    branches:\\n((?:      - .+\\n)+)`, 'mu'),
  );
  assert.ok(match, `${event} must declare branch filters`);
  return match[1]
    .trimEnd()
    .split('\n')
    .map((line) => line.replace(/^ {6}- /u, '').replace(/^['"]|['"]$/gu, ''));
};

const matchesSingleSegmentGlob = (pattern, branch) => {
  const expression = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${expression}$`, 'u').test(branch);
};

test('stacked v3 targets receive PR checks without widening direct-branch triggers', () => {
  const changesets = workflow('changeset-check');
  const guard = workflow('guard-main');

  assert.deepEqual(triggerBranches(changesets, 'pull_request'), [
    'v3-main',
    'v3',
    'v3-develop',
    '*/v3-*',
  ]);
  assert.deepEqual(triggerBranches(guard, 'pull_request'), ['v3-main']);
  assert.deepEqual(
    triggerBranches(workflow('pr-description'), 'pull_request'),
    ['v3-main', 'v3', 'v3-develop', '*/v3-*'],
  );

  const workflowPattern = '*/v3-*';
  const botPattern = /^[^/]+\/v3-[^/]+$/u;
  for (const branch of [
    'feat/v3-app-installer',
    'fix/v3-stacked-pr-routing',
    'docs/v3-release-notes',
    'feat/app-installer',
    'v3',
    'v3-develop',
    'agent/PM-42',
    'feat/v3-routing/extra',
  ]) {
    assert.equal(
      matchesSingleSegmentGlob(workflowPattern, branch),
      botPattern.test(branch),
      branch,
    );
  }
});

// The release commit is merged back with a merge commit, so the tag on it stays reachable from v3.
test('the OSS release writes only the migrated repository and v3, merging back with a merge commit', () => {
  const source = ossJobs(workflow('release'));
  assert.match(source, /repositories: nocobase\n/u);
  assert.doesNotMatch(
    source,
    /repositories: nocobase3\n|github\.com\/nocobase\/nocobase3\.git/u,
  );
  assert.doesNotMatch(
    source,
    /--base (?:main|develop)\b|origin\/(?:main|develop)\b|git push origin (?:main|develop)\b/u,
  );
  assert.match(source, /RELEASE_RESULT_FEISHU_WEBHOOK_URL/u);
  assert.doesNotMatch(source, /gh pr merge[^\n]*--squash/u);
  assert.match(
    source,
    /gh pr merge "\$PR_URL" --merge --delete-branch --subject "chore: merge release \$RELEASE_BATCH into v3 \[skip ci\]"/u,
  );
});

test('the promotion workflows are gone and only the channel-aware release workflows remain', () => {
  const workflows = readdirSync(
    path.join(import.meta.dirname, '../../.github/workflows'),
  );
  for (const name of [
    'v3-release-beta.yml',
    'v3-release-stable.yml',
    'v3-merge-beta-to-stable.yml',
    'v3-pro-release-beta.yml',
    'v3-pro-release-stable.yml',
    'v3-pro-promote-to-stable.yml',
  ])
    assert.ok(!workflows.includes(name), name);
  assert.equal(parse(workflow('release')).name, 'V3 Release');
  assert.equal(parse(workflow('pro-release')).name, 'V3 Release Pro');
  // Pro's branch is named once per workflow, so renaming it is a one-line change in each.
  for (const name of ['release', 'pro-release']) {
    const source = workflow(name);
    assert.equal(parse(source).env.PRO_BRANCH, 'develop', name);
    assert.doesNotMatch(
      source,
      /ref: develop$|--base develop\b|refs\/heads\/develop\b|origin\/develop\b/mu,
      name,
    );
  }
});

// GitHub's branch rename (v3-develop to v3) rewrites no files, so the workflows must work under either name: branch
// filters list both, and everything else follows the repository's default branch instead of naming it.
test('v3 workflows follow the default branch under its current and former name', () => {
  const workflows = path.join(import.meta.dirname, '../../.github/workflows');
  const defaultBranchGuard =
    "github.ref == format('refs/heads/{0}', github.event.repository.default_branch)";
  for (const file of readdirSync(workflows).filter((name) =>
    /\.ya?ml$/u.test(name),
  )) {
    const source = readFileSync(path.join(workflows, file), 'utf8');
    const doc = parse(source);
    for (const event of ['push', 'pull_request']) {
      const branches = doc.on?.[event]?.branches;
      if (!Array.isArray(branches) || !branches.includes('v3-develop'))
        continue;
      assert.ok(
        branches.indexOf('v3') !== -1 &&
          branches.indexOf('v3') < branches.indexOf('v3-develop'),
        `${file} ${event} lists v3 before v3-develop`,
      );
    }
    // Outside branch filters and comments, neither name of the default branch is written out.
    const code = source
      .split('\n')
      .filter(
        (line) =>
          !/^\s*#/u.test(line) &&
          !/^\s+- v3(?:-develop)?$/u.test(line) &&
          !/branches: \[v3, v3-develop\]$/u.test(line),
      )
      .join('\n');
    assert.doesNotMatch(
      code,
      /refs\/heads\/v3(?:-develop)?\b(?!-)|origin\/v3(?:-develop)?\b(?!-)|--base v3(?:-develop)?\b(?!-)|ref: v3(?:-develop)?$/mu,
      file,
    );
    for (const [, ref] of code.matchAll(/github\.ref == ('[^']*')/gu))
      assert.fail(`${file} compares github.ref with ${ref}`);
    if (/\bDEFAULT_BRANCH\b/u.test(source)) {
      assert.match(
        source,
        /DEFAULT_BRANCH: \$\{\{ github\.event\.repository\.default_branch \}\}/u,
        file,
      );
      // github.event.repository is missing from schedule payloads.
      assert.ok(!doc.on?.schedule, `${file} has a schedule`);
    }
    if (source.includes(defaultBranchGuard))
      assert.ok(!doc.on?.schedule, `${file} has a schedule`);
  }
});

test('the OSS release publishes through public npm with the existing token', () => {
  const source = ossJobs(workflow('release'));
  assert.match(source, /registry-url: https:\/\/registry\.npmjs\.org/u);
  assert.match(source, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/u);
  assert.doesNotMatch(source, /npm\.nocobase\.ai|PRO_NPM_TOKEN/u);
});

test('the release smoke registry keeps scope isolation over public npm', () => {
  const source = readFileSync(
    new URL('../../.github/verdaccio/config.yaml', import.meta.url),
    'utf8',
  );
  assert.match(source, /nocobase:\n {4}url: https:\/\/registry\.npmjs\.org\//u);
  assert.match(source, /'@nocobase\/\*':[\s\S]*?proxy: nocobase/u);
  assert.doesNotMatch(source, /npm\.nocobase\.ai/u);
});

test('only v3 stable GitHub Releases take the shared Latest marker', () => {
  const source = workflow('github-release');
  assert.match(source, /nocobase-v3\/\*\)\s+FLAGS=\(--latest\)/u);
  assert.match(
    source,
    /nocobase-v3-beta\/\*\|release-beta\/\*\)\s+FLAGS=\(--prerelease --latest=false\)/u,
  );
  assert.match(source, /release\/\*\)\s+FLAGS=\(--latest=false\)/u);
});

test('site deployment uses the existing publish triggers without a migration gate', () => {
  for (const name of ['docs', 'ui-library']) {
    const source = workflow(name);
    assert.doesNotMatch(source, /V3_ASSET_DEPLOY_ENABLED/u);
    assert.match(
      source,
      /github\.event_name == 'push' && github\.ref == format\('refs\/heads\/\{0\}', github\.event\.repository\.default_branch\)/u,
    );
    assert.match(
      source,
      /github\.event_name == 'workflow_dispatch' && inputs\.publish/u,
    );
    assert.deepEqual(triggerBranches(source, 'pull_request'), [
      'v3',
      'v3-develop',
      'v3-main',
      '*/v3-*',
    ]);
    assert.deepEqual(triggerBranches(source, 'push'), ['v3', 'v3-develop']);
    assert.match(source, /publish:[\s\S]*?default: false/u);
  }
  const docs = workflow('docs');
  for (const name of ['OSS_BUCKET', 'OSS_REGION', 'CDN_DOMAIN']) {
    assert.ok(docs.includes(`secrets.V3_DOCS_ALI_${name}`));
    assert.ok(!docs.includes(`secrets.DOCS_ALI_${name}`));
  }
  for (const name of ['docs', 'ui-library']) {
    for (const key of ['ID', 'SECRET']) {
      assert.ok(
        workflow(name).includes(`secrets.DOCS_ALI_OSS_ACCESS_KEY_${key}`),
      );
    }
  }
});

test('independent Pro releases keep their own repository and branches', () => {
  for (const name of ['pro-release']) {
    const source = workflow(name);
    assert.match(source, /repositories: nocobase3-pro/u);
    assert.doesNotMatch(source, /--base v3-|git push origin v3-/u);
    assert.match(source, /secrets\.PRO_NPM_REGISTRY/u);
    assert.match(source, /Commercial packages must not use public npm/u);
    assert.doesNotMatch(source, /npm\.nocobase\.ai/u);
  }
});

test('installer smoke covers the Default archive', () => {
  const smoke = workflow('app-installer-smoke');
  assert.match(
    smoke,
    /pnpm --filter @nocobase\/app-template-default build --tar/u,
  );
  assert.match(
    smoke,
    /smoke-app-installer\.mjs --archive packages\/templates\/app-template-default\/storage\/exports\/dist\.tar\.gz/u,
  );
  assert.doesNotMatch(smoke, /app-template-hub|--source|schedule:/u);
  // The release builds its smoke matrix in prepare; see the Quality test below.
  assert.match(
    workflow('release'),
    /include: \$\{\{ fromJSON\(needs\.prepare\.outputs\.smoke_matrix\) \}\}/u,
  );
  assert.doesNotMatch(workflow('release'), /"template":"hub"/u);
});

test('the release reuses Quality only when its tests and both create-app smoke tests passed on the release base', (t) => {
  const release = parse(workflow('release'));
  const step = release.jobs.prepare.steps.find(
    (candidate) => candidate.id === 'quality',
  );
  assert.equal(release.jobs.prepare.permissions.checks, 'read');
  assert.equal(
    release.jobs.test.if,
    "needs.prepare.outputs.quality_passed != 'true'",
  );
  assert.match(
    release.jobs.release.if,
    /needs\.test\.result == 'success' \|\| \(needs\.prepare\.outputs\.quality_passed == 'true' && needs\.test\.result == 'skipped'\)/u,
  );
  const verify = release.jobs.smoke.steps.find(
    (candidate) => candidate.name === 'Verify create-app against this release',
  );
  assert.equal(verify.with['test-project'], '${{ matrix.project }}');

  const directory = mkdtempSync(path.join(tmpdir(), 'v3-quality-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  // A fake gh that answers the check-runs query with the conclusions given per check name, as the nocobase App or another app.
  const gh = path.join(directory, 'gh');
  writeFileSync(
    gh,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
const name = args[args.indexOf('-f') + 1].slice('check_name='.length);
const runs = JSON.parse(process.env.FAKE_RUNS)[name] ?? [];
if (runs === 'error') process.exit(1);
const jq = args[args.indexOf('--jq') + 1];
const response = { check_runs: runs.map(([slug, conclusion, started_at]) => ({ app: { slug }, conclusion, started_at })) };
process.stdout.write(require('node:child_process').execFileSync('jq', ['-r', jq], { input: JSON.stringify(response) }));
`,
  );
  chmodSync(gh, 0o755);
  const run = (runs) => {
    const output = path.join(directory, 'output');
    writeFileSync(output, '');
    const result = spawnSync('bash', ['-e', '-c', step.run], {
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        FAKE_RUNS: JSON.stringify(runs),
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: path.join(directory, 'summary'),
        REPO: 'nocobase/nocobase',
        BASE_SHA: 'a'.repeat(40),
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const outputs = Object.fromEntries(
      readFileSync(output, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => [
          line.slice(0, line.indexOf('=')),
          line.slice(line.indexOf('=') + 1),
        ]),
    );
    return { ...outputs, smoke_matrix: JSON.parse(outputs.smoke_matrix) };
  };
  const passed = [['nocobase', 'success', '2026-11-12T17:20:00Z']];
  const all = {
    Test: passed,
    'Create-app smoke (default)': passed,
    'Create-app smoke (examples)': passed,
  };
  assert.deepEqual(run(all), {
    passed: 'true',
    smoke_matrix: [
      { template: 'default', project: 'none' },
      { template: 'examples', project: 'none' },
    ],
  });
  const full = {
    passed: 'false',
    smoke_matrix: [
      { template: 'default', project: 'all' },
      { template: 'examples', project: 'node' },
      { template: 'examples', project: 'client' },
    ],
  };
  for (const runs of [
    // Quality has not run, or not on this commit.
    {},
    // One check failed, or is still running.
    { ...all, 'Create-app smoke (examples)': [['nocobase', 'failure', 'x']] },
    { ...all, Test: [['nocobase', null, '2026-11-12T17:20:00Z']] },
    // A check run of the same name from another app does not count.
    { ...all, Test: [['github-actions', 'success', 'x']] },
    // The latest attempt decides: a re-run that failed after a success.
    {
      ...all,
      Test: [
        ['nocobase', 'success', '2026-11-12T17:20:00Z'],
        ['nocobase', 'failure', '2026-11-12T18:20:00Z'],
      ],
    },
    // The API is unavailable.
    { ...all, Test: 'error' },
  ]) {
    assert.deepEqual(run(runs), full, JSON.stringify(runs));
  }
});

test('Pro publishing passes the private registry and token independently', () => {
  for (const name of ['pro-release']) {
    const source = workflow(name);
    assert.match(
      source,
      /registry-url: \$\{\{ secrets\.PRO_NPM_REGISTRY \}\}/u,
    );
    assert.match(source, /--registry "\$PRO_NPM_REGISTRY"/u);
    assert.match(
      source,
      /NODE_AUTH_TOKEN: \$\{\{ secrets\.PRO_NPM_TOKEN \}\}/u,
    );
    assert.doesNotMatch(
      source,
      /registry-url: https:\/\/registry\.npmjs\.org|--registry https:\/\/registry\.npmjs\.org/u,
    );
  }
});

test('Pro workflows retain the branch arguments supported by their source-owned sync script', () => {
  // The standalone release selects the OSS commit once in prepare and pins every job to it. --branch develop names the
  // open-source v3 line to Pro's scripts, not the Pro branch.
  assert.match(
    workflow('pro-release'),
    /sync-release-oss\.mjs --branch develop --sha "\$OSS_SHA"/u,
  );
  assert.match(
    workflow('release'),
    /sync-release-oss\.mjs --branch develop --candidate "\$SOURCE_SHA" --base "\$BASE_SHA"/u,
  );
});

test('batch numbering counts the tags of both channels and emits a separate public tag', (t) => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'v3-beta-tags-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  git('init', '-b', 'main');
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '--allow-empty',
    '-m',
    'fixture',
  );
  git('remote', 'add', 'origin', cwd);
  const day = new Date().toISOString().slice(0, 10);
  const source = workflow('release');
  const step = source
    .split('      - name: Create release branch\n')[1]
    .split('      - name: Version\n')[0];
  const script = step.split('        run: |\n')[1].replace(/^ {10}/gm, '');
  const run = (channel, branchPrefix) => {
    git('checkout', '-q', '--detach');
    const output = path.join(cwd, `outputs-${channel}`);
    execFileSync('bash', ['-e', '-c', script], {
      cwd,
      env: {
        ...process.env,
        GITHUB_OUTPUT: output,
        CHANNEL: channel,
        BRANCH_PREFIX: branchPrefix,
      },
      stdio: 'pipe',
    });
    return readFileSync(output, 'utf8');
  };

  git('tag', `release-beta/${day}.9`);
  git('tag', `nocobase-v3-beta/${day}.10`);
  let output = run('beta', 'release-beta');
  assert.match(output, new RegExp(`tag=nocobase-v3-beta/${day}\\.11\n`));
  assert.match(output, new RegExp(`name=release-beta/${day}\\.11\n`));

  // A stable tag of the same day counts too, in either direction.
  git('tag', `nocobase-v3/${day}.12`);
  output = run('beta', 'release-beta');
  assert.match(output, new RegExp(`tag=nocobase-v3-beta/${day}\\.13\n`));
  git('tag', `release/${day}.99`);
  output = run('stable', 'release');
  assert.match(output, new RegExp(`tag=nocobase-v3/${day}\\.100\n`));
  assert.match(output, new RegExp(`name=release/${day}\\.100\n`));

  assert.match(source, /TAG: \$\{\{ steps\.branch\.outputs\.tag \}\}/u);
  assert.match(
    source,
    /tag: \$\{\{ needs\.prepare\.outputs\.release_tag \}\}/u,
  );
  assert.match(source, /git tag "\$RELEASE_TAG"/u);
  assert.match(
    source,
    /git push origin "refs\/tags\/\$\{RELEASE_TAG\}:refs\/tags\/\$\{RELEASE_TAG\}"/u,
  );
});

// The channel comes from the release base's pre.json, and decides the dist-tags, the transition step, and the texts.
test('the release derives its channel from pre.json and points beta at stable releases only during the transition', () => {
  const release = parse(workflow('release'));
  const channel = release.jobs.prepare.steps.find(
    (candidate) => candidate.id === 'channel',
  );
  assert.equal(
    channel.run,
    'node ../scripts/release-channel.mjs --root . --name v3',
  );
  for (const key of ['channel', 'branch_prefix', 'dist_tag', 'dist_tags'])
    assert.equal(
      release.jobs.prepare.outputs[key],
      `\${{ steps.channel.outputs.${key} }}`,
      key,
    );
  const steps = release.jobs.release.steps;
  const pointer = steps.find(
    (candidate) =>
      candidate.name === 'Point the release dist-tags at this release',
  );
  assert.equal(pointer.env.DIST_TAGS, '${{ needs.prepare.outputs.dist_tags }}');
  assert.match(pointer.run, /for TAG in \$DIST_TAGS; do/u);
  const transition = steps.find(
    (candidate) =>
      candidate.name === 'Transition: point beta at this stable release',
  );
  assert.equal(
    transition.if,
    "!inputs.dry_run && needs.prepare.outputs.channel == 'stable'",
  );
  assert.match(transition.run, /npm dist-tag add "\$SPEC" beta/u);
  // Both Pro jobs that version Pro verify that Pro is in the same channel.
  for (const job of ['pro-check', 'pro-candidate']) {
    const verify = release.jobs[job].steps.find(
      (candidate) => candidate.id === 'pro_channel',
    );
    assert.match(verify.run, /--expect "\$CHANNEL"/u, job);
    assert.equal(
      verify.env.CHANNEL,
      '${{ needs.prepare.outputs.channel }}',
      job,
    );
  }
  const pro = release.jobs['pro-release'].steps;
  assert.ok(
    pro.find(
      (candidate) =>
        candidate.name === 'Transition: point beta at this stable Pro release',
    ),
  );
  const proRelease = parse(workflow('pro-release'));
  assert.ok(
    proRelease.jobs.release.steps.find(
      (candidate) =>
        candidate.name === 'Transition: point beta at this stable Pro release',
    ),
  );
});

test('GitHub Release titles identify Beta releases, and a stable release takes Latest', () => {
  const source = workflow('github-release');
  const script = source
    .match(/ {10}case "\$TAG" in([\s\S]*?) {10}esac/u)[0]
    .replace(/^ {10}/gm, '');
  const expected = {
    'nocobase-v3': 'NocoBase v3 · 2026-10-28.2\n--latest\n',
    'nocobase-v3-beta':
      'NocoBase v3 Beta · 2026-10-28.2\n--prerelease --latest=false\n',
    'release-beta':
      'NocoBase v3 Beta · 2026-10-28.2\n--prerelease --latest=false\n',
    release: '2026-10-28.2\n--latest=false\n',
  };
  for (const [prefix, output] of Object.entries(expected)) {
    const actual = execFileSync(
      'bash',
      ['-e', '-c', script + '\nprintf "%s\n" "$TITLE" "${FLAGS[*]}"'],
      {
        env: { ...process.env, TAG: `${prefix}/2026-10-28.2` },
        encoding: 'utf8',
      },
    );
    assert.equal(actual, output, prefix);
  }
});
