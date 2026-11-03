import { createTestApp } from '@nocobase/app-testing/server';
import { expect, it, vi } from 'vitest';

import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

it('merges file settings and environment overrides, publishing only allowed fields', async () => {
  vi.stubEnv('READING_LIST_PAGE_SIZE', '2');
  try {
    const testApp = await createTestApp({
      createServer: createStandaloneServer,
      config: {
        readingList: { pageSize: 3, integrationKey: 'synthetic-test-key' },
      },
    });
    try {
      expect(testApp.application.config.get('readingList.pageSize')).toBe(2);
      expect(testApp.application.config.get('readingList.integrationKey')).toBe(
        'synthetic-test-key',
      );
      expect(testApp.application.config.publicValues?.().readingList).toEqual({
        pageSize: 2,
      });
    } finally {
      await testApp.close();
    }
  } finally {
    vi.unstubAllEnvs();
  }
});

it('rejects an invalid final configuration during startup', async () => {
  await expect(
    createTestApp({
      createServer: createStandaloneServer,
      config: { readingList: { pageSize: 0 } },
    }),
  ).rejects.toThrow(/pageSize/);
});
