// @vitest-environment node
import path from 'node:path';
import { databaseManagerToken } from '@nocobase/db';
import { test, expect, vi } from 'vitest';
import { createStandaloneServer } from './indexing-app/server/standalone.js';
import { settingsRepo, workRepo } from '../../server/indexing/store.js';
test.skipIf(!process.env.KNOWLEDGE_INDEXING_PROCESS_CONFIG)(
  'isolated Knowledge process worker',
  async () => {
    // Static imports are loaded; subsequent deadlines measure application work.
    console.info('KB_PROCESS_WORKER_READY');
    const configPath = process.env.KNOWLEDGE_INDEXING_PROCESS_CONFIG!;
    if (process.env.KNOWLEDGE_INDEXING_PROCESS_MODE === 'recover') {
      // Expire the five-minute reconciliation window without waiting or faking timers.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(Date.now() + 300001));
    }
    const server = await createStandaloneServer({
      configPath,
      env: {
        APP_STORAGE_DIR: path.join(path.dirname(configPath), 'storage'),
        KNOWLEDGE_INDEXING_PROCESS_MODE:
          process.env.KNOWLEDGE_INDEXING_PROCESS_MODE,
      },
    });
    try {
      if (process.env.KNOWLEDGE_INDEXING_PROCESS_MODE === 'hold')
        await new Promise<void>(() => {});
      const database =
        server.application.container.resolve(databaseManagerToken);
      const generationId = process.env.KNOWLEDGE_INDEXING_PROCESS_GENERATION!;
      await expect
        .poll(
          async () => {
            const settings = await settingsRepo(database.connection()).findOne({
              filter: { id: 'global' },
            });
            const work = await workRepo(database.connection()).findMany({
              filter: { generationId },
            });
            return (
              settings?.activeGenerationId === generationId &&
              work.length === 1 &&
              work.every(
                (item) =>
                  item.state === 'done' &&
                  String(item.wantedRevision) === String(item.appliedRevision),
              )
            );
          },
          { timeout: 15000 },
        )
        .toBe(true);
      console.info('KB_PROCESS_RECOVERY_VERIFIED');
    } finally {
      await server.close();
      vi.useRealTimers();
    }
  },
  30000,
);
