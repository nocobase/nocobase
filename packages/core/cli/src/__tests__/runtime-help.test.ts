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
