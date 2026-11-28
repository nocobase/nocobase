import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  checkRunner,
  createGit,
  formatReport,
  isRuntimeFile,
  parseCatalogs,
  previousReleaseTag,
  runtimeClosure,
  workspacePackages,
} from '../studio-release-runner-check.mjs';

const script = fileURLToPath(
  new URL('../studio-release-runner-check.mjs', import.meta.url),
);

/** A framework repository shaped like v3: the runner, its runtime dependencies and unrelated packages. */
function framework() {
  const dir = mkdtempSync(path.join(tmpdir(), 'runner-check-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 't',
        GIT_AUTHOR_EMAIL: 't@example.com',
        GIT_COMMITTER_NAME: 't',
        GIT_COMMITTER_EMAIL: 't@example.com',
      },
    }).trim();
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(
      path.join(dir, file),
      typeof content === 'string'
        ? content
        : `${JSON.stringify(content, null, 2)}\n`,
    );
  };
  const edit = (file, change) => {
    const manifest = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    change(manifest);
    write(file, manifest);
  };
  const commit = (message) => {
    git('add', '-A');
    git('commit', '-q', '--allow-empty', '-m', message);
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'v3');
  write(
    'pnpm-workspace.yaml',
    "packages:\n  - packages/*/*\ncatalog:\n  zod: 4.1.0\n  'yaml': 2.8.0\n  pino: 9.0.0 # logging\ncatalogs:\n  legacy:\n    tar: 6.0.0\noverrides:\n  zod: 4.1.0\n",
  );
  write('packages/app/agent-runner/package.json', {
    name: '@nocobase/agent-runner',
    version: '0.1.0-beta.34',
    bin: { 'nocobase-runner': './bin/run.js' },
    files: ['bin', 'dist'],
    dependencies: {
      '@nocobase/agent-protocol': 'workspace:*',
      '@nocobase/logging': 'workspace:^',
      yaml: 'catalog:',
    },
    devDependencies: {
      '@nocobase/dev-config': 'workspace:*',
      vitest: 'catalog:',
    },
  });
  write('packages/app/agent-runner/bin/run.js', 'run();\n');
  write('packages/app/agent-runner/src/index.ts', 'export const a = 1;\n');
  write('packages/app/agent-runner/src/index.test.ts', 'test();\n');
  write('packages/app/agent-runner/tests/run.test.ts', 'test();\n');
  write('packages/app/agent-runner/README.md', '# Runner\n');
  write('packages/libs/agent-protocol/package.json', {
    name: '@nocobase/agent-protocol',
    version: '0.1.0-beta.20',
    files: ['dist'],
    dependencies: { zod: 'catalog:' },
  });
  write('packages/libs/agent-protocol/src/index.ts', 'export const p = 1;\n');
  write('packages/libs/logging/package.json', {
    name: '@nocobase/logging',
    version: '0.1.0',
    files: ['dist'],
    dependencies: { pino: 'catalog:', tar: 'catalog:legacy' },
  });
  write('packages/libs/logging/src/index.ts', 'export const l = 1;\n');
  write('packages/libs/dev-config/package.json', {
    name: '@nocobase/dev-config',
    version: '1.0.0',
  });
  write('packages/plugins/app-plugin-projects/package.json', {
    name: '@nocobase/app-plugin-projects',
    version: '3.0.0',
    dependencies: { '@nocobase/agent-protocol': 'workspace:*' },
  });
  write('packages/plugins/app-plugin-projects/src/index.ts', 'export {};\n');
  write('.changeset/README.md', '# Changesets\n');
  const released = commit('chore: release 0.1.0-beta.34');
  return { dir, git, write, edit, commit, released };
}

const check = (repo, target, previous) =>
  checkRunner(createGit(repo.dir), { target, previous });

test('the runtime closure follows runtime workspace dependencies only', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  const packages = workspacePackages(createGit(repo.dir), repo.released);
  assert.deepEqual(runtimeClosure(packages), [
    '@nocobase/agent-runner',
    '@nocobase/agent-protocol',
    '@nocobase/logging',
  ]);
});

