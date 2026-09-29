import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { validateReleaseMessage } from '../../scripts/release-state.mjs';

const execFileAsync = promisify(execFile);
const script = path.resolve(
  import.meta.dirname,
  '../../scripts/release-state.mjs',
);

test('checks only the subject line of a release message', () => {
  const batch = '2026-09-20.1';
  const subject = 'chore: release 2026-09-20.1 [skip ci]';
  const withBody = `${subject}\n\ncurrent app-template-default version: 0.1.0-beta.3`;

  assert.equal(validateReleaseMessage(subject, batch), subject);
  assert.equal(validateReleaseMessage(withBody, batch), withBody);
  for (const message of [
    'chore: release 2026-09-20.2 [skip ci]',
    `${subject} extra`,
    `feat: something\n\n${subject}`,
  ]) {
    assert.throws(
      () => validateReleaseMessage(message, batch),
      /--message must start with/u,
      JSON.stringify(message),
    );
  }
});

test('saves and restores modified, added, and deleted release files without credentials', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release-beta/2026-09-20.1';
  const message = 'chore: release 2026-09-20.1 [skip ci]';
  const output = path.join(fixture.root, 'save-output');
  await writeFile(path.join(fixture.source, 'version.txt'), '2.0.0-beta.1\n');
  await writeFile(path.join(fixture.source, 'added.txt'), 'published\n');
  await rm(path.join(fixture.source, 'deleted.txt'));
  await writeFile(
    path.join(fixture.artifacts, 'versions-before.json'),
    '{"@nocobase/example":"1.0.0-beta.1"}\n',
  );
  await git(
    fixture.source,
    'remote',
    'set-url',
    'origin',
    'https://release-user:super-secret@example.invalid/nocobase.git',
  );
  await git(
    fixture.source,
    'config',
    'http.https://example.invalid/.extraheader',
    'Authorization: Bearer credential-secret',
  );
  const hook = path.join(fixture.source, '.git/hooks/pre-commit');
  await writeFile(hook, '#!/bin/sh\nexit 99\n');
  await chmod(hook, 0o755);

  await releaseState(
    fixture.source,
    'save',
    {
      base: fixture.base,
      branch,
      directory: fixture.artifacts,
      message,
    },
    output,
  );

  const state = JSON.parse(
    await readFile(path.join(fixture.artifacts, 'state.json'), 'utf8'),
  );
  assert.deepEqual(Object.keys(state).sort(), [
    'base',
    'branch',
    'schema',
    'source',
  ]);
  assert.equal(state.base, fixture.base);
  assert.equal(state.branch, branch);
  assert.notEqual(state.source, fixture.base);
  assert.deepEqual((await readdir(fixture.artifacts)).sort(), [
    'candidate.bundle',
    'state.json',
    'versions-before.json',
  ]);
  const artifactContents = Buffer.concat([
    await readFile(path.join(fixture.artifacts, 'state.json')),
    await readFile(path.join(fixture.artifacts, 'candidate.bundle')),
    await readFile(path.join(fixture.artifacts, 'versions-before.json')),
  ]).toString('latin1');
  assert.ok(!artifactContents.includes('super-secret'));
  assert.ok(!artifactContents.includes('credential-secret'));
  assert.match(await readFile(output, 'utf8'), /has_changes=true/u);

  await releaseState(fixture.restore, 'restore', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    expected: state.source,
  });

  assert.equal(
    await readFile(path.join(fixture.restore, 'version.txt'), 'utf8'),
    '2.0.0-beta.1\n',
  );
  assert.equal(
    await readFile(path.join(fixture.restore, 'added.txt'), 'utf8'),
    'published\n',
  );
  await assert.rejects(
    readFile(path.join(fixture.restore, 'deleted.txt')),
    /ENOENT/u,
  );
  assert.equal(await currentBranch(fixture.restore), branch);
  assert.equal(await head(fixture.restore), state.source);
  assert.equal(await status(fixture.restore), '');

  await git(fixture.restore, 'tag', branch);
  assert.equal(
    await revParse(fixture.restore, `refs/heads/${branch}^{commit}`),
    state.source,
  );
  assert.equal(
    await revParse(fixture.restore, `refs/tags/${branch}^{commit}`),
    state.source,
  );
});

test('records a release commit body passed through the command line', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release-beta/2026-09-20.7';
  const message =
    'chore: release 2026-09-20.7 [skip ci]\n\ncurrent app-template-default version: 0.1.0-beta.3';
  await writeFile(path.join(fixture.source, 'version.txt'), '2.0.0-beta.7\n');

  await releaseState(fixture.source, 'save', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    message,
  });

  assert.equal(
    (await git(fixture.source, 'log', '-1', '--format=%B')).stdout.trim(),
    message,
  );
});

