import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import config from '../../lint-staged.config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const commands = (files) =>
  config['*'](files.map((file) => path.join(root, file)));
const lintCommands = (files) =>
  commands(files).filter((command) => command.includes('eslint'));

test('ordinary templates and similarly named directories remain linted', () => {
  const files = [
    'packages/templates/app-template-default/client/app.ts',
    'packages/templates/app-template-examples/client/app.ts',
    'packages/tools/create-app/src/create.ts',
  ];
  const lint = lintCommands(files).join('\n');
  for (const file of files) assert.ok(lint.includes(path.join(root, file)));
});
