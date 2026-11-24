/**
 * The model services (`agModelServices`): managed through the services and the admin routes behind `agents.services`,
 * keys sealed and never answered, with a local OpenAI-compatible server standing in for the provider.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createAgents } from '../server/composition.js';
import { nameFrom } from '../server/online/services.js';
import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

const ADMIN = {
  user: 'admin',
  can: ['agents.services/read', 'agents.services/manage'],
};

describe('model services', () => {
  let h: Harness | undefined;
  let mock: MockOpenAI;

  beforeEach(async () => {
    mock = await startMockOpenAI();
  });
  afterEach(async () => {
    await h?.close();
    h = undefined;
    await mock.close();
  });

  const local = () => ({
    title: 'Local',
    provider: 'openai-compatible' as const,
    baseUrl: `${mock.url}/`,
    apiKey: 'test-key',
    models: [{ value: 'mock-model' }, { value: 'mock-model' }],
  });

  it('blocks provider access after restarting against an existing model database', async () => {
    h = await createHarness();
    const original = h.services.models.services;
    const saved = await original.create(local());
    const ref = { modelService: saved.name, model: 'mock-model' };
    const session = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: { agentId: 'online' },
    });
    expect(session.status).toBe(201);
    const restarted = createAgents({
      modelServices: false,
      database: h.database,
      idGenerator: { generateString: () => 'unused' },
    });
    try {
      await restarted.onlineAgent.recoverAtStartup();
      const { services, gateway } = restarted.models;
      expect(await services.list()).toEqual([]);
      expect((await gateway.catalog()).services).toEqual([]);
      await expect(services.connectionFor(ref)).rejects.toThrow('disabled');
      await expect(services.endpointFor(ref, 'chat')).rejects.toThrow(
        'disabled',
      );
      await expect(
        gateway.generate({ model: ref, prompt: 'hello', source: 'test' }),
      ).rejects.toThrow('disabled');
      await expect(
        gateway.embed({ model: ref, values: ['hello'], source: 'test' }),
      ).rejects.toThrow('disabled');
      await expect(services.remove(saved.name)).rejects.toThrow('disabled');
      expect(mock.seen).toEqual([]);
      expect((await original.list()).map((item) => item.name)).toEqual([
        saved.name,
      ]);
    } finally {
      await restarted.onlineAgent.shutdown();
    }
  });

  it('names a service from its title', () => {
    expect(nameFrom('Team OpenAI', 'openai')).toBe('team-openai');
    expect(nameFrom('团队模型', 'openai')).toBe('openai');
  });

  it('adds services, never answers their keys, and offers their models', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    expect(await services.create(local())).toEqual({
      name: 'local',
      title: 'Local',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      apiKeySet: true,
      enabled: true,
      models: [
        {
          value: 'mock-model',
          label: 'mock-model',
          kind: 'chat',
          capabilities: { webSearch: false },
          dimensions: null,
        },
      ],
    });
    // Several services of one provider, the second named apart.
    expect((await services.create(local())).name).toBe('local-2');
    expect(JSON.stringify(await services.list())).not.toContain('test-key');
    const stored = await h.database
      .connection()
      .repository<{ apiKeyEncrypted: string }>('agModelServices')
      .findMany({});
    expect(stored[0]?.apiKeyEncrypted).not.toContain('test-key');
    expect(await h.services.models.gateway.catalog()).toEqual({
      services: [
        expect.objectContaining({
          name: 'local',
          provider: 'openai-compatible',
        }),
        expect.objectContaining({ name: 'local-2' }),
      ],
      // The first chat model enabled is the default.
      defaultModel: { modelService: 'local', model: 'mock-model' },
    });
  });

  it('replaces and clears the key, switches a service off and deletes it with its prices', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    await services.create(local());
    expect((await services.update('local', { apiKey: null })).apiKeySet).toBe(
      false,
    );
    expect(
      (await services.update('local', { apiKey: 'other' })).apiKeySet,
    ).toBe(true);
    await services.update('local', { enabled: false });
    expect(await h.services.models.gateway.catalog()).toEqual({
      services: [],
      defaultModel: null,
    });
    await h.services.prices.replace({
      prices: [
        {
          tool: 'online',
          modelService: 'local',
          model: 'mock-model',
          inputPerM: 1,
          outputPerM: 2,
        },
      ],
      subscriptions: [],
    });
    await services.remove('local');
    expect(await services.list()).toEqual([]);
    expect((await h.services.prices.list()).items).toEqual([]);
    await expect(services.remove('local')).rejects.toMatchObject({
      code: 'MODEL_SERVICE_NOT_FOUND',
    });
  });

  it('needs a base URL where the provider has no default, and an http(s) one', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    await expect(
      services.create({ title: 'Mine', provider: 'openai-compatible' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      services.create({
        title: 'Mine',
        provider: 'openai',
        baseUrl: 'ftp://example.com',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('refuses to keep a key without the agents key', async () => {
    h = await createHarness({ secrets: null });
    await expect(
      h.services.models.services.create(local()),
    ).rejects.toMatchObject({ code: 'SECRETS_KEY_MISSING' });
  });

  it('fetches models and checks one over a connection being edited or saved', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    // Before saving: what is being edited.
    expect(
      await services.models({
        provider: 'openai-compatible',
        baseUrl: mock.url,
        apiKey: 'test-key',
      }),
    ).toEqual({
      ok: true,
      items: [
        { id: 'mock-mini', kind: 'chat' },
        { id: 'mock-model', kind: 'chat' },
      ],
    });
    expect(
      await services.models({
        provider: 'openai-compatible',
        baseUrl: mock.url,
        apiKey: 'bad-key',
      }),
    ).toEqual({ ok: false, message: 'Incorrect API key.' });
    await services.create(local());
    // Saved: its key is used without being sent.
    expect(await services.models({ service: 'local' })).toMatchObject({
      ok: true,
    });
    mock.answer({ text: ['ok'] });
    expect(
      await services.check({ service: 'local', model: 'mock-model' }),
    ).toEqual({ ok: true, message: null });
    expect(mock.requests.at(-1)?.authorization).toBe('Bearer test-key');
    mock.answer({ status: 401, error: { message: 'Incorrect API key.' } });
    expect(
      await services.check({
        service: 'local',
        apiKey: 'bad-key',
        model: 'mock-model',
      }),
    ).toEqual({ ok: false, message: 'Incorrect API key.' });
  });

  it('says a model looks like another kind when it answers as that kind instead', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    await services.create(local());
    // The mock embeds any model: a model that will not chat but embeds looks like an embedding model.
    mock.answer({ status: 404, error: { message: 'Not a chat model.' } });
    const checked = await services.check({
      service: 'local',
      model: 'mock-model',
      kind: 'chat',
    });
    expect(checked).toMatchObject({ ok: false, looksLike: 'embedding' });
    expect(checked).not.toHaveProperty('code');
    // Checked as the kind it is, it answers.
    expect(
      await services.check({
        service: 'local',
        model: 'mock-model',
        kind: 'embedding',
      }),
    ).toEqual({ ok: true, message: null });
    // A key the provider refuses is the connection's problem, not the kind's.
    mock.answer({ status: 401, error: { message: 'Incorrect API key.' } });
    expect(
      await services.check({ service: 'local', model: 'mock-model' }),
    ).toEqual({ ok: false, message: 'Incorrect API key.' });
  });

  it('makes the first chat model enabled the default chat model, and keeps the one set', async () => {
    h = await createHarness();
    const services = h.services.models.services;
    expect(await services.defaults()).toEqual({
      chat: null,
      effectiveChat: null,
    });
    await services.create({
      ...local(),
      title: 'Vectors',
      models: [{ value: 'mock-embed', kind: 'embedding' }],
    });
    expect((await services.defaults()).chat).toBeNull();
    await services.update('vectors', {
      models: [
        { value: 'mock-embed', kind: 'embedding' },
        { value: 'mock-mini', label: 'Mini' },
      ],
    });
    expect(await services.defaults()).toEqual({
      chat: { modelService: 'vectors', model: 'mock-mini' },
      effectiveChat: {
        modelService: 'vectors',
        model: 'mock-mini',
        serviceTitle: 'Vectors',
        modelLabel: 'Mini',
      },
    });
    await services.create(local());
    await services.setDefaultChat(
      { modelService: 'local', model: 'mock-model' },
      'admin',
    );
    expect((await h.services.models.gateway.catalog()).defaultModel).toEqual({
      modelService: 'local',
      model: 'mock-model',
    });
    // The one set no longer offered, the first offered is used, until another is set.
    await services.update('local', { enabled: false });
    expect(await services.defaults()).toMatchObject({
      chat: { modelService: 'local', model: 'mock-model' },
      effectiveChat: { modelService: 'vectors', model: 'mock-mini' },
    });
    await expect(
      services.setDefaultChat(
        { modelService: 'vectors', model: 'mock-embed' },
        'admin',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('refuses a model’s thinking levels and ignores ones an earlier build saved', async () => {
    h = await createHarness();
    await h.services.models.services.create(local());
    for (const reasoning of [false, { levels: ['off', 'high'] }])
      expect(
        (
          await h.request('PATCH', '/agents/services/local', {
            ...ADMIN,
            body: { models: [{ value: 'mock-model', reasoning }] },
          })
        ).status,
      ).toBe(400);
    expect(
      (
        await h.request('PATCH', '/agents/services/local', {
          ...ADMIN,
          body: { models: [{ value: 'mock-model' }] },
        })
      ).status,
    ).toBe(200);
    await h.database
      .connection()
      .repository('agModelServices')
      .updateMany({
        filter: { name: 'local' },
        values: { models: [{ value: 'mock-model', reasoning: false }] },
      });
    const [service] = await h.services.models.services.list();
    expect(service!.models).toEqual([
      {
        value: 'mock-model',
        label: 'mock-model',
        kind: 'chat',
        capabilities: { webSearch: false },
        dimensions: null,
      },
    ]);
  });

  it('serves the routes behind agents.services read and manage', async () => {
    h = await createHarness();
    const reader = { user: 'bob', can: ['agents.services/read'] };
    expect((await h.request('GET', '/agents/services', reader)).status).toBe(
      200,
    );
    for (const [method, path] of [
      ['POST', '/agents/services'],
      ['PATCH', '/agents/services/local'],
      ['DELETE', '/agents/services/local'],
      ['POST', '/agents/discoverModels'],
      ['POST', '/agents/checkConnection'],
    ] as const)
      expect(
        (await h.request(method, path, { ...reader, body: {} })).status,
      ).toBe(403);
    expect(
      (await h.request('GET', '/agents/services', { user: 'eve' })).status,
    ).toBe(403);

    const created = await h.request('POST', '/agents/services', {
      ...ADMIN,
      body: local(),
    });
    expect(created.status).toBe(201);
    expect(JSON.stringify(created.body.data)).not.toContain('test-key');
    expect(
      (
        await h.request('POST', '/agents/services', {
          ...ADMIN,
          body: { title: 'X', provider: 'nope' },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.request('PATCH', '/agents/services/nope', {
          ...ADMIN,
          body: { title: 'X' },
        })
      ).status,
    ).toBe(404);
    mock.answer({ text: ['ok'] });
    expect(
      (
        await h.request('POST', '/agents/checkConnection', {
          ...ADMIN,
          body: { service: 'local', model: 'mock-model' },
        })
      ).body.data,
    ).toEqual({ ok: true, message: null });
    // Anyone signed in reads the catalog: names only.
    const catalog = await h.request('GET', '/agents/models', {
      user: 'eve',
    });
    expect(catalog.body.data).toEqual([
      {
        name: 'local',
        title: 'Local',
        provider: 'openai-compatible',
        models: [
          {
            value: 'mock-model',
            label: 'mock-model',
            kind: 'chat',
            capabilities: { webSearch: false },
            dimensions: null,
          },
        ],
      },
    ]);
    expect(
      (await h.request('DELETE', '/agents/services/local', ADMIN)).status,
    ).toBe(204);
  });
});
