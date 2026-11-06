// @vitest-environment node
import path from 'node:path';
import { createAppTest } from '@nocobase/app-testing/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { apiDocsToken } from '@nocobase/app-server/router';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { expect } from 'vitest';
import { createApp } from './fixtures/indexing-app/server/app.js';
import { createIndexingAppRuntime } from './fixtures/indexing-app/server/runtime.js';
import { knowledgeReaderFixture } from './helpers/online-agent.js';

const runtime = createIndexingAppRuntime([], false);
const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, 'fixtures/indexing-app'),
  appRuntime: runtime,
  createServer: async (scope) =>
    startApplicationInScope(
      scope,
      createApp(await resolveAppRuntime(runtime, scope)),
    ),
});
const test = createAppTest({ scope: 'test', createServer: standalone.create });
test('production Knowledge reads and API documentation work without a registered Agents plugin', async ({
  app,
  fetch,
  request,
}) => {
  const f = await knowledgeReaderFixture(app, fetch);
  expect(app.container.has(agentsToken)).toBe(false);
  const headers = { cookie: f.cookie };
  const search = await request('/knowledge/search?q=Release', { headers });
  expect(search.status).toBe(200);
  const results = (await search.json()).data;
  expect(JSON.stringify(results)).toContain(f.documents[0]!.id);
  expect(JSON.stringify(results)).not.toContain(f.hidden.id);
  expect(
    (await request(`/knowledge/docs/${f.documents[0]!.id}`, { headers }))
      .status,
  ).toBe(200);
  const document = await app.container.resolve(apiDocsToken).getDocument();
  expect(JSON.stringify(document)).not.toContain('runToken');
});
