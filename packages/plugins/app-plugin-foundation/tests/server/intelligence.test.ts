import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiAgents } from '../../server/capabilities/intelligence.js';
import {
  ApplicationUnderConstruction,
  capability,
} from '../helpers/application.js';

describe('AI Foundation configuration evidence', () => {
  let app: ApplicationUnderConstruction;
  beforeEach(async () => {
    app = await ApplicationUnderConstruction.create();
    await app.testDatabase.migrate([
      {
        packageName: '@nocobase/app-plugin-agents',
        directory: fileURLToPath(
          new URL('../fixtures/ai/migrations', import.meta.url),
        ),
      },
    ]);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app.destroy();
  });

  const overview = async () =>
    capability(
      await app.service({ collectors: [aiAgents] }).overview(),
      'aiAgents',
    );
  const enableModel = async () => {
    await app.database
      .repository('agModelServices')
      .createOne({ values: { id: 'model', enabled: true } });
  };

  function failCount(collection: string): void {
    const repository = app.database.repository.bind(app.database);
    vi.spyOn(app.database, 'repository').mockImplementation((...args) => {
      const original = repository(...args);
      if (args[0] !== collection) return original;
      return new Proxy(original, {
        get(target, key) {
          if (key === 'count')
            return async () => {
              throw new Error('private database credential');
            };
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    });
  }

  it('recognizes native OnlineAgent configuration without persisted agents, runners or execution history', async () => {
    await enableModel();
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await overview();
      expect(result.status).toBe('active');
      expect(result.reason).toBeUndefined();
      expect(result.parts).toContainEqual({ key: 'agents', status: 'unused' });
      expect(result.facts).toContainEqual({
        code: 'modelServices',
        params: { count: 1 },
      });
      expect(result.metrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'agents', value: 0 }),
          expect.objectContaining({ key: 'runners', value: 0 }),
          expect.objectContaining({ key: 'runs', value: 0 }),
        ]),
      );
    }
    expect(await app.database.repository('agAgents').count()).toBe(0);
    expect(await app.database.repository('agModelServices').count()).toBe(1);
  });

  it('recognizes the model gateway without an Agent record and retains actual usage metrics', async () => {
    await enableModel();
    await app.database.repository('agModelUsage').createOne({
      values: { id: 'gateway-call', inputTokens: 17, outputTokens: 7 },
    });
    const result = await overview();
    expect(result.status).toBe('active');
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'modelCalls', value: 1 }),
        expect.objectContaining({ key: 'tokens', value: 24 }),
      ]),
    );
    expect(result.facts.some((item) => item.code === 'agents')).toBe(false);
  });

  it('does not treat disabled models, historical calls or Agent definitions alone as current configuration', async () => {
    await app.database
      .repository('agModelServices')
      .createOne({ values: { id: 'disabled', enabled: false } });
    await app.database
      .repository('agAgents')
      .createOne({ values: { id: 'definition' } });
    await app.database.repository('agModelUsage').createOne({
      values: { id: 'old-call', inputTokens: 17, outputTokens: 7 },
    });
    expect(await overview()).toMatchObject({
      status: 'needsSetup',
      reason: 'noModelOrRunner',
    });
  });

  it('keeps a registered Runner active independently of model services', async () => {
    await app.database
      .repository('agRunners')
      .createOne({ values: { id: 'runner' } });
    expect(await overview()).toMatchObject({ status: 'active' });
    await app.database.builder().dropCollection('agModelServices');
    expect(await overview()).toMatchObject({ status: 'active' });
  });

  it('reports setup only when both execution paths are confirmed unconfigured', async () => {
    expect(await overview()).toMatchObject({
      status: 'needsSetup',
      reason: 'noModelOrRunner',
      completeness: 'complete',
    });
  });

  it.each(['agModelServices', 'agRunners'])(
    'keeps status unknown when %s configuration evidence cannot be read',
    async (collection) => {
      failCount(collection);
      const result = await overview();
      expect(result).toMatchObject({
        status: null,
        completeness: 'partial',
        issues: [{ code: 'SOURCE_UNREADABLE', source: collection }],
      });
      expect(result.reason).toBeUndefined();
      const key =
        collection === 'agModelServices' ? 'modelServices' : 'runners';
      expect(result.parts).toContainEqual({ key, status: null });
      expect(result.metrics).toContainEqual(
        expect.objectContaining({
          key,
          value: null,
          complete: false,
        }),
      );
      expect(JSON.stringify(result)).not.toContain(
        'private database credential',
      );
    },
  );

  it.each(['agModelServices', 'agAgents', 'agModelUsage'])(
    'retains confirmed Runner evidence when %s cannot be counted',
    async (collection) => {
      await app.database
        .repository('agRunners')
        .createOne({ values: { id: 'runner' } });
      failCount(collection);
      expect(await overview()).toMatchObject({
        status: 'active',
        completeness: 'partial',
      });
    },
  );

  it('retains confirmed model-service evidence when Runner or Agent reads fail', async () => {
    await enableModel();
    failCount('agRunners');
    expect(await overview()).toMatchObject({
      status: 'active',
      completeness: 'partial',
    });
    vi.restoreAllMocks();
    failCount('agAgents');
    const result = await overview();
    expect(result).toMatchObject({ status: 'active', completeness: 'partial' });
    expect(result.parts.some((item) => item.key === 'agents')).toBe(false);
  });
});
