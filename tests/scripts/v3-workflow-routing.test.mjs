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

const workflow = (name) =>
  readFileSync(
    new URL(`../../.github/workflows/v3-${name}.yml`, import.meta.url),
    'utf8',
  );

const triggerBranches = (source, event) => {
  const match = source.match(
    new RegExp(`^  ${event}:\\n    branches:\\n((?:      - .+\\n)+)`, 'mu'),
  );
  assert.ok(match, `${event} must declare branch filters`);
  return match[1]
    .trimEnd()
    .split('\n')
    .map((line) => line.replace(/^      - /u, '').replace(/^['"]|['"]$/gu, ''));
};

const matchesSingleSegmentGlob = (pattern, branch) => {
  const expression = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${expression}$`, 'u').test(branch);
};

test('stacked v3 targets receive PR checks without widening direct-branch triggers', () => {
  const quality = workflow('quality');
  const changesets = workflow('changeset-check');
  const guard = workflow('guard-main');

  assert.deepEqual(triggerBranches(quality, 'pull_request'), [
    'v3-develop',
    'v3-main',
    '*/v3-*',
  ]);
  assert.deepEqual(triggerBranches(changesets, 'pull_request'), [
    'v3-main',
    'v3-develop',
    '*/v3-*',
  ]);
  assert.deepEqual(triggerBranches(quality, 'push'), ['v3-develop']);
  assert.deepEqual(triggerBranches(guard, 'pull_request'), ['v3-main']);

  const workflowPattern = '*/v3-*';
  const botPattern = /^[^/]+\/v3-[^/]+$/u;
  for (const branch of [
    'feat/v3-app-installer',
    'fix/v3-stacked-pr-routing',
    'docs/v3-release-notes',
    'feat/app-installer',
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
    assert.deepEqual(triggerBranches(source, 'pull_request'), [
      'v3-develop',
      'v3-main',
      '*/v3-*',
    ]);
    assert.deepEqual(triggerBranches(source, 'push'), ['v3-develop']);
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

test('installer smoke covers the Default archive', () => {
  const smoke = workflow('app-installer-smoke');
  const quality = workflow('quality');
  assert.match(smoke, /workflow_call:/u);
  assert.match(
    smoke,
    /pnpm --filter @nocobase\/app-template-default build --tar/u,
  );
  assert.match(
    smoke,
    /smoke-app-installer\.mjs --archive packages\/templates\/app-template-default\/storage\/exports\/dist\.tar\.gz/u,
  );
  assert.doesNotMatch(smoke, /app-template-hub|--source|schedule:/u);
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

// The unindented shell of the `run: |` block of the step called `name`.
const runBlock = (source, name) => {
  const start = source.indexOf(`      - name: ${name}\n`);
  assert.notEqual(start, -1, name);
  const end = source.indexOf('\n      - name: ', start + 1);
  const lines = source.slice(start, end === -1 ? undefined : end).split('\n');
  const begin = lines.indexOf('        run: |');
  assert.notEqual(begin, -1, name);
  return lines
    .slice(begin + 1)
    .filter((line) => line.startsWith('          ') || line === '')
    .map((line) => line.slice(10))
    .join('\n');
};

test('a beta release that publishes Studio builds its public release image from the release tag', (t) => {
  const source = workflow('release-beta');
  assert.match(
    source,
    /studio_version: \$\{\{ steps\.studio\.outputs\.version \}\}/u,
  );
  const publish = source.indexOf('      - name: Publish to npm\n');
  const find = source.indexOf(
    '      - name: Find the published Studio version\n',
  );
  assert.ok(
    publish !== -1 && find > publish,
    'the version is read only after publishing',
  );

  const job = source.slice(
    source.indexOf('\n  studio-image:\n'),
    source.indexOf('\n  github-release:\n'),
  );
  assert.match(job, /needs: release\n/u);
  assert.match(
    job,
    /!cancelled\(\) && !inputs\.dry_run\n\s+&& needs\.release\.outputs\.tag != '' && needs\.release\.outputs\.studio_version != ''/u,
  );
  assert.match(job, /uses: \.\/\.github\/workflows\/v3-studio-image\.yml\n/u);
  assert.match(
    job,
    /with:\n\s+tag: \$\{\{ needs\.release\.outputs\.tag \}\}\n/u,
  );
  assert.match(job, /secrets: inherit\n/u);
  assert.doesNotMatch(job, /nocobase-ci|NOCOBASE_CI_DISPATCH_TOKEN/u);

  const directory = mkdtempSync(path.join(tmpdir(), 'studio-image-release-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  // The Studio version comes from the released specs, and is empty when Studio was not released.
  const workspace = path.join(directory, 'workspace');
  mkdirSync(path.join(workspace, 'scripts'), { recursive: true });
  mkdirSync(path.join(workspace, 'packages/apps/studio'), { recursive: true });
  mkdirSync(path.join(workspace, 'packages/libs/db'), { recursive: true });
  execFileSync('cp', [
    path.join(import.meta.dirname, '../../scripts/list-package-versions.mjs'),
    path.join(workspace, 'scripts'),
  ]);
  writeFileSync(
    path.join(workspace, 'packages/apps/studio/package.json'),
    JSON.stringify({ name: '@nocobase/studio', version: '1.0.0-beta.52' }),
  );
  writeFileSync(
    path.join(workspace, 'packages/libs/db/package.json'),
    JSON.stringify({ name: '@nocobase/db', version: '1.0.0-beta.9' }),
  );
  mkdirSync(path.join(directory, 'release-state'));
  const findVersion = (before) => {
    writeFileSync(
      path.join(directory, 'release-state/versions-before.json'),
      JSON.stringify(before),
    );
    const output = path.join(directory, 'find-output');
    writeFileSync(output, '');
    execFileSync(
      'bash',
      ['-e', '-c', runBlock(source, 'Find the published Studio version')],
      {
        cwd: workspace,
        env: { ...process.env, RUNNER_TEMP: directory, GITHUB_OUTPUT: output },
      },
    );
    return readFileSync(output, 'utf8');
  };
  assert.equal(
    findVersion({
      '@nocobase/studio': '1.0.0-beta.51',
      '@nocobase/db': '1.0.0-beta.8',
    }),
    'version=1.0.0-beta.52\n',
  );
  assert.equal(
    findVersion({
      '@nocobase/studio': '1.0.0-beta.52',
      '@nocobase/db': '1.0.0-beta.8',
    }),
    'version=\n',
  );

  // The image is tagged with Studio's version and channel on Docker Hub and Aliyun's public registry.
  const image = workflow('studio-image');
  assert.match(image, /workflow_call:\n\s+inputs:\n\s+tag:/u);
  assert.doesNotMatch(
    image,
    /workflow_dispatch|ALI_DOCKER_REGISTRY\b|runners-dist/u,
  );
  // Studio's own `pnpm build` packs the runner and nb-studio into dist/runners, which the prebuilt image carries.
  assert.doesNotMatch(image, /cli build|upload-artifact|studio-dist/u);
  assert.match(
    image,
    /- name: Build dist for linux-x64\n\s+working-directory: packages\/apps\/studio\n[\s\S]*?run: pnpm build --target linux-x64\n/u,
  );
  assert.match(image, /build-args: DIST=prebuilt\n/u);
  const name = (version) => {
    const tagWorkspace = path.join(directory, `tags-${version || 'none'}`);
    mkdirSync(path.join(tagWorkspace, 'packages/apps/studio'), {
      recursive: true,
    });
    if (version)
      writeFileSync(
        path.join(tagWorkspace, 'packages/apps/studio/package.json'),
        JSON.stringify({ name: '@nocobase/studio', version }),
      );
    const output = path.join(tagWorkspace, 'output');
    writeFileSync(output, '');
    const result = spawnSync(
      'bash',
      ['-e', '-c', runBlock(image, 'Name the tags')],
      {
        cwd: tagWorkspace,
        encoding: 'utf8',
        env: {
          ...process.env,
          ALI_REGISTRY: 'registry.example.com',
          TAG: 'release-beta/2026-10-11.1',
          GITHUB_OUTPUT: output,
        },
      },
    );
    return {
      status: result.status,
      stdout: result.stdout,
      output: readFileSync(output, 'utf8'),
    };
  };
  assert.equal(
    name('1.0.0-beta.52').output,
    [
      'version=1.0.0-beta.52',
      'tags<<EOF',
      'nocobase/studio:1.0.0-beta.52',
      'nocobase/studio:beta',
      'registry.example.com/nocobase/studio:1.0.0-beta.52',
      'registry.example.com/nocobase/studio:beta',
      'EOF',
      '',
    ].join('\n'),
  );
  assert.match(name('1.0.0').output, /nocobase\/studio:latest\n/u);
  const missing = name('');
  assert.notEqual(missing.status, 0);
  assert.match(
    missing.stdout,
    /::error::release-beta\/2026-10-11\.1 has no valid version/u,
  );
});
