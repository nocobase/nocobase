import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = (name) =>
  readFileSync(
    new URL(`../../.github/workflows/${name}.yml`, import.meta.url),
    'utf8',
  );

test('OSS releases write only the migrated repository and v3 branches', () => {
  for (const name of [
    'release-beta',
    'release-stable',
    'merge-beta-to-stable',
  ]) {
    const source = workflow(name);
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
  }
});

test('v3 GitHub Releases never take the shared Latest marker', () => {
  const source = workflow('github-release');
  assert.match(
    source,
    /release-beta\/\*\) FLAGS=\(--prerelease --latest=false\)/u,
  );
  assert.match(source, /release\/\*\)\s+FLAGS=\(--latest=false\)/u);
});

test('site deployment waits for migration configuration while PR builds stay available', () => {
  for (const name of ['docs', 'ui-library']) {
    const source = workflow(name);
    assert.match(source, /vars\.V3_ASSET_DEPLOY_ENABLED == 'true'/u);
    assert.match(
      source,
      /pull_request:\n    branches:\n      - v3-develop\n      - v3-main/u,
    );
    assert.match(source, /publish:[\s\S]*?default: false/u);
  }
});

test('independent Pro releases keep their own repository and branches', () => {
  for (const name of [
    'pro-release-beta',
    'pro-release-stable',
    'pro-promote-to-stable',
  ]) {
    const source = workflow(name);
    assert.match(source, /repositories: nocobase3-pro/u);
    assert.doesNotMatch(source, /--base v3-|git push origin v3-/u);
  }
});
