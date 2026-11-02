// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createAppTest } from '@nocobase/app-testing/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { expect, it } from 'vitest';
import { createKnowledgeIndexingRegistry } from '../server/indexing/index.js';
import {
  knowledgeIndexingToken,
  knowledgeToken,
  knowledgeAccessToken,
} from '../server/tokens.js';
import { textIndexingExtension } from './fixtures/text-indexing-extension.js';
import { createApp } from './fixtures/indexing-app/server/app.js';
import { createIndexingAppRuntime } from './fixtures/indexing-app/server/runtime.js';

const runtime = createIndexingAppRuntime([textIndexingExtension], false);
const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, 'fixtures/indexing-app'),
  appRuntime: runtime,
  createServer: async (scope) =>
    startApplicationInScope(
      scope,
      createApp(await resolveAppRuntime(runtime, scope)),
    ),
});
const test = createAppTest({
  createServer: standalone.create,
  config: {
    knowledge: {
      indexing: { lexical: { name: 'Text only', type: 'fixture-text' } },
    },
  },
});
test('wires the same custom text extension through config and Providers without Agents or Embedding', async ({
  app,
}) => {
  expect(await app.config.validate()).toEqual([]);
  const auth = app.container.resolve(authorizationToken);
  const subject = { type: 'user', id: 'text-admin' };
  await auth.permissionSets.assign({ subject, permissionSet: 'root' });
  const context = auth.for({ principal: subject, subjects: [] });
  const service = app.container.resolve(knowledgeIndexingToken);
  expect((await service.instances(context)).items).toMatchObject([
    {
      key: 'lexical',
      type: 'fixture-text',
      channels: [{ name: 'terms', kind: 'lexical' }],
    },
  ]);
  app.container.singleton(knowledgeAccessToken, () => ({
    space: (space) => (space.scope === 'system' ? space : null),
    inherits: () => [],
    forReader: () => ({
      access: async () => ({
        read: true,
        propose: true,
        edit: true,
        manage: true,
      }),
    }),
    title: async () => null,
    names: async () => new Map(),
  }));
  const knowledge = app.container.resolve(knowledgeToken);
  const doc = await knowledge.docs.create(
    { kind: 'user', userId: subject.id },
    {
      scope: 'system',
      scopeId: 'main',
      title: 'Text fixture',
      content: 'A canary is indexed by the custom extension.',
    },
  );
  await service.save(context, {
    requestId: randomUUID(),
    expectedRevision: '0',
    config: { version: 1, key: 'lexical', options: {} },
    acknowledgeFullRebuild: true,
  });
  await expect
    .poll(async () => (await service.status(context)).availability)
    .toBe('ready');
  const hits = await knowledge.docs.searchMany(
    { kind: 'user', userId: subject.id },
    [{ scope: 'system', scopeId: 'main' }],
    'needle',
  );
  expect(hits.map((hit) => hit.docId)).toContain(doc.id);
  expect((await service.models(context)).reason).toBeTruthy();
});
it('isolates and seals runtime registries and only permits release before seal', () => {
  const a = createKnowledgeIndexingRegistry();
  const b = createKnowledgeIndexingRegistry();
  const release = a.register(textIndexingExtension);
  expect(b.list()).toEqual([]);
  expect(() => a.register(textIndexingExtension)).toThrow();
  release();
  const releaseAgain = a.register(textIndexingExtension);
  release();
  expect(a.get('fixture-text')).toBe(textIndexingExtension);
  a.seal();
  expect(() => releaseAgain()).toThrow();
  expect(() => a.register(textIndexingExtension)).toThrow();
});
