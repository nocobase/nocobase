import { randomUUID } from 'node:crypto';
import type { OnlineAgentService } from '@nocobase/app-plugin-agents/server/online-agent';
import {
  AGENTS_MIGRATIONS,
  AGENTS_PACKAGE,
  createAgents,
} from '@nocobase/app-plugin-agents/testing';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { afterAll, beforeAll } from 'vitest';

/** Share one real service per suite; tests can spy on the operation they need to control. */
export function createOnlineAgentServiceFixture(): () => OnlineAgentService {
  let database: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  let service: OnlineAgentService;
  beforeAll(async () => {
    database = await createTestDatabase({
      migrations: [
        { packageName: AGENTS_PACKAGE, directory: AGENTS_MIGRATIONS },
      ],
    });
    service = createAgents({
      database: database.database,
      idGenerator: { generateString: randomUUID },
      vectors: { store: false },
    }).onlineAgent;
  });
  afterAll(async () => {
    try {
      await service?.shutdown();
    } finally {
      await database?.destroy();
    }
  });
  return () => service;
}
