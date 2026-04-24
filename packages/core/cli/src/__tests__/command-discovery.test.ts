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
});
