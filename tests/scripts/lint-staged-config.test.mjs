import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import config from '../../lint-staged.config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const commands = (files) =>
  config['*'](files.map((file) => path.join(root, file)));
const lintCommands = (files) =>
  commands(files).filter((command) => command.includes('eslint'));

test('inert Main/Sub payloads are formatted but not linted without their runtime dependencies', () => {
  const files = [
    'packages/templates/app-template-multi-app/template/client/app.ts',
    'packages/templates/app-template-multi-app/template/apps/sub/client/app.ts',
  ];
  assert.deepEqual(lintCommands(files), []);
  const format = commands(files).find((command) =>
    command.startsWith('prettier '),
  );
  for (const file of files) assert.ok(format.includes(path.join(root, file)));
});

test('the multi-app packaging tool and create-app still receive ESLint checks', () => {
  const files = [
    'packages/templates/app-template-multi-app/scripts/build-template.mjs',
    'packages/tools/create-app/src/create.ts',
  ];
  const lint = lintCommands(files).join('\n');
  for (const file of files) assert.ok(lint.includes(path.join(root, file)));
});

test('ordinary templates and similarly named directories remain linted', () => {
  const files = [
    'packages/templates/app-template-default/client/app.ts',
    'packages/templates/app-template-examples/client/app.ts',
    'packages/templates/app-template-multi-app/template-extra/client/app.ts',
  ];
  const lint = lintCommands(files).join('\n');
  for (const file of files) assert.ok(lint.includes(path.join(root, file)));
});
