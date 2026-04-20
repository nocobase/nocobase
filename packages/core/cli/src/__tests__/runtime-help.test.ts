import assert from 'node:assert/strict';
import { test } from 'vitest';
import { isTopicIndexCommand } from '../help/runtime-help.js';

test('isTopicIndexCommand detects commands that are also topic namespaces', () => {
  const topics = [
    { name: 'api' },
    { name: 'api:acl' },
    { name: 'api:acl:roles' },
    { name: 'api:resource' },
    { name: 'api:resource:list' },
  ];

  assert.equal(isTopicIndexCommand('api', topics), true);
  assert.equal(isTopicIndexCommand('api:acl', topics), true);
  assert.equal(isTopicIndexCommand('api:resource', topics), true);
  assert.equal(isTopicIndexCommand('api:resource:list', topics), false);
  assert.equal(isTopicIndexCommand('build', topics), false);
});
