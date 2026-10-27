import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  checkFormFeedbackPackage,
  checkFormFeedbackPeer,
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
    ],
  });
  assert.equal(runtimeFloor(registry('^2.0.0-test.2')), '2.0.0-test.2');
  assert.equal(runtimeFloor(registry('2.0.0-test.3')), '2.0.0-test.3');
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
