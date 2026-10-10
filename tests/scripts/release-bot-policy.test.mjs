import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const releases = [
  'v3-release-beta.yml',
  'v3-release-stable.yml',
  'v3-merge-beta-to-stable.yml',
];
const identity =
  'nocobase[bot] <179432756+nocobase[bot]@users.noreply.github.com>';

function workflow(name) {
  return readFileSync(path.join(root, '.github/workflows', name), 'utf8');
}

function steps(name) {
  return workflow(name).split(/\n(?=      - name: )/u);
}

test('release candidates and sync commits use the verified NocoBase bot identity', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'release-bot-identity-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', directory]);
  const env = { ...process.env };
  for (const key of [
    'GIT_AUTHOR_NAME',
    'GIT_AUTHOR_EMAIL',
    'GIT_COMMITTER_NAME',
    'GIT_COMMITTER_EMAIL',
  ]) {
    delete env[key];
  }
  let count = 0;
  for (const name of [
    ...releases,
    'v3-pro-release-beta.yml',
    'v3-pro-release-stable.yml',
    'v3-pro-promote-to-stable.yml',
  ]) {
    const source = workflow(name);
    const configurations = source.matchAll(
      /git config user\.name [^\n]+\n\s*git config user\.email [^\n]+/gu,
    );
    let found = false;
    for (const [script] of configurations) {
      found = true;
      execFileSync('bash', ['-e', '-c', script], { cwd: directory, env });
      execFileSync(
        'git',
        [
          '-c',
          'commit.gpgsign=false',
          'commit',
          '--allow-empty',
          '-qm',
          `Release ${++count} [skip ci]`,
        ],
        { cwd: directory, env },
      );
      const actual = execFileSync(
        'git',
        ['show', '-s', '--format=%an <%ae>%n%cn <%ce>', 'HEAD'],
        { cwd: directory, env, encoding: 'utf8' },
      ).trim();
      assert.equal(actual, `${identity}\n${identity}`, name);
    }
    assert.ok(found, `${name} must configure the release identity`);
    assert.doesNotMatch(source, /205678491|41898282/u, name);
  }
});

test('GitHub PR merge commands explicitly skip CI on the newly created merge commit', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'release-bot-merge-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const stub = path.join(directory, 'gh');
  writeFileSync(
    stub,
    '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n',
    { mode: 0o755 },
  );

  for (const name of releases) {
    const source = workflow(name);
    const merges = [...source.matchAll(/^\s*(gh pr merge[^\n]+)$/gmu)];
    assert.ok(merges.length > 0, name);
    for (const [, command] of merges) {
      const output = execFileSync('bash', ['-e', '-c', command], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${directory}${path.delimiter}${process.env.PATH}`,
          PR_URL: 'https://github.com/nocobase/nocobase/pull/1',
          RELEASE_BATCH: '2026-09-22.1',
          BATCH: '2026-09-22.1',
          RELEASE_BASE: 'v3-main',
        },
      });
      const args = JSON.parse(output);
      assert.deepEqual(args.slice(0, 3), [
        'pr',
        'merge',
        'https://github.com/nocobase/nocobase/pull/1',
      ]);
      assert.ok(args.includes('--squash'), name);
      const subjectIndex = args.indexOf('--subject');
      assert.notEqual(subjectIndex, -1, name);
      assert.match(args[subjectIndex + 1], /\[skip ci\]$/u, name);
    }
    const titles = [...source.matchAll(/--title "([^"\n]+)"/gu)];
    assert.ok(titles.length > 0, name);
    for (const [, title] of titles) assert.match(title, /\[skip ci\]$/u, name);
  }
});

test('OSS writes use a fresh scoped App token after validation, including merge APIs', () => {
  for (const name of releases) {
    const source = workflow(name);
    const tokenStep = steps(name).find((step) =>
      step.includes('id: release_token'),
    );
    assert.ok(tokenStep, name);
    assert.match(tokenStep, /if: '!inputs\.dry_run'/u, name);
    assert.match(tokenStep, /uses: actions\/create-github-app-token@v2/u, name);
    assert.match(tokenStep, /repositories: nocobase\n/u, name);
    assert.match(tokenStep, /permission-contents: write/u, name);
    assert.match(tokenStep, /permission-pull-requests: write/u, name);
    assert.match(tokenStep, /permission-workflows: write/u, name);
    const tokenPosition = source.indexOf(tokenStep);
    const validationBoundary = Math.max(
      source.indexOf('      - name: Stop here on dry run'),
      source.indexOf('      - name: Note dry run'),
    );
    assert.ok(validationBoundary !== -1, name);
    assert.ok(tokenPosition > validationBoundary, name);
    assert.match(
      source,
      /RELEASE_TOKEN: \$\{\{ steps\.release_token\.outputs\.token \}\}/u,
      name,
    );
    assert.match(
      source,
      /git remote set-url origin "https:\/\/x-access-token:\$\{RELEASE_TOKEN\}@github\.com\/nocobase\/nocobase\.git"/u,
      name,
    );
    assert.doesNotMatch(
      source,
      /GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/u,
      name,
    );

    for (const step of steps(name)) {
      if (step.includes('gh pr ')) {
        assert.match(
          step,
          /GH_TOKEN: \$\{\{ steps\.release_token\.outputs\.token \}\}/u,
          name,
        );
      }
      if (step.includes('token: ${{ secrets.GITHUB_TOKEN }}')) {
        assert.match(step, /persist-credentials: false/u, name);
      }
      if (step.includes('git push') && !step.includes('echo "  git')) {
        assert.ok(source.indexOf(step) > tokenPosition, name);
        assert.match(step, /if: .*?!inputs\.dry_run/u, name);
      }
    }
  }
});

test('GitHub Releases use the App and receive its private key through workflow_call', () => {
  const source = workflow('v3-github-release.yml');
  assert.match(
    source,
    /    secrets:\n      NOCOBASE_APP_PRIVATE_KEY:\n        required: true/u,
  );
  assert.match(source, /uses: actions\/create-github-app-token@v2/u);
  assert.match(
    source,
    /GH_TOKEN: \$\{\{ steps\.release_token\.outputs\.token \}\}/u,
  );
  assert.doesNotMatch(source, /GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/u);
  for (const name of ['v3-release-beta.yml', 'v3-release-stable.yml']) {
    const caller = workflow(name)
      .split('\n  github-release:')[1]
      .split(/\n  [a-z][\w-]*:/u)[0];
    assert.match(
      caller,
      /NOCOBASE_APP_PRIVATE_KEY: \$\{\{ secrets\.NOCOBASE_APP_PRIVATE_KEY \}\}/u,
      name,
    );
  }
});
