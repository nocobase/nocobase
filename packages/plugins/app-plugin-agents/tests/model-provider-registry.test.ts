/**
 * A model service provider another plugin registers (`agents.models.providers.register`): offered in "Add service"
 * beside the built-in ones, saved on a service, its models fetched and checked through what it creates; once nobody
 * provides it, its services stay and answer why they cannot be called.
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MODEL_PROVIDERS } from '../shared/models.js';
import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

const ADMIN = {
  user: 'admin',
  can: ['agents.services/read', 'agents.services/manage'],
};

describe('registered model providers', () => {
  let h: Harness | undefined;
  let mock: MockOpenAI;
  let unregister: (() => void) | undefined;

  beforeEach(async () => {
    mock = await startMockOpenAI();
  });
  afterEach(async () => {
    unregister?.();
    unregister = undefined;
    await h?.close();
    h = undefined;
    await mock.close();
  });

  it('offers, saves, lists and checks a provider another plugin registered', async () => {
    h = await createHarness();
    const providers = h.services.models.providers;
    expect(() =>
      providers.register({
        type: 'openai',
        title: 'Taken',
        kinds: ['chat'],
        create: () => ({}),
      }),
    ).toThrow(/already registered/u);
    unregister = providers.register({
      type: 'acme',
      title: 'Acme AI',
      kinds: ['chat'],
      keyRequired: true,
      create: ({ baseUrl, apiKey }) => {
        const sdk = createOpenAICompatible({
          name: 'acme',
          baseURL: baseUrl ?? '',
          ...(apiKey ? { apiKey } : {}),
        });
        return {
          language: (model) => sdk(model),
          listModels: () => Promise.resolve(['acme-2', 'acme-1', 'acme-1']),
        };
      },
    });

    const listed = await h.request('GET', '/agents/modelProviders', {
      user: 'bob',
      can: ['agents.services/read'],
    });
    expect(listed.status).toBe(200);
    expect(listed.body.data.map((p: { name: string }) => p.name)).toEqual([
      ...MODEL_PROVIDERS.map((provider) => provider.name),
      'acme',
    ]);
    expect(listed.body.data.at(-1)).toEqual({
      name: 'acme',
      title: 'Acme AI',
      defaultBaseUrl: null,
      keyRequired: true,
      kinds: ['chat'],
    });
    expect(
      (await h.request('GET', '/agents/modelProviders', { user: 'eve' }))
        .status,
    ).toBe(403);

    const created = await h.request('POST', '/agents/services', {
      ...ADMIN,
      body: {
        title: 'Acme',
        provider: 'acme',
        baseUrl: mock.url,
        apiKey: 'acme-key',
        models: [{ value: 'acme-1' }],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: 'acme', provider: 'acme' });

    const services = h.services.models.services;
    expect(await services.models({ service: 'acme' })).toEqual({
      ok: true,
      items: [
        { id: 'acme-1', kind: 'chat' },
        { id: 'acme-2', kind: 'chat' },
      ],
    });
    mock.answer({ text: ['ok'] });
    expect(await services.check({ service: 'acme', model: 'acme-1' })).toEqual(
      { ok: true, message: null },
    );
    expect(mock.requests.at(-1)?.authorization).toBe('Bearer acme-key');

    // Nobody provides it any more: the service stays, and calling it says why.
    unregister();
    unregister = undefined;
    expect((await services.list()).map((service) => service.provider)).toEqual(
      ['acme'],
    );
    const check = await services.check({ service: 'acme', model: 'acme-1' });
    expect(check.ok).toBe(false);
    expect(check.message).toMatch(/not available/u);
    expect(
      (
        await h.request('POST', '/agents/services', {
          ...ADMIN,
          body: { title: 'Again', provider: 'acme', baseUrl: mock.url },
        })
      ).status,
    ).toBe(400);
  });
});