test('transfers a stable release containing only metadata changes', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release/2026-09-20.2';
  await writeFile(
    path.join(fixture.source, 'metadata.json'),
    '{"stable":true}\n',
  );

  await releaseState(fixture.source, 'save', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    message: 'chore: release 2026-09-20.2 [skip ci]',
  });
  await writeFile(
    path.join(fixture.source, 'metadata.json'),
    '{"stable":"ready"}\n',
  );
  // A rerun may already be on the local candidate branch. It appends the new release change and replaces only the
  // generated state files, preserving any approved sidecar metadata in the artifact directory.
  await releaseState(fixture.source, 'save', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    message: 'chore: release 2026-09-20.2 [skip ci]',
  });
  const state = JSON.parse(
    await readFile(path.join(fixture.artifacts, 'state.json'), 'utf8'),
  );
  await releaseState(fixture.restore, 'restore', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    expected: state.source,
  });

  assert.equal(
    await readFile(path.join(fixture.restore, 'metadata.json'), 'utf8'),
    '{"stable":"ready"}\n',
  );
  assert.equal(await head(fixture.restore), state.source);
});

test('represents a no-change stable release without an empty bundle', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release/2026-09-20.3';
  const saveOutput = path.join(fixture.root, 'unchanged-save-output');

  await releaseState(
    fixture.source,
    'save',
    {
      base: fixture.base,
      branch,
      directory: fixture.artifacts,
      message: 'chore: release 2026-09-20.3 [skip ci]',
    },
    saveOutput,
  );
  const state = JSON.parse(
    await readFile(path.join(fixture.artifacts, 'state.json'), 'utf8'),
  );
  assert.equal(state.source, fixture.base);
  assert.deepEqual(await readdir(fixture.artifacts), ['state.json']);
  assert.match(await readFile(saveOutput, 'utf8'), /has_changes=false/u);

  await releaseState(fixture.restore, 'restore', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    expected: fixture.base,
  });
  assert.equal(await currentBranch(fixture.restore), branch);
  assert.equal(await head(fixture.restore), fixture.base);
  await git(fixture.restore, 'tag', branch);
  assert.equal(
    await revParse(fixture.restore, `refs/tags/${branch}^{commit}`),
    fixture.base,
  );
});

test('rejects mismatched state and never overwrites a dirty restore checkout', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release-beta/2026-09-20.4';
  await writeFile(path.join(fixture.source, 'version.txt'), '2.0.0-beta.4\n');
  await releaseState(fixture.source, 'save', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    message: 'chore: release 2026-09-20.4 [skip ci]',
  });
  const state = JSON.parse(
    await readFile(path.join(fixture.artifacts, 'state.json'), 'utf8'),
  );
  const originalBranch = await currentBranch(fixture.restore);
  await writeFile(
    path.join(fixture.restore, 'local-work.txt'),
    'do not replace\n',
  );

  const attempts = [
    {
      options: {
        base: '0'.repeat(40),
        branch,
        directory: fixture.artifacts,
        expected: state.source,
      },
      pattern: /does not match/u,
    },
    {
      options: {
        base: fixture.base,
        branch,
        directory: fixture.artifacts,
        expected: '1'.repeat(40),
      },
      pattern: /does not match/u,
    },
    {
      options: {
        base: fixture.base,
        branch: 'release-beta/2026-09-20.5',
        directory: fixture.artifacts,
        expected: state.source,
      },
      pattern: /does not match/u,
    },
    {
      options: {
        base: fixture.base,
        branch,
        directory: fixture.artifacts,
        expected: state.source,
      },
      pattern: /must be clean/u,
    },
  ];

  for (const { options, pattern } of attempts) {
    await assert.rejects(
      releaseState(fixture.restore, 'restore', options),
      pattern,
    );
    assert.equal(await head(fixture.restore), fixture.base);
    assert.equal(await currentBranch(fixture.restore), originalBranch);
    assert.equal(
      await readFile(path.join(fixture.restore, 'local-work.txt'), 'utf8'),
      'do not replace\n',
    );
  }
});

