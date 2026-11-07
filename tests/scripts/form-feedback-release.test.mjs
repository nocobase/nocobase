import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import {
  checkFormFeedbackPackage,
  checkFormFeedbackPeer,
  checkPendingFeedbackPackage,
  runtimeFloor,
} from '../../scripts/check-form-feedback-release.mjs';

test('release gate rejects a compatible-looking version that lacks runtime exports or declarations', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'form-package-'));
  try {
    mkdirSync(path.join(dir, 'dist'));
    writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-client',
        version: '2.0.0-test.1',
        type: 'module',
        exports: {
          '.': { import: './dist/index.js', types: './dist/index.d.ts' },
        },
      }),
    );
    writeFileSync(
      path.join(dir, 'dist/index.js'),
      'export const oldRuntime = true;',
    );
    writeFileSync(
      path.join(dir, 'dist/index.d.ts'),
      'export declare class FormFeedback {}\nexport declare function formFeedbackErrors(): void;\nexport interface FormFeedbackAttempt {}\nexport interface FormFeedbackField {}\nexport interface FormFeedbackOptions {}',
    );
    assert.throws(
      () => checkFormFeedbackPackage(dir),
      /lacks FormFeedback, formFeedbackErrors/,
    );
    writeFileSync(
      path.join(dir, 'dist/index.js'),
      'export class FormFeedback {}\nexport function formFeedbackErrors() {}',
    );
    assert.equal(checkFormFeedbackPackage(dir), '2.0.0-test.1');
    assert.throws(
      () => checkPendingFeedbackPackage(dir),
      /lacks usePendingFeedback/,
    );
    writeFileSync(
      path.join(dir, 'dist/index.d.ts'),
      'export declare class FormFeedback {}',
    );
    assert.throws(
      () => checkFormFeedbackPackage(dir),
      /lacks formFeedbackErrors/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('release gate checks the oldest accepted version and fails closed on unbounded ranges', () => {
  const registry = (range) => ({
    items: [
      {
        name: 'feedback-form',
        dependencies: [`@nocobase/app-client@${range}`],
      },
      {
        name: 'property-fields',
        dependencies: [`@nocobase/app-client@${range}`],
      },
    ],
  });
  assert.equal(runtimeFloor(registry('^2.0.0-test.2')), '2.0.0-test.2');
  assert.equal(runtimeFloor(registry('2.0.0-test.3')), '2.0.0-test.3');
  assert.equal(
    runtimeFloor(registry('~2.0.0-test.4'), 'property-fields'),
    '2.0.0-test.4',
  );
  assert.throws(
    () => runtimeFloor(registry('*'), 'property-fields'),
    /property-fields.*version floor/,
  );
  assert.throws(
    () => runtimeFloor({ items: [] }, 'property-fields'),
    /property-fields.*version floor/,
  );
  assert.throws(() => runtimeFloor(registry('*')), /version floor/);
  assert.throws(
    () => runtimeFloor(registry('^1.0.0 || ^2.0.0')),
    /version floor/,
  );
});

test('automatic and manual registry publication checks compatibility before the first upload', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/v3-ui-library.yml', import.meta.url),
    'utf8',
  );
  const gate = workflow.indexOf(
    'run: node scripts/check-form-feedback-release.mjs',
  );
  assert.ok(gate > 0);
  assert.ok(gate < workflow.indexOf('- name: Publish to OSS'));
});

test('form installation cannot downgrade the runtime translation peer', () => {
  const registry = (range) => ({
    items: [
      { name: 'feedback-form', dependencies: [`@nocobase/i18n@${range}`] },
    ],
  });
  const runtime = { peerDependencies: { '@nocobase/i18n': '^2.0.0-test.1' } };
  assert.throws(
    () => checkFormFeedbackPeer(registry('^1.0.0'), runtime),
    /must declare @nocobase\/i18n/,
  );
  assert.doesNotThrow(() =>
    checkFormFeedbackPeer(registry('^2.0.0-test.1'), runtime),
  );
});