test('runtime files are sources other than tests and the shipped entries other than built output', () => {
  const manifest = { files: ['bin', 'dist', './node-guard.js', 'README.md'] };
  for (const [file, expected] of [
    ['src/index.ts', true],
    ['src/agent/client.ts', true],
    ['src/index.test.ts', false],
    ['src/__tests__/a.ts', false],
    ['src/fixtures/a.json', false],
    ['tests/run.test.ts', false],
    ['bin/run.js', true],
    ['node-guard.js', true],
    ['dist/index.js', false],
    ['README.md', false],
    ['CHANGELOG.md', false],
    ['docs/usage.md', false],
    ['vitest.config.ts', false],
  ])
    assert.equal(isRuntimeFile(file, manifest), expected, file);
});

test('catalogs are read from pnpm-workspace.yaml without a YAML parser', () => {
  const catalogs = parseCatalogs(
    "packages:\n  - x\ncatalog:\n  # comment\n  zod: 4.1.0\n  '@scope/a': ^1.2.0 # note\n  \"b\": '2'\ncatalogs:\n  legacy:\n    tar: 6.0.0\noverrides:\n  zod: 9.9.9\n",
  );
  assert.deepEqual(Object.fromEntries(catalogs.get('default')), {
    zod: '4.1.0',
    '@scope/a': '^1.2.0',
    b: '2',
  });
  assert.deepEqual(Object.fromEntries(catalogs.get('legacy')), {
    tar: '6.0.0',
  });
});

test('the previous release is the highest Studio tag below the version', () => {
  const refs = [
    'refs/tags/v1.0.0-beta.9',
    'refs/tags/v1.0.0-beta.91',
    'refs/tags/v1.0.0-beta.92',
    'refs/tags/v1.0.0',
    'refs/tags/nightly',
    'refs/tags/v1.0.0-beta.100',
  ];
  assert.equal(previousReleaseTag('1.0.0-beta.93', refs), 'v1.0.0-beta.92');
  assert.equal(previousReleaseTag('1.0.0-beta.92', refs), 'v1.0.0-beta.91');
  assert.equal(previousReleaseTag('1.0.0-beta.101', refs), 'v1.0.0-beta.100');
  assert.equal(previousReleaseTag('1.0.1', refs), 'v1.0.0');
  assert.equal(previousReleaseTag('1.0.0-beta.1', refs), null);
});

test('an unreleased runner source change stops the release even without a changeset', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 2;\n');
  const target = repo.commit('fix(agent-runner): change');
  const result = check(repo, target);
  assert.equal(result.ok, false);
  assert.equal(result.version, '0.1.0-beta.34');
  assert.equal(result.baselines[0].kind, 'framework');
  assert.equal(result.baselines[0].commit, repo.released);
  assert.deepEqual(result.baselines[0].packages, [
    {
      name: '@nocobase/agent-runner',
      dir: 'packages/app/agent-runner',
      files: ['src/index.ts'],
    },
  ]);
  assert.deepEqual(result.changesets, []);
  const report = formatReport(result);
  assert.match(report, /0\.1\.0-beta\.34/);
  assert.match(report, new RegExp(repo.released));
  assert.match(report, /packages\/app\/agent-runner\): src\/index\.ts/);
  assert.match(report, /V3 Release/);
  assert.match(report, /vendor\/nocobase3/);
});