test('writes a restored version commit back through release refs and merge targets', async (t) => {
  const fixture = await createGitFixture(t);
  const branch = 'release/2026-09-20.6';
  const packageManifestPath = path.join(
    fixture.source,
    'packages/libs/example/package.json',
  );
  const packageManifest = JSON.parse(
    await readFile(packageManifestPath, 'utf8'),
  );
  packageManifest.version = '1.1.0';
  await writeFile(
    packageManifestPath,
    `${JSON.stringify(packageManifest, null, 2)}\n`,
  );
  await writeFile(
    path.join(fixture.source, 'packages/libs/example/CHANGELOG.md'),
    '# @nocobase/example\n\n## 1.1.0\n\n- Released feature.\n\n## 1.0.0\n\n- Initial release.\n',
  );
  await rm(path.join(fixture.source, '.changeset/release-feature.md'));

  await releaseState(fixture.source, 'save', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    message: 'chore: release 2026-09-20.6 [skip ci]',
  });
  const state = JSON.parse(
    await readFile(path.join(fixture.artifacts, 'state.json'), 'utf8'),
  );

  // This is a local-only counterpart of the publish job: restore the candidate, create the aggregate tag, and push
  // both refs with explicit refspecs. The bare fixture stands in for origin and has no network transport.
  await git(
    fixture.restore,
    'push',
    'origin',
    `${fixture.base}:refs/heads/develop`,
  );
  await releaseState(fixture.restore, 'restore', {
    base: fixture.base,
    branch,
    directory: fixture.artifacts,
    expected: state.source,
  });
  await git(fixture.restore, 'tag', branch);
  await git(
    fixture.restore,
    'push',
    'origin',
    `refs/heads/${branch}:refs/heads/${branch}`,
  );
  await git(
    fixture.restore,
    'push',
    'origin',
    `refs/tags/${branch}:refs/tags/${branch}`,
  );

  const integration = path.join(fixture.root, 'release-integration');
  await git(fixture.root, 'clone', fixture.origin, integration);
  await configureIdentity(integration);
  await git(
    integration,
    'merge',
    '--no-ff',
    `origin/${branch}`,
    '-m',
    'chore: merge stable release',
  );
  await git(integration, 'push', 'origin', 'main');
  await git(integration, 'checkout', '-b', 'develop', 'origin/develop');
  await git(
    integration,
    'merge',
    '--no-ff',
    'main',
    '-m',
    'chore: sync stable release into develop',
  );
  await git(integration, 'push', 'origin', 'develop');

  for (const target of ['main', 'develop']) {
    const ref = `refs/heads/${target}`;
    const { stdout: manifestContents } = await git(
      fixture.origin,
      'show',
      `${ref}:packages/libs/example/package.json`,
    );
    assert.equal(JSON.parse(manifestContents).version, '1.1.0');
    const { stdout: changelog } = await git(
      fixture.origin,
      'show',
      `${ref}:packages/libs/example/CHANGELOG.md`,
    );
    assert.match(changelog, /## 1\.1\.0/u);
    await assert.rejects(
      git(
        fixture.origin,
        'cat-file',
        '-e',
        `${ref}:.changeset/release-feature.md`,
      ),
    );
    await git(fixture.origin, 'merge-base', '--is-ancestor', state.source, ref);
  }
  assert.equal(
    await revParse(fixture.origin, `refs/heads/${branch}^{commit}`),
    state.source,
  );
  assert.equal(
    await revParse(fixture.origin, `refs/tags/${branch}^{commit}`),
    state.source,
  );
});

async function createGitFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'nocobase-release-state-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  const origin = path.join(root, 'origin.git');
  const seed = path.join(root, 'seed');
  const source = path.join(root, 'release-source');
  const restore = path.join(root, 'release-restore');
  const artifacts = path.join(root, 'release-state');
  await git(root, 'init', '--bare', origin);
  await git(root, 'init', '--initial-branch=main', seed);
  await configureIdentity(seed);
  await mkdir(path.join(seed, 'packages/libs/example'), { recursive: true });
  await mkdir(path.join(seed, '.changeset'));
  await writeFile(path.join(seed, 'version.txt'), '1.0.0\n');
  await writeFile(path.join(seed, 'deleted.txt'), 'remove during release\n');
  await writeFile(path.join(seed, 'metadata.json'), '{"stable":false}\n');
  await writeFile(
    path.join(seed, 'packages/libs/example/package.json'),
    `${JSON.stringify(
      {
        name: '@nocobase/example',
        version: '1.0.0',
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(seed, 'packages/libs/example/CHANGELOG.md'),
    '# @nocobase/example\n\n## 1.0.0\n\n- Initial release.\n',
  );
  await writeFile(
    path.join(seed, '.changeset/release-feature.md'),
    '---\n"@nocobase/example": minor\n---\n\nReleased feature.\n',
  );
  await git(seed, 'add', '--all');
  await git(seed, 'commit', '-m', 'initial');
  await git(seed, 'remote', 'add', 'origin', origin);
  await git(seed, 'push', 'origin', 'main');
  await git(origin, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  await git(root, 'clone', origin, source);
  await git(root, 'clone', origin, restore);
  await configureIdentity(source);
  await configureIdentity(restore);
  await mkdir(artifacts);
  return {
    artifacts,
    base: await head(source),
    origin,
    restore,
    root,
    seed,
    source,
  };
}

async function configureIdentity(repository) {
  await git(repository, 'config', 'user.name', 'Release Test');
  await git(repository, 'config', 'user.email', 'release@example.invalid');
}

async function releaseState(cwd, command, options, output) {
  const args = [script, command];
  for (const [name, value] of Object.entries(options)) {
    args.push(`--${name}`, value);
  }
  return execFileAsync(process.execPath, args, {
    cwd,
    env: {
      ...process.env,
      GITHUB_OUTPUT: output ?? '',
    },
  });
}

async function git(cwd, ...args) {
  return execFileAsync('git', args, { cwd });
}

async function revParse(repository, revision) {
  const { stdout } = await git(repository, 'rev-parse', '--verify', revision);
  return stdout.trim();
}

async function head(repository) {
  return revParse(repository, 'HEAD');
}

async function currentBranch(repository) {
  const { stdout } = await git(repository, 'symbolic-ref', '--short', 'HEAD');
  return stdout.trim();
}

async function status(repository) {
  const { stdout } = await git(
    repository,
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  );
  return stdout;
}
