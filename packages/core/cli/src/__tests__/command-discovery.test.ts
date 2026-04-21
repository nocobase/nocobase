import assert from 'node:assert/strict';
import { test } from 'vitest';
import { commandRelativePathToRegistryKey } from '../lib/command-discovery.js';

test('commandRelativePathToRegistryKey maps index modules to parent commands', () => {
  assert.equal(commandRelativePathToRegistryKey('api/resource/index.ts'), 'api:resource');
  assert.equal(commandRelativePathToRegistryKey('api/resource/list.ts'), 'api:resource:list');
});
