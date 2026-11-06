import { randomBytes } from 'node:crypto';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { apiKeyScopesToken } from '@nocobase/app-plugin-api-keys/server';
import type { ModelServiceView } from '@nocobase/app-plugin-agents/shared/models';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, vi } from 'vitest';

import { TRANSLATION_MAX_LENGTH } from '../../shared/ai-translation.js';
import { createStandaloneServer } from '../../server/standalone.js';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  install: true,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: randomBytes(32).toString('hex'),
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { enabled: true, disableSignUp: false },
    },
    secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
    agents: { vectors: { store: false } },
  },
});
const write = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(body),
});

test('validates and documents translation, and runs the real native background SDK against a local HTTP model as an ordinary member', async ({
  app,
  request,
  testApp,
}) => {
  const anonymous = await request('/aiTranslation', write({}));
  expect(anonymous.status).toBe(401);
  expect(await anonymous.json()).toMatchObject({
    error: { reason: 'AUTHENTICATION_REQUIRED' },
  });
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const email = 'translation-member@example.test';
  const password = randomBytes(24).toString('hex');
  expect(
    (
      await request(
        '/auth/sign-up/email',
        write({ name: 'Translation member', email, password }),
      )
    ).status,
  ).toBe(200);
  const member = await signIn(testApp, { email, password });
  expect((await member.fetch('/agents/services')).status).toBe(403);
  expect((await member.fetch('/agents/models?kind=chat')).status).toBe(200);
  // Own-path security must not spill into another application's public contribution.
  expect((await request('/example')).status).toBe(200);

  const model = { modelService: 'not-offered', model: 'fixture-chat' };
  const input = {
    text: '  Hello\nworld  ',
    sourceLanguage: 'auto',
    targetLanguage: 'ja',
    model,
  };
  const online = app.container.resolve(agentsToken).onlineAgent;
  const background = vi.spyOn(online, 'background');
  const removeScope = app.container.resolve(apiKeyScopesToken).groups.add({
    id: 'translation.fixture',
    category: 'administration',
    title: 'Translation fixture',
    levels: {
      read: [{ kind: 'settings', id: 'agents.services', action: 'read' }],
    },
  });
  const fixture = await createOnlineAgentModelFixture({
    initialText: JSON.stringify({ translation: '  こんにちは\n世界  ' }),
  });
  try {
    const issued = await admin.fetch(
      '/apiKeys',
      write({
        name: 'Translation scoped fixture',
        expiresInDays: 1,
        scope: { groups: { 'translation.fixture': { level: 'read' } } },
      }),
    );
    expect(issued.status).toBe(201);
    const { data: key } = (await issued.json()) as { data: { secret: string } };
    const restricted = await request('/aiTranslation', {
      ...write({}),
      headers: { ...write({}).headers, 'x-api-key': key.secret },
    });
    expect(restricted.status).toBe(403);
    expect(await restricted.json()).toMatchObject({
      error: { reason: 'SCOPED_KEY_FORBIDDEN' },
    });
    expect(background).not.toHaveBeenCalled();

    for (const invalid of [
      { ...input, text: '' },
      { ...input, text: ' \n\t ' },
      { ...input, text: 'x'.repeat(TRANSLATION_MAX_LENGTH + 1) },
      { ...input, sourceLanguage: 'unknown' },
      { ...input, targetLanguage: 'auto' },
      { ...input, extra: true },
      { ...input, model: { ...model, apiKey: 'browser-secret' } },
      { ...input, model: undefined },
    ]) {
      const response = await member.fetch('/aiTranslation', write(invalid));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          reason: 'INVALID_INPUT',
          fieldViolations: expect.any(Array),
        },
      });
    }
    const missing = await member.fetch('/aiTranslation', write(input));
    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({
      error: {
        reason: 'TRANSLATION_INVALID_MODEL',
        fieldViolations: [expect.objectContaining({ field: 'model' })],
      },
    });
    const oversized = await member.fetch(
      '/aiTranslation',
      write({ ...input, text: 'x'.repeat(80_000) }),
    );
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({
      error: { reason: 'BODY_TOO_LARGE', code: 413 },
    });
    expect(background).not.toHaveBeenCalled();
    expect(fixture.requests).toHaveLength(0);

    const created = await admin.fetch(
      '/agents/services',
      write({
        title: 'Translation local fixture',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey: randomBytes(16).toString('hex'),
        enabled: true,
        models: [
          { value: 'fixture-chat', kind: 'chat' },
          { value: 'fixture-selected', kind: 'chat' },
          { value: 'fixture-embedding', kind: 'embedding' },
        ],
      }),
    );
    expect(created.status).toBe(201);
    const service = ((await created.json()) as { data: ModelServiceView }).data;
    input.model = { modelService: service.name, model: 'fixture-selected' };
    const wrongKind = await member.fetch(
      '/aiTranslation',
      write({
        ...input,
        model: { ...input.model, model: 'fixture-embedding' },
      }),
    );
    expect(wrongKind.status).toBe(400);
    expect(background).not.toHaveBeenCalled();

    const pending = member.fetch('/aiTranslation', write(input));
    await expect.poll(() => fixture.streams.length).toBe(1);
    fixture.complete(0);
    const success = await pending;
    expect(success.status).toBe(200);
    expect(await success.json()).toEqual({
      data: { translation: '  こんにちは\n世界  ' },
    });
    expect(background).toHaveBeenCalledOnce();
    const [actor, options] = background.mock.calls[0]!;
    expect(actor.user.id).toBe(actor.authorization.identity.principal?.id);
    expect(actor.credentials).toMatchObject({ user: { email } });
    expect(options).toMatchObject({
      agentId: 'online',
      scope: [],
      tool: [],
      model: [`${service.name}/fixture-selected`],
      selectedModel: input.model,
      source: 'aiTranslation',
    });
    expect(fixture.requests[0]).toMatchObject({ model: 'fixture-selected' });
    expect(JSON.stringify(fixture.requests[0]!.messages)).toContain('Hello');

    // The largest valid text and omitted language fields exercise the shared limits and server defaults.
    const longest = member.fetch(
      '/aiTranslation',
      write({ text: 'x'.repeat(TRANSLATION_MAX_LENGTH), model: input.model }),
    );
    await expect.poll(() => fixture.streams.length).toBe(2);
    fixture.complete(1);
    expect((await longest).status).toBe(200);
    expect(JSON.stringify(fixture.requests[1]!.messages)).toContain(
      'sourceLanguage',
    );
    expect(JSON.stringify(fixture.requests[1]!.messages)).toContain('auto');

    // A completed but invalid structured result is an opaque failure, not provider text or SDK history.
    const invalidResultFixture = await createOnlineAgentModelFixture({
      initialText: 'provider-private-not-json',
    });
    try {
      const changed = await admin.fetch(`/agents/services/${service.name}`, {
        ...write({ baseUrl: invalidResultFixture.url }),
        method: 'PATCH',
      });
      expect(changed.status).toBe(200);
      const failed = member.fetch('/aiTranslation', write(input));
      await expect.poll(() => invalidResultFixture.streams.length).toBe(1);
      invalidResultFixture.complete(0);
      const response = await failed;
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toMatchObject({ error: { reason: 'TRANSLATION_FAILED' } });
      expect(JSON.stringify(body)).not.toContain('provider-private');
      expect(invalidResultFixture.requests).toHaveLength(1);
    } finally {
      await invalidResultFixture.close();
    }

    expect(findUndeclaredApiRoutes(app)).toEqual([]);
    const document = await app.container.resolve(apiDocsToken).getDocument();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operation = document.paths?.['/api/aiTranslation']?.post;
    expect(operation?.operationId).toBe('examplesTranslateText');
    expect(Object.keys(operation?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '403',
      '413',
      '500',
      '504',
    ]);
  } finally {
    removeScope();
    background.mockRestore();
    await fixture.close();
  }
});
