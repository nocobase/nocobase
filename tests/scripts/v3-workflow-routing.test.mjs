import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = (name) =>
  readFileSync(
    new URL(`../../.github/workflows/v3-${name}.yml`, import.meta.url),
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
    assert.doesNotMatch(source, /gh pr merge[^\n]*--merge/u);
    assert.match(source, /gh pr merge[^\n]*--squash/u);
  }
});

test('OSS releases publish through public npm with the existing token', () => {
  for (const name of ['release-beta', 'release-stable']) {
    const source = workflow(name);
    assert.match(source, /registry-url: https:\/\/registry\.npmjs\.org/u);
    assert.match(source, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/u);
    assert.doesNotMatch(source, /npm\.nocobase\.ai|PRO_NPM_TOKEN/u);
  }

  const promotion = workflow('merge-beta-to-stable');
  assert.match(promotion, /REGISTRY_URL: https:\/\/registry\.npmjs\.org/u);
  assert.doesNotMatch(promotion, /npm\.nocobase\.ai/u);
});

test('the release smoke registry keeps scope isolation over public npm', () => {
  const source = readFileSync(
    new URL('../../.github/verdaccio/config.yaml', import.meta.url),
    'utf8',
  );
  assert.match(source, /nocobase:\n    url: https:\/\/registry\.npmjs\.org\//u);
  assert.match(source, /'@nocobase\/\*':[\s\S]*?proxy: nocobase/u);
  assert.doesNotMatch(source, /npm\.nocobase\.ai/u);
});

test('v3 GitHub Releases never take the shared Latest marker', () => {
  const source = workflow('github-release');
  assert.match(
    source,
    /release-beta\/\*\) FLAGS=\(--prerelease --latest=false\)/u,
  );
  assert.match(source, /release\/\*\)\s+FLAGS=\(--latest=false\)/u);
});

test('site deployment uses the existing publish triggers without a migration gate', () => {
  for (const name of ['docs', 'ui-library']) {
    const source = workflow(name);
    assert.doesNotMatch(source, /V3_ASSET_DEPLOY_ENABLED/u);
    assert.match(
      source,
      /github\.event_name == 'push' && github\.ref == 'refs\/heads\/v3-develop'/u,
    );
    assert.match(
      source,
      /github\.event_name == 'workflow_dispatch' && inputs\.publish/u,
    );
    assert.match(
      source,
      /pull_request:\n    branches:\n      - v3-develop\n      - v3-main/u,
    );
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
  for (const name of [
    'pro-release-beta',
    'pro-release-stable',
    'pro-promote-to-stable',
  ]) {
    const source = workflow(name);
    assert.match(source, /repositories: nocobase3-pro/u);
    assert.doesNotMatch(source, /--base v3-|git push origin v3-/u);
    assert.match(source, /secrets\.PRO_NPM_REGISTRY/u);
    assert.match(source, /Commercial packages must not use public npm/u);
    assert.doesNotMatch(source, /npm\.nocobase\.ai/u);
  }
});

test('installer smoke covers the Default archive instead of publishing or installing Hub templates', () => {
  const smoke = workflow('app-installer-smoke');
  const quality = workflow('quality');
  assert.match(smoke, /workflow_call:/u);
  assert.match(
    smoke,
    /pnpm --filter @nocobase\/app-template-default build --tar/u,
  );
  assert.match(
    smoke,
    /--source archive --archive packages\/templates\/app-template-default\/storage\/exports\/dist\.tar\.gz/u,
  );
  assert.doesNotMatch(smoke, /app-template-hub|--source template|schedule:/u);
  assert.match(quality, /template: \[default, examples\]/u);
  for (const name of ['release-beta', 'release-stable']) {
    assert.match(workflow(name), /template: \[default, examples\]/u);
    assert.doesNotMatch(workflow(name), /template: \[[^\n]*\bhub\b/u);
  }
  assert.match(
    quality,
    /uses: \.\/\.github\/workflows\/v3-app-installer-smoke\.yml/u,
  );
  assert.doesNotMatch(
    quality,
    /app-template-hub|--source template|Hub template/u,
  );
  assert.match(quality, /needs\['app-installer-smoke'\]\.result/u);
});

test('Pro publishing passes the private registry and token independently', () => {
  for (const name of ['pro-release-beta', 'pro-release-stable']) {
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
  assert.match(workflow('pro-release-beta'), /ARGS=\(--branch develop\)/u);
  for (const name of ['pro-release-stable', 'pro-promote-to-stable']) {
    assert.match(workflow(name), /ARGS=\(--branch main\)/u);
  }
});
