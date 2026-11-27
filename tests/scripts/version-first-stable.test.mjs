import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  FIRST_STABLE_NOTE,
  addFirstStableNote,
  firstStableChangelog,
} from '../../scripts/version-first-stable.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const script = path.join(repositoryRoot, 'scripts/version-first-stable.mjs');
const requireFromRoot = createRequire(
  path.join(repositoryRoot, 'package.json'),
);
// The repository's own changesets and the generator .changeset/config.json names.
const changesetsCli = path.dirname(
  requireFromRoot.resolve('@changesets/cli/package.json'),
);
const generatorOptions = {
  generator: pathToFileURL(requireFromRoot.resolve('@changesets/cli/changelog'))
    .href,
  options: null,
};

test('the note goes under the new heading and leaves the older sections alone', () => {
  const before =
    '# @nocobase/example\n\n## 1.0.0\n\n### Patch Changes\n\n- abc1234: Fix it.\n\n## 1.0.0-beta.2\n\n### Patch Changes\n\n- def5678: Older.\n';
  const after = addFirstStableNote(before, '1.0.0');
  assert.equal(
    after,
    `# @nocobase/example\n\n## 1.0.0\n\n${FIRST_STABLE_NOTE}\n\n### Patch Changes\n\n- abc1234: Fix it.\n\n## 1.0.0-beta.2\n\n### Patch Changes\n\n- def5678: Older.\n`,
  );
  assert.equal(addFirstStableNote(after, '1.0.0'), after);
  // A release with nothing new since the last beta has a bare heading.
  assert.equal(
    addFirstStableNote(
      '# @nocobase/example\n\n## 1.0.0\n\n## 1.0.0-beta.2\n',
      '1.0.0',
    ),
    `# @nocobase/example\n\n## 1.0.0\n\n${FIRST_STABLE_NOTE}\n\n## 1.0.0-beta.2\n`,
  );
  assert.equal(
    addFirstStableNote('# @nocobase/example\n\n## 1.0.0\n', '1.0.0'),
    `# @nocobase/example\n\n## 1.0.0\n\n${FIRST_STABLE_NOTE}\n`,
  );
});

test('the note refuses a changelog whose newest section is not the released version', () => {
  assert.throws(
    () =>
      addFirstStableNote(
        '# @nocobase/example\n\n## 1.0.0-beta.2\n\n## 1.0.0\n',
        '1.0.0',
      ),
    /expected the first version heading to be "## 1\.0\.0", found "## 1\.0\.0-beta\.2"/u,
  );
  assert.throws(
    () => addFirstStableNote('# @nocobase/example\n', '1.0.0'),
    /found none/u,
  );
  // A longer version sharing the prefix is a different heading.
  assert.throws(
    () => addFirstStableNote('# @nocobase/example\n\n## 1.0.01\n', '1.0.0'),
    /found "## 1\.0\.01"/u,
  );
});

test('the generator leaves out the entries of prerelease changesets and passes the others through', async () => {
  const pending = {
    id: 'fix-it',
    summary: 'Fix it.\n\nIn more detail.',
    releases: [],
    commit: 'abc1234abc1234',
  };
  const released = { ...pending, id: 'pre/fix-it', summary: 'Released.' };
  assert.equal(
    await firstStableChangelog.getReleaseLine(
      released,
      'minor',
      generatorOptions,
    ),
    '',
  );
  assert.equal(
    await firstStableChangelog.getReleaseLine(
      pending,
      'minor',
      generatorOptions,
    ),
    '- abc1234: Fix it.\n  \n  In more detail.',
  );
});

test('the dependency line names only the pending changesets, and the updated versions always', async () => {
  const dependencies = [{ name: '@nocobase/a', newVersion: '1.0.0' }];
  const pending = {
    id: 'fix-a',
    summary: '',
    releases: [],
    commit: '1111111aaaa',
  };
  const released = ['pre/one', 'pre/two'].map((id, index) => ({
    id,
    summary: '',
    releases: [],
    commit: `${index + 2}`.repeat(7),
  }));
  assert.equal(
    await firstStableChangelog.getDependencyReleaseLine(
      [...released, pending],
      dependencies,
      generatorOptions,
    ),
    '- Updated dependencies [1111111]\n  - @nocobase/a@1.0.0',
  );
  assert.equal(
    await firstStableChangelog.getDependencyReleaseLine(
      released,
      dependencies,
      generatorOptions,
    ),
    '- Updated dependencies\n  - @nocobase/a@1.0.0',
  );
  assert.equal(
    await firstStableChangelog.getDependencyReleaseLine(
      released,
      [],
      generatorOptions,
    ),
    '',
  );
});

function git(cwd, ...args) {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=Release Test',
      '-c',
      'user.email=release@example.invalid',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, encoding: 'utf8' },
  ).trim();
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeChangeset(root, id, releases, summary) {
  const file = path.join(root, '.changeset', `${id}.md`);
  mkdirSync(path.dirname(file), { recursive: true });
  const header = Object.entries(releases)
    .map(([name, type]) => `"${name}": ${type}`)
    .join('\n');
  writeFileSync(file, `---\n${header}\n---\n\n${summary}\n`);
}

const CONFIG = `${JSON.stringify(
  {
    changelog: '@changesets/cli/changelog',
    commit: false,
    format: false,
    access: 'public',
    baseBranch: 'main',
    updateInternalDependencies: 'patch',
  },
  null,
  2,
)}\n`;

