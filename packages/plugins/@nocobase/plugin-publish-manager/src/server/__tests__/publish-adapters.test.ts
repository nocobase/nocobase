/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, it } from 'vitest';
import { getPublishAdapter, getPublishAdapterCapabilities } from '../services/publish-adapters/registry';

it('registers publish adapters by publish artifact type', () => {
  expect(getPublishAdapter('backup').type).toBe('backup');
  expect(getPublishAdapter('migration').type).toBe('migration');
  expect(getPublishAdapter('database').type).toBe('database');
});

it('reports adapter capabilities for publishCommands', () => {
  expect(getPublishAdapterCapabilities()).toMatchObject({
    backup: {
      generate: true,
      upload: true,
      execute: true,
    },
    migration: {
      generate: true,
      upload: true,
      execute: true,
    },
    database: {
      generate: false,
      upload: false,
      execute: false,
    },
  });
});

it('keeps database adapter reserved for a later version', async () => {
  const adapter = getPublishAdapter('database');
  await expect(adapter.generate({} as any, {})).rejects.toThrow(/not available/);
  await expect(adapter.execute({} as any, {} as any, {})).rejects.toThrow(/not available/);
});
