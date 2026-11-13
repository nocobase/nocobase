/**
 * A chat model's thinking levels in the model services and the catalog: the built-in ones by provider and exact model
 * id over any base URL, an administrator's replacement or none, and the levels a save refuses.
 */
import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import { ModelCatalogServiceSchema } from '../server/routes/schemas.js';
import {
  supportedReasoningLevel,
  reasoningLevelsOf,
} from '../shared/models.js';

let h: Harness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});

const ADMIN = { user: 'admin', can: ['agents.services/manage'] };

async function catalogModels(name: string) {
  const catalog = await h!.services.models.gateway.catalog();
  const service = catalog.services.find((item) => item.name === name)!;
  return ModelCatalogServiceSchema.parse(service).models;
}

it('answers built-in levels for known chat models over any base URL, and none for an unknown one', async () => {
  h = await createHarness();
  const saved = await h.services.models.services.create({
    title: 'Claude through a proxy',
    provider: 'anthropic',
    baseUrl: 'https://proxy.example.invalid/v1',
    apiKey: 'k',
    models: [{ value: 'claude-opus-4-7' }, { value: 'claude-next' }],
  });
  const [known, unknown] = await catalogModels(saved.name);
  expect(known!.capabilities).toEqual({
    webSearch: false,
    reasoning: { levels: ['off', 'low', 'medium', 'high', 'xhigh'] },
  });
  expect(unknown!.capabilities).toEqual({ webSearch: false });
  expect(reasoningLevelsOf(unknown!.capabilities?.reasoning)).toEqual([
    'default',
  ]);
});

it('lets an administrator offer no levels or replace the built-in ones entirely', async () => {
  h = await createHarness();
  const saved = await h.services.models.services.create({
    title: 'OpenAI',
    provider: 'openai',
    apiKey: 'k',
    models: [
      { value: 'gpt-5.6-terra', reasoning: false },
      { value: 'gpt-6-astra', reasoning: { levels: ['high', 'off', 'high'] } },
      { value: 'custom-model', reasoning: { levels: ['max'] } },
    ],
  });
  const [none, replaced, custom] = await catalogModels(saved.name);
  expect(none).toMatchObject({ reasoning: false });
  expect(none!.capabilities).toEqual({ webSearch: true });
  // Kept once each, in the standard order; nothing of the built-in list is merged in.
  expect(replaced).toMatchObject({
    reasoning: { levels: ['off', 'high'] },
    capabilities: { reasoning: { levels: ['off', 'high'] } },
  });
  expect(custom!.capabilities?.reasoning).toEqual({ levels: ['max'] });
  expect(
    (await h.services.models.services.list())
      .find((service) => service.name === saved.name)!
      .models.map((model) => model.reasoning),
  ).toEqual([false, { levels: ['off', 'high'] }, { levels: ['max'] }]);
  // Back to the built-in levels when the setting is removed.
  await h.services.models.services.update(saved.name, {
    models: [{ value: 'gpt-5.6-terra' }],
  });
  expect((await catalogModels(saved.name))[0]!.capabilities?.reasoning).toEqual(
    { levels: ['off', 'low', 'medium', 'high', 'xhigh', 'max'] },
  );
});

it('refuses levels that are empty, unknown, default, or set on a model that is not a chat model', async () => {
  h = await createHarness();
  for (const reasoning of [
    { levels: [] },
    { levels: ['huge'] },
    { levels: ['default'] },
    true,
    { levels: ['low'], extra: 1 },
  ]) {
    const response = await h.request('POST', '/agents/services', {
      ...ADMIN,
      body: {
        title: 'OpenAI',
        provider: 'openai',
        apiKey: 'k',
        models: [{ value: 'gpt-6-astra', reasoning }],
      },
    });
    expect(response.status).toBe(400);
  }
  const embedding = await h.request('POST', '/agents/services', {
    ...ADMIN,
    body: {
      title: 'OpenAI',
      provider: 'openai',
      apiKey: 'k',
      models: [
        {
          value: 'text-embedding-3-small',
          kind: 'embedding',
          reasoning: { levels: ['low'] },
        },
      ],
    },
  });
  expect(embedding.status).toBe(400);
  const accepted = await h.request('POST', '/agents/services', {
    ...ADMIN,
    body: {
      title: 'OpenAI',
      provider: 'openai',
      apiKey: 'k',
      models: [{ value: 'gpt-6-astra', reasoning: { levels: ['low'] } }],
    },
  });
  expect(accepted.status).toBe(201);
  expect(accepted.body.data.models[0]).toMatchObject({
    reasoning: { levels: ['low'] },
    capabilities: { reasoning: { levels: ['low'] } },
  });
});

it('runs a level a model does not take at the nearest lower one it takes, else default', () => {
  const levels = { levels: ['off', 'low', 'high'] } as const;
  expect(supportedReasoningLevel('high', levels)).toBe('high');
  expect(supportedReasoningLevel('max', levels)).toBe('high');
  expect(supportedReasoningLevel('medium', levels)).toBe('low');
  expect(supportedReasoningLevel('minimal', levels)).toBe('default');
  expect(supportedReasoningLevel('off', { levels: ['low'] })).toBe('default');
  expect(supportedReasoningLevel('low', undefined)).toBe('default');
  expect(supportedReasoningLevel('default', undefined)).toBe('default');
});
