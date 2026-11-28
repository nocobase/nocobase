import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import config from '../../lint-staged.config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const commands = (files) =>
  config['*'](files.map((file) => path.join(root, file)));
test('application templates use their lint:fix scripts and other packages use ESLint', () => {
  const defaultFile = 'packages/templates/app-template-default/client/app.ts';
  const examplesFile = 'packages/templates/app-template-examples/client/app.ts';
  const cliFile = 'packages/tools/create-app/src/create.ts';
  const [lintDefault, lintExamples, lintCli, format] = commands([
    defaultFile,
    examplesFile,
    cliFile,
  ]);
  assert.equal(
    lintDefault,
    `pnpm --dir "packages/templates/app-template-default" lint:fix "${path.join(root, defaultFile)}"`,
  );
  assert.equal(
    lintExamples,
    `pnpm --dir "packages/templates/app-template-examples" lint:fix "${path.join(root, examplesFile)}"`,
  );
  assert.match(lintCli, /^eslint --fix /u);
  assert.ok(lintCli.includes(path.join(root, cliFile)));
  assert.match(format, /^prettier --write /u);
});
