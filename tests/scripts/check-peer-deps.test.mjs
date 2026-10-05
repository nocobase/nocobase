import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IDENTITY_SENSITIVE_PACKAGES,
  collectPackages,
  findViolations,
  isIdentitySensitive,
} from '../../scripts/check-peer-deps.mjs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../..');

test('treats every plugin as identity sensitive', () => {
  assert.equal(
    isIdentitySensitive('@nocobase/app-plugin-authentication'),
    true,
  );
  assert.equal(
    isIdentitySensitive('@nocobase/app-plugin-anything-at-all'),
    true,
  );
});

test('treats packages carrying process-wide runtime state as identity sensitive', () => {
  for (const packageName of IDENTITY_SENSITIVE_PACKAGES.keys()) {
    assert.equal(isIdentitySensitive(packageName), true, packageName);
  }
});

// Libraries that only export classes and factories hold no state a second copy could split, so requiring a peer range
// for them would add ceremony without preventing anything.
test('leaves stateless libraries alone', () => {
  for (const packageName of [
    '@nocobase/drive',
    '@nocobase/caching',
    '@nocobase/logging',
    '@nocobase/session',
    '@nocobase/snowflake',
  ]) {
    assert.equal(isIdentitySensitive(packageName), false, packageName);
  }
});

test('reports an identity-sensitive package listed under dependencies', () => {
  const violations = findViolations({
    name: '@nocobase/app-plugin-example',
    dependencies: { '@nocobase/app-server': 'workspace:^' },
  });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, 'should-be-peer');
  assert.match(violations[0].message, /must be a peerDependency/u);
});

test('reports a host-only package in any dependency field', () => {
  for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
    const violations = findViolations({
      name: '@nocobase/app-plugin-example',
      [field]: { 'hono-openapi': '^1.3.3' },
    });

    assert.equal(violations.length, 1, field);
    assert.equal(violations[0].kind, 'host-only');
    assert.match(violations[0].message, /@nocobase\/app-server\/router/u);
  }
});

test('accepts an identity-sensitive package declared as a peer', () => {
  const violations = findViolations({
    name: '@nocobase/app-plugin-example',
    peerDependencies: { '@nocobase/app-server': 'workspace:^' },
  });

  assert.deepEqual(violations, []);
});

// A matching devDependency is neither required nor rejected. pnpm resolves a `workspace:^` peer to this
// repository's copy on its own, so the second declaration changed nothing and is no longer asked for.
test('accepts a workspace peer whether or not a devDependency accompanies it', () => {
  const withDev = findViolations({
    name: '@nocobase/app-plugin-example',
    peerDependencies: { '@nocobase/app-server': 'workspace:^' },
    devDependencies: { '@nocobase/app-server': 'workspace:*' },
  });

  assert.deepEqual(withDev, []);
});

test('accepts a third-party peer', () => {
  const violations = findViolations({
    name: '@nocobase/app-plugin-example',
    peerDependencies: { react: '^19.0.0' },
  });

  assert.deepEqual(violations, []);
});

// A plugin may depend on packages from its own scope, and self-reference through exports must not be reported.
test('ignores a package depending on itself', () => {
  const violations = findViolations({
    name: '@nocobase/app-plugin-example',
    dependencies: { '@nocobase/app-plugin-example': 'workspace:^' },
  });

  assert.deepEqual(violations, []);
});

test('checks the application command line, which an application installs like a plugin', async () => {
  const packages = await collectPackages(repoRoot);
  const names = packages.map(({ manifest }) => manifest.name);

  assert.ok(names.includes('@nocobase/app-cli'));
});

test('fails on a manifest that does not parse instead of leaving its package out', async (t) => {
  for (const relative of ['app/app-cli', 'plugins/app-plugin-broken']) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'check-peer-deps-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, 'packages', relative), { recursive: true });
    await writeFile(
      path.join(root, 'packages', relative, 'package.json'),
      '{ "name": ',
    );
    await assert.rejects(collectPackages(root), SyntaxError, relative);
  }
});

test('skips what is absent: a missing manifest, a missing package group', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'check-peer-deps-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'packages', 'plugins', 'not-a-package'), {
    recursive: true,
  });
  assert.deepEqual(await collectPackages(root), []);
});

test('every checked package in the repository satisfies the rule', async () => {
  const packages = await collectPackages(repoRoot);
  assert.ok(packages.length > 0, 'expected to discover packages');

  for (const { manifest, manifestPath } of packages) {
    assert.deepEqual(
      findViolations(manifest),
      [],
      `${path.relative(repoRoot, manifestPath)} violates the peer dependency rule`,
    );
  }
});