test('dependency, bin, catalog and shared package changes are caught, with pending changesets listed', (t) => {
  for (const [name, change, expected] of [
    [
      'dependency declaration',
      (repo) =>
        repo.edit(
          'packages/app/agent-runner/package.json',
          (m) => (m.dependencies.ini = '6.0.0'),
        ),
      /agent-runner .*package\.json \(dependencies\)/,
    ],
    [
      'bin',
      (repo) => repo.write('packages/app/agent-runner/bin/run.js', 'run(2);\n'),
      /bin\/run\.js/,
    ],
    [
      'shared package source',
      (repo) =>
        repo.write(
          'packages/libs/agent-protocol/src/index.ts',
          'export const p = 2;\n',
        ),
      /agent-protocol .*src\/index\.ts/,
    ],
    [
      'catalog version',
      (repo) =>
        repo.write(
          'pnpm-workspace.yaml',
          readFileSync(
            path.join(repo.dir, 'pnpm-workspace.yaml'),
            'utf8',
          ).replace("zod: 4.1.0\n  'yaml'", "zod: 4.2.0\n  'yaml'"),
        ),
      /catalog zod: 4\.1\.0 -> 4\.2\.0 \(used by @nocobase\/agent-protocol\)/,
    ],
    [
      'named catalog version',
      (repo) =>
        repo.write(
          'pnpm-workspace.yaml',
          readFileSync(
            path.join(repo.dir, 'pnpm-workspace.yaml'),
            'utf8',
          ).replace('tar: 6.0.0', 'tar: 7.0.0'),
        ),
      /catalog:legacy tar: 6\.0\.0 -> 7\.0\.0/,
    ],
    [
      'new runtime dependency package',
      (repo) => {
        repo.write('packages/libs/cli-envelope/package.json', {
          name: '@nocobase/cli-envelope',
          version: '0.1.0',
          files: ['dist'],
        });
        repo.write('packages/libs/cli-envelope/src/index.ts', 'export {};\n');
        repo.edit(
          'packages/libs/logging/package.json',
          (m) => (m.dependencies['@nocobase/cli-envelope'] = 'workspace:^'),
        );
      },
      /cli-envelope .*\(package added\)/,
    ],
  ]) {
    const repo = framework();
    t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
    change(repo);
    repo.write(
      '.changeset/runner-fix.md',
      '---\n"@nocobase/agent-runner": patch\n"@nocobase/app-plugin-projects": patch\n---\n\nFix.\n',
    );
    const result = check(repo, repo.commit(`change ${name}`));
    assert.equal(result.ok, false, name);
    const report = formatReport(result);
    assert.match(report, expected, `${name}\n${report}`);
    assert.deepEqual(
      result.changesets,
      [
        {
          file: '.changeset/runner-fix.md',
          packages: ['@nocobase/agent-runner'],
        },
      ],
      name,
    );
    assert.match(
      report,
      /\.changeset\/runner-fix\.md: @nocobase\/agent-runner/,
    );
  }
});

test('unrelated packages, runner tests, documentation and dev dependencies do not stop the release', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write(
    'packages/plugins/app-plugin-projects/src/index.ts',
    'export const changed = true;\n',
  );
  repo.write('packages/app/agent-runner/src/index.test.ts', 'test(2);\n');
  repo.write('packages/app/agent-runner/tests/run.test.ts', 'test(2);\n');
  repo.write('packages/app/agent-runner/README.md', '# Runner, explained\n');
  repo.write('packages/app/agent-runner/CHANGELOG.md', '# Changelog\n');
  repo.edit(
    'packages/app/agent-runner/package.json',
    (m) => (m.devDependencies.eslint = 'catalog:'),
  );
  repo.write(
    'pnpm-workspace.yaml',
    readFileSync(path.join(repo.dir, 'pnpm-workspace.yaml'), 'utf8').replace(
      'overrides:',
      'overrides:\n  hono: 4.0.0',
    ),
  );
  repo.write(
    '.changeset/projects.md',
    '---\n"@nocobase/app-plugin-projects": patch\n---\n\nProjects.\n',
  );
  const result = check(repo, repo.commit('feat(projects): unrelated'));
  assert.equal(result.ok, true, formatReport(result));
  assert.deepEqual(result.changesets, []);
});

test('a new runner version passes against its own release commit', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 2;\n');
  const previous = repo.commit('fix(agent-runner): change');
  repo.edit(
    'packages/app/agent-runner/package.json',
    (m) => (m.version = '0.1.0-beta.35'),
  );
  const release = repo.commit('chore: release 0.1.0-beta.35');
  repo.write(
    'packages/plugins/app-plugin-projects/src/index.ts',
    'export const later = true;\n',
  );
  const target = repo.commit('feat(projects): later');
  const result = check(repo, target, {
    tag: 'v1.0.0-beta.92',
    commit: previous,
  });
  assert.equal(result.ok, true, formatReport(result));
  assert.equal(result.version, '0.1.0-beta.35');
  assert.deepEqual(
    result.baselines.map((b) => [b.kind, b.commit]),
    [['framework', release]],
  );
  assert.match(
    formatReport(result),
    /Studio v1\.0\.0-beta\.92 shipped @nocobase\/agent-runner 0\.1\.0-beta\.34, not 0\.1\.0-beta\.35/,
  );
});

