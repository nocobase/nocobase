/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from 'vitest';
import { isTopicIndexCommand } from '../help/runtime-help.js';

test('isTopicIndexCommand detects commands that are also topic namespaces', () => {
  const topics = [
    { name: 'api' },
    { name: 'api:acl' },
    { name: 'api:acl:roles' },
    { name: 'api:resource' },
    { name: 'api:resource:list' },
  ];

  expect(isTopicIndexCommand('api', topics)).toBe(true);
  expect(isTopicIndexCommand('api:acl', topics)).toBe(true);
  expect(isTopicIndexCommand('api:resource', topics)).toBe(true);
  expect(isTopicIndexCommand('api:resource:list', topics)).toBe(false);
  expect(isTopicIndexCommand('build', topics)).toBe(false);
});

test('root help hides hidden topics such as pm when grouped replacements exist', async () => {
  const { default: RuntimeHelp } = await import('../help/runtime-help.js');

  const config = {
    topics: [
      { name: 'plugin', description: 'plugin topic' },
      { name: 'plugin:list', description: 'plugin:list topic' },
      { name: 'pm', description: 'pm topic', hidden: true },
      { name: 'pm:list', description: 'pm:list topic' },
    ],
  } as any;

  const help = new RuntimeHelp(config, {});
  const topics = help['sortedTopics'];
  expect(topics.map((topic: { name: string }) => topic.name)).toEqual(['plugin']);
});
