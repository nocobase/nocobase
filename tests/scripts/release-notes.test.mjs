import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  changelogUrl,
  findPackageDirectories,
  parseAggregateTag,
  parsePackageTag,
  readPackagesFromTags,
  renderPackageTable,
  resolveDirectories,
} from '../../scripts/release-notes.mjs';

test('lists every published package with a link to its changelog at the tagged commit', () => {
  const commit = 'ab1f9c76f55cafc60f4966c2617170b96aaebb54';
  const url = changelogUrl(
    commit,
    'packages/tools/app-installer/CHANGELOG.md',
    '0.1.0-beta.10',
  );
  assert.equal(
    url,
    `https://github.com/nocobase/nocobase/blob/${commit}/packages/tools/app-installer/CHANGELOG.md#010-beta10`,
  );
  assert.deepEqual(
    renderPackageTable(
      [
        { name: '@nocobase/app-installer', version: '0.1.0-beta.10' },
        { name: '@nocobase/unknown', version: '1.0.0' },
      ],
      (pkg) => (pkg.name === '@nocobase/app-installer' ? url : undefined),
    ),
    [
      '| Package | Version |',
      '| --- | --- |',
      `| \`@nocobase/app-installer\` | [0.1.0-beta.10](${url}) |`,
      '| `@nocobase/unknown` | 1.0.0 |',
    ],
  );
});

test('parses beta and stable aggregate tags', () => {
  assert.deepEqual(parseAggregateTag('release-beta/2026-08-26.5'), {
    batch: '2026-08-26.5',
    channel: 'beta',
  });
  assert.deepEqual(parseAggregateTag('release/2026-08-27.1'), {
    batch: '2026-08-27.1',
    channel: 'stable',
  });
});

test('rejects tags that are not aggregate release tags', () => {
  for (const tag of [
    '@nocobase/create-app@0.1.0-beta.4',
    'release-beta/2026-08-26',
    'v1.0.0',
    'release/not-a-date.1',
  ]) {
    assert.throws(
      () => parseAggregateTag(tag),
      /Not an aggregate release tag/u,
    );
  }
});

// Scoped package names contain their own `@`, so only the last one separates
// the version. Splitting on the first would yield an empty name.
test('splits scoped package tags on the final @', () => {
  assert.deepEqual(parsePackageTag('@nocobase/create-app@0.1.0-beta.4'), {
    name: '@nocobase/create-app',
    version: '0.1.0-beta.4',
  });
  assert.deepEqual(parsePackageTag('unscoped@1.2.3'), {
    name: 'unscoped',
    version: '1.2.3',
  });
});

test('ignores tags that are not package tags', () => {
  assert.equal(parsePackageTag('release-beta/2026-08-26.5'), undefined);
  assert.equal(parsePackageTag('@nocobase/create-app'), undefined);
  assert.equal(parsePackageTag('@scope@notaversion'), undefined);
});

test('keeps only package tags, sorted by name', () => {
  assert.deepEqual(
    readPackagesFromTags([
      'release-beta/2026-08-26.4',
      '@nocobase/hub@0.0.1-beta.3',
      '@nocobase/app-template-default@0.0.1-beta.5',
      '@nocobase/create-app@0.1.0-beta.3',
    ]),
    [
      { name: '@nocobase/app-template-default', version: '0.0.1-beta.5' },
      { name: '@nocobase/create-app', version: '0.1.0-beta.3' },
      { name: '@nocobase/hub', version: '0.0.1-beta.3' },
    ],
  );
});

// `packages/` was flat before it was regrouped into `packages/<category>/<package>`, and release notes still get
// rendered from tags cut in either era. A resolver hard-coded to one depth returns an empty map for the other, which
// does not fail — every package just renders without its changelog link. These two cases pin both layouts down.
for (const { label, manifests } of [
  {
    label: 'flat',
    manifests: {
      'app-database/package.json': '@nocobase/db',
      'app-template-default/package.json': '@nocobase/app-template-default',
    },
  },
  {
    label: 'grouped',
    manifests: {
      'libs/db/package.json': '@nocobase/db',
      'templates/app-template-default/package.json':
        '@nocobase/app-template-default',
    },
  },
]) {
  test(`resolves package directories from a ${label} tagged tree`, (t) => {
    const { commit, repository } = createTaggedRepository(t, manifests);
    const directories = Object.keys(manifests).map((file) =>
      file.slice(0, -'/package.json'.length),
    );

    assert.deepEqual(
      findPackageDirectories(commit, { cwd: repository }).sort(),
      [...directories].sort(),
    );
    const byName = resolveDirectories(
      commit,
      findPackageDirectories(commit, { cwd: repository }),
      { cwd: repository },
    );

    assert.deepEqual(
      [...byName].sort(([left], [right]) => left.localeCompare(right)),
      [
        ['@nocobase/app-template-default', directories[1]],
        ['@nocobase/db', directories[0]],
      ],
    );
  });
}

// A manifest nested inside a package is never a published package of its own — app-host ships five under
// `fixtures/app-dist/`. It must not displace the package that contains it. `zz-` makes the nested path sort after its
// parent, which is the order that actually breaks a last-writer-wins map; the real fixtures happen to sort the other
// way, so a test using their names would pass even against a resolver that shadows.
test('drops manifests nested inside a package', (t) => {
  const { commit, repository } = createTaggedRepository(t, {
    'app/app-host/package.json': '@nocobase/app-host',
    'app/app-host/zz-fixtures/demo/package.json': '@example/demo-app',
  });

  assert.deepEqual(findPackageDirectories(commit, { cwd: repository }), [
    'app/app-host',
  ]);

  const byName = resolveDirectories(
    commit,
    findPackageDirectories(commit, { cwd: repository }),
    { cwd: repository },
  );

  assert.equal(byName.get('@nocobase/app-host'), 'app/app-host');
  assert.equal(byName.has('@example/demo-app'), false);
});

// Returning an empty list here would make every package render "_No changelog entry_" under a green workflow, so an
// unreadable tree has to be an error rather than an empty result.
test('throws when the tagged tree cannot be listed', (t) => {
  const { repository } = createTaggedRepository(t, {
    'libs/alpha/package.json': '@nocobase/alpha',
  });

  assert.throws(
    () =>
      findPackageDirectories('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef', {
        cwd: repository,
      }),
    /could not be listed/u,
  );
});

function createTaggedRepository(t, manifests) {
  const repository = mkdtempSync(
    path.join(tmpdir(), 'nocobase-release-notes-'),
  );
  t.after(() => rmSync(repository, { force: true, recursive: true }));

  const git = (...args) =>
    execFileSync('git', args, { cwd: repository, encoding: 'utf8' });

  git('init', '--quiet');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');

  for (const [file, name] of Object.entries(manifests)) {
    const target = path.join(repository, 'packages', file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify({ name, version: '1.0.0' })}\n`);
  }

  git('add', '--all');
  git('commit', '--quiet', '--message', 'release');

  return { commit: git('rev-parse', 'HEAD').trim(), repository };
}
