/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from 'vitest';
import { commandRelativePathToRegistryKey } from '../lib/command-discovery.js';

test('commandRelativePathToRegistryKey maps index modules to parent commands', () => {
  expect(commandRelativePathToRegistryKey('api/resource/index.ts')).toBe('api:resource');
  expect(commandRelativePathToRegistryKey('api/resource/list.ts')).toBe('api:resource:list');
  expect(commandRelativePathToRegistryKey('license/index.ts')).toBe('license');
  expect(commandRelativePathToRegistryKey('license/id.ts')).toBe('license:id');
  expect(commandRelativePathToRegistryKey('license/generate-id.ts')).toBe('license:generate-id');
  expect(commandRelativePathToRegistryKey('license/plugins/index.ts')).toBe('license:plugins');
  expect(commandRelativePathToRegistryKey('license/plugins/clean.ts')).toBe('license:plugins:clean');
  expect(commandRelativePathToRegistryKey('license/plugins/sync.ts')).toBe('license:plugins:sync');
  expect(commandRelativePathToRegistryKey('revision/create.ts')).toBe('revision:create');
});