// A workspace one beta into prerelease mode, after `changeset pre exit`: @nocobase/a released 1.0.0-beta.0 with the
// changeset now in .changeset/pre/, and @nocobase/b depends on it. One changeset arrived after that beta.
function exitingWorkspace(t, { mode = 'exit' } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'version-first-stable-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, 'package.json'), {
    name: 'fixture',
    private: true,
  });
  writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*/*\n',
  );
  mkdirSync(path.join(root, 'node_modules/@changesets'), { recursive: true });
  symlinkSync(changesetsCli, path.join(root, 'node_modules/@changesets/cli'));
  writeFileSync(path.join(root, '.gitignore'), 'node_modules\n');
  writeJson(path.join(root, 'packages/libs/a/package.json'), {
    name: '@nocobase/a',
    version: '1.0.0-beta.0',
  });
  writeFileSync(
    path.join(root, 'packages/libs/a/CHANGELOG.md'),
    '# @nocobase/a\n\n## 1.0.0-beta.0\n\n### Minor Changes\n\n- 0000000: Add the first feature.\n',
  );
  writeJson(path.join(root, 'packages/libs/b/package.json'), {
    name: '@nocobase/b',
    version: '2.0.0-beta.3',
    dependencies: { '@nocobase/a': 'workspace:^' },
  });
  writeFileSync(
    path.join(root, 'packages/libs/b/CHANGELOG.md'),
    '# @nocobase/b\n\n## 2.0.0-beta.3\n\n### Patch Changes\n\n- Updated dependencies [0000000]\n  - @nocobase/a@1.0.0-beta.0\n',
  );
  mkdirSync(path.join(root, '.changeset'), { recursive: true });
  writeFileSync(path.join(root, '.changeset/config.json'), CONFIG);
  writeJson(path.join(root, '.changeset/pre.json'), { mode, tag: 'beta' });
  writeChangeset(
    root,
    'pre/first-feature',
    { '@nocobase/a': 'minor' },
    'Add the first feature.',
  );
  git(root, 'init', '--quiet', '--initial-branch=main');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '-m', 'beta');
  writeChangeset(
    root,
    'late-fix',
    { '@nocobase/a': 'patch' },
    'Fix the first feature.',
  );
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '-m', 'fix');
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [script, '--root', root], {
    encoding: 'utf8',
  });
}

function read(root, file) {
  return readFileSync(path.join(root, file), 'utf8');
}

test('the first stable section lists only what came after the last beta', (t) => {
  const root = exitingWorkspace(t);
  const fix = git(root, 'rev-parse', '--short=7', 'HEAD');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /left the entries of 1 prerelease changesets out of the new CHANGELOG sections and noted 2 changelogs/u,
  );

  assert.equal(
    JSON.parse(read(root, 'packages/libs/a/package.json')).version,
    '1.0.0',
  );
  assert.equal(
    read(root, 'packages/libs/a/CHANGELOG.md'),
    `# @nocobase/a\n\n## 1.0.0\n\n${FIRST_STABLE_NOTE}\n\n### Patch Changes\n\n- ${fix}: Fix the first feature.\n\n## 1.0.0-beta.0\n\n### Minor Changes\n\n- 0000000: Add the first feature.\n`,
  );
  assert.equal(
    read(root, 'packages/libs/b/CHANGELOG.md'),
    `# @nocobase/b\n\n## 2.0.0\n\n${FIRST_STABLE_NOTE}\n\n### Patch Changes\n\n- Updated dependencies [${fix}]\n  - @nocobase/a@1.0.0\n\n## 2.0.0-beta.3\n\n### Patch Changes\n\n- Updated dependencies [0000000]\n  - @nocobase/a@1.0.0-beta.0\n`,
  );

  // changesets leaves prerelease mode as it always does, and the generator configured for the run is gone again.
  assert.equal(existsSync(path.join(root, '.changeset/pre.json')), false);
  assert.equal(
    existsSync(path.join(root, '.changeset/pre/first-feature.md')),
    false,
  );
  assert.equal(existsSync(path.join(root, '.changeset/late-fix.md')), false);
  assert.equal(read(root, '.changeset/config.json'), CONFIG);
});

test('a prerelease that ends with nothing new still releases every package, each with the note', (t) => {
  const root = exitingWorkspace(t);
  git(root, 'reset', '--quiet', '--hard', 'HEAD~1');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    read(root, 'packages/libs/a/CHANGELOG.md'),
    `# @nocobase/a\n\n## 1.0.0\n\n${FIRST_STABLE_NOTE}\n\n## 1.0.0-beta.0\n\n### Minor Changes\n\n- 0000000: Add the first feature.\n`,
  );
  assert.match(
    read(root, 'packages/libs/b/CHANGELOG.md'),
    new RegExp(
      `^# @nocobase/b\\n\\n## 2\\.0\\.0\\n\\n${FIRST_STABLE_NOTE.replaceAll('.', '\\.')}\\n\\n### Patch Changes\\n\\n- Updated dependencies\\n  - @nocobase/a@1\\.0\\.0\\n\\n## 2\\.0\\.0-beta\\.3\\n`,
      'u',
    ),
  );
});

test('versioning the same commit again gives the same tree', (t) => {
  const root = exitingWorkspace(t);
  const trees = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    git(root, 'reset', '--quiet', '--hard', 'HEAD');
    git(root, 'clean', '--quiet', '-fd');
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    git(root, 'add', '--all');
    trees.push(git(root, 'write-tree'));
  }
  assert.equal(trees[0], trees[1]);
});

test('only the release that leaves prerelease mode is versioned this way', (t) => {
  const root = exitingWorkspace(t, { mode: 'pre' });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not have mode "exit"/u);
  assert.equal(git(root, 'status', '--porcelain'), '');
});