test('publication gate isolates npm from inherited scope config while checking both dependency floors', async (t) => {
  const work = mkdtempSync(path.join(os.tmpdir(), 'registry-release-test-'));
  const formVersion = '2.0.0-test.1';
  const avatarVersion = '2.0.0-test.2';
  const packageName = '@nocobase/app-client';
  const registry = {
    items: [
      {
        name: 'feedback-form',
        dependencies: [
          `${packageName}@^${formVersion}`,
          '@nocobase/i18n@^2.0.0-test.1',
        ],
      },
      {
        name: 'property-fields',
        dependencies: [`${packageName}@^${avatarVersion}`],
      },
      { name: 'loading', dependencies: [`${packageName}@^${formVersion}`] },
      {
        name: 'pending-button',
        dependencies: [`${packageName}@^${formVersion}`],
      },
    ],
  };
  const formRuntime =
    'export class FormFeedback {}\nexport function formFeedbackErrors() {}\nexport function usePendingFeedback() {}';
  const formDeclarations =
    'export declare class FormFeedback {}\nexport declare function formFeedbackErrors(): void;\nexport interface FormFeedbackAttempt {}\nexport interface FormFeedbackField {}\nexport interface FormFeedbackOptions {}\nexport declare function usePendingFeedback(): PendingFeedback;\nexport interface PendingFeedback {}';
  const avatarRuntime =
    'export function getAvatarInitials(name) { return name; }';
  const avatarDeclarations =
    'export interface AvatarInitialsOptions {}\nexport declare function getAvatarInitials(name: string, options?: AvatarInitialsOptions): string;';

  function tarball(version, runtime, declarations) {
    const dir = path.join(work, version);
    mkdirSync(path.join(dir, 'package/dist'), { recursive: true });
    writeFileSync(
      path.join(dir, 'package/package.json'),
      JSON.stringify({
        name: packageName,
        version,
        type: 'module',
        exports: {
          '.': { import: './dist/index.js', types: './dist/index.d.ts' },
        },
        peerDependencies: { '@nocobase/i18n': '^2.0.0-test.1' },
      }),
    );
    // Re-exports must be checked in the packed JavaScript and declaration graph.
    writeFileSync(
      path.join(dir, 'package/dist/index.js'),
      version === avatarVersion
        ? "export { getAvatarInitials } from './runtime.js';"
        : "export * from './runtime.js';",
    );
    writeFileSync(
      path.join(dir, 'package/dist/index.d.ts'),
      version === avatarVersion
        ? "export { getAvatarInitials, type AvatarInitialsOptions } from './runtime.js';"
        : "export * from './runtime.js';",
    );
    writeFileSync(path.join(dir, 'package/dist/runtime.js'), runtime);
    writeFileSync(path.join(dir, 'package/dist/runtime.d.ts'), declarations);
    const filename = path.join(dir, 'runtime.tgz');
    execFileSync('tar', ['-czf', filename, '-C', dir, 'package']);
    return readFileSync(filename);
  }

  const form = tarball(formVersion, formRuntime, formDeclarations);
  let avatar;
  const requested = new Set();
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith('/tarballs/')) {
      const version = url.pathname.slice('/tarballs/'.length, -4);
      requested.add(version);
      response.end(version === formVersion ? form : avatar);
      return;
    }
    const versions = Object.fromEntries(
      [[formVersion, form], ...(avatar ? [[avatarVersion, avatar]] : [])].map(
        ([version, data]) => [
          version,
          {
            name: packageName,
            version,
            dist: {
              tarball: `${url.origin}/tarballs/${version}.tgz`,
              integrity: `sha512-${createHash('sha512').update(data).digest('base64')}`,
            },
          },
        ],
      ),
    );
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        name: packageName,
        'dist-tags': { latest: formVersion },
        versions,
      }),
    );
  });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const registryUrl = `http://127.0.0.1:${server.address().port}`;
    const registryFile = path.join(work, 'registry.json');
    const inheritedConfig = path.join(work, 'inherited-npmrc');
    const isolatedConfig = path.join(work, 'isolated-npmrc');
    const globalConfig = path.join(work, 'global-npmrc');
    const marker = path.join(work, 'upload-allowed');
    const runner = path.join(work, 'check.mjs');
    writeFileSync(registryFile, JSON.stringify(registry));
    writeFileSync(
      inheritedConfig,
      '@nocobase:registry=https://registry.npmjs.org\n',
    );
    // A conflicting scoped registry must not override the registry under test.
    writeFileSync(
      isolatedConfig,
      '@nocobase:registry=http://127.0.0.1:9/\nfetch-retries=0\n',
    );
    writeFileSync(globalConfig, '');
    writeFileSync(
      runner,
      `import { checkRelease } from ${JSON.stringify(new URL('../../scripts/check-form-feedback-release.mjs', import.meta.url).href)};
import { readFileSync, writeFileSync } from 'node:fs';
process.env.NPM_CONFIG_USERCONFIG = process.argv[5];
process.env.NPM_CONFIG_GLOBALCONFIG = process.argv[6];
process.chdir(process.argv[7]);
checkRelease(process.argv[2], JSON.parse(readFileSync(process.argv[3], 'utf8')));
writeFileSync(process.argv[4], 'allowed');
`,
    );
    const scenarios = [
      ['unpublished floor', null, null, /property-fields requires a published/],
      [
        'missing runtime export',
        'export const oldRuntime = true;',
        avatarDeclarations,
        /lacks getAvatarInitials in .*index.js/,
      ],
      [
        'missing declaration export',
        avatarRuntime,
        'export interface AvatarInitialsOptions {}',
        /lacks getAvatarInitials in .*index.d.ts/,
      ],
      ['complete published package', avatarRuntime, avatarDeclarations, null],
    ];
    for (const [outerConfigName, outerUserConfig] of [
      ['default npm config', null],
      ['official scope config', inheritedConfig],
    ]) {
      for (const [scenario, runtime, declarations, error] of scenarios) {
        await t.test(`${outerConfigName}: ${scenario}`, async () => {
          avatar =
            runtime === null
              ? undefined
              : tarball(avatarVersion, runtime, declarations);
          requested.clear();
          rmSync(marker, { force: true });
          const child = spawn(
            process.execPath,
            [
              runner,
              registryUrl,
              registryFile,
              marker,
              isolatedConfig,
              globalConfig,
              work,
            ],
            {
              env: {
                PATH: process.env.PATH,
                HOME: work,
                TMPDIR: os.tmpdir(),
                NPM_CONFIG_GLOBALCONFIG: globalConfig,
                ...(outerUserConfig
                  ? { NPM_CONFIG_USERCONFIG: outerUserConfig }
                  : {}),
              },
            },
          );
          let output = '';
          child.stdout.on('data', (data) => {
            output += data;
          });
          child.stderr.on('data', (data) => {
            output += data;
          });
          const [code] = await once(child, 'exit');
          assert.ok(requested.has(formVersion), output);
          assert.equal(existsSync(marker), !error, output);
          if (error) {
            assert.notEqual(code, 0, output);
            assert.match(output, error);
          } else {
            assert.equal(code, 0, output);
            assert.ok(requested.has(avatarVersion), output);
            assert.match(output, /property-fields registry release allowed/);
            assert.match(output, /loading registry release allowed/);
            assert.match(output, /pending-button registry release allowed/);
          }
        });
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(work, { recursive: true, force: true });
  }
});