test('the previous Studio release is a second baseline when it shipped the same version', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write('packages/libs/logging/src/index.ts', 'export const l = 2;\n');
  const shipped = repo.commit('fix(logging): change shipped by Studio');
  const unchanged = check(repo, shipped, {
    tag: 'v1.0.0-beta.91',
    commit: shipped,
  });
  assert.equal(unchanged.ok, false);
  assert.deepEqual(
    unchanged.baselines.map((b) => [b.kind, b.changed]),
    [
      ['framework', true],
      ['studio', false],
    ],
  );
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 3;\n');
  const result = check(repo, repo.commit('fix(agent-runner): later change'), {
    tag: 'v1.0.0-beta.91',
    commit: shipped,
  });
  const studio = result.baselines.find((b) => b.kind === 'studio');
  assert.equal(studio.changed, true);
  assert.deepEqual(
    studio.packages.map((p) => p.name),
    ['@nocobase/agent-runner'],
  );
  assert.match(formatReport(result), /Changed since Studio v1\.0\.0-beta\.91/);
});

test('a version set again after a downgrade uses the newest commit that set it', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.edit(
    'packages/app/agent-runner/package.json',
    (m) => (m.version = '0.1.0-beta.33'),
  );
  repo.commit('revert');
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 4;\n');
  repo.edit(
    'packages/app/agent-runner/package.json',
    (m) => (m.version = '0.1.0-beta.34'),
  );
  const again = repo.commit('chore: release 0.1.0-beta.34 again');
  const result = check(repo, again);
  assert.equal(result.baselines[0].commit, again);
  assert.equal(result.ok, true);
});

test('the command fails a release and a plain dry run, and only warns for source_ref', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 2;\n');
  const target = repo.commit('fix(agent-runner): change');
  const run = (extra) => {
    const out = mkdtempSync(path.join(tmpdir(), 'runner-check-out-'));
    t.after(() => rmSync(out, { recursive: true, force: true }));
    const result = spawnSync(process.execPath, [script, 'check'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        FRAMEWORK_DIR: repo.dir,
        TARGET_OSS_SHA: target,
        PREVIOUS_TAG: '',
        PREVIOUS_OSS_SHA: '',
        SOURCE_REF: '',
        GITHUB_OUTPUT: path.join(out, 'output'),
        GITHUB_STEP_SUMMARY: path.join(out, 'summary'),
        ...extra,
      },
    });
    const read = (name) => {
      try {
        return readFileSync(path.join(out, name), 'utf8');
      } catch {
        return '';
      }
    };
    return { ...result, output: read('output'), summary: read('summary') };
  };
  const release = run({});
  assert.equal(release.status, 1, release.stderr);
  assert.match(
    release.stdout,
    /::error::@nocobase\/agent-runner 0\.1\.0-beta\.34 would ship/,
  );
  assert.match(
    release.output,
    /runner_version=0\.1\.0-beta\.34\nrunner_result=changed without a new version\n/,
  );
  assert.match(
    release.summary,
    /packages\/app\/agent-runner\): src\/index\.ts/,
  );
  const pr = run({ SOURCE_REF: 'a'.repeat(40) });
  assert.equal(pr.status, 0, pr.stderr);
  assert.match(pr.stdout, /::warning::/);
  assert.match(pr.stdout, /source_ref validates a pull request build/);
  assert.match(
    pr.output,
    /runner_result=changed without a new version \(warning only: source_ref\)/,
  );
  const missing = run({ TARGET_OSS_SHA: 'b'.repeat(40) });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /is not available/);
});

test('the command refuses a shallow framework history', (t) => {
  const repo = framework();
  t.after(() => rmSync(repo.dir, { recursive: true, force: true }));
  repo.write('packages/app/agent-runner/src/index.ts', 'export const a = 2;\n');
  const target = repo.commit('fix(agent-runner): change');
  const shallow = mkdtempSync(path.join(tmpdir(), 'runner-check-shallow-'));
  t.after(() => rmSync(shallow, { recursive: true, force: true }));
  execFileSync('git', [
    'clone',
    '-q',
    '--depth',
    '1',
    `file://${repo.dir}`,
    shallow,
  ]);
  assert.throws(() => checkRunner(createGit(shallow), { target }), /shallow/);
});

test('the previous-tag command reads tag refs on stdin', () => {
  const result = spawnSync(
    process.execPath,
    [script, 'previous-tag', '1.0.0-beta.93'],
    {
      encoding: 'utf8',
      input:
        'refs/tags/v1.0.0-beta.91\nrefs/tags/v1.0.0-beta.92\nrefs/tags/v1.0.0-beta.93\n',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'v1.0.0-beta.92\n');
});
