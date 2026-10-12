// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import seed from '../../database/main/seeds/202610250010_studio_project_manager_identity.js';
import { defaultIdentity } from '../../server/agents/manager/texts.js';
import { settingsOf } from '../../server/agents/manager/settings.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

const settings = () => h.database.connection().repository('studioSettings');
async function store(value: unknown): Promise<void> {
  const at = new Date();
  await settings().upsertOne({
    filter: { key: 'projectManager' },
    create: { key: 'projectManager', value, createdAt: at, updatedAt: at },
    update: { value, updatedAt: at },
  });
}
const read = () => settings().findOne({ filter: { key: 'projectManager' } });
async function run(locale = 'zh-CN', missingAgents = false): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) =>
      conn.repository(
        missingAgents && name === 'agAgents' ? 'missingAgents' : name,
      ),
    config: { get: () => locale },
  } as never);
}
const valueOf = (row: Awaited<ReturnType<typeof read>>) =>
  typeof row?.value === 'string'
    ? (JSON.parse(row.value) as Record<string, unknown>)
    : (row?.value as Record<string, unknown>);

describe('project manager identity initialization', () => {
  it.each(['zh-CN', 'en-US'])(
    'initializes a fresh installation in %s without the agents Collection',
    async (locale) => {
      await settings().deleteMany({ filter: { key: 'projectManager' } });
      await run(locale, true);
      expect(valueOf(await read())).toEqual(defaultIdentity(locale));
    },
  );

  it('localizes the old built-in values, clears nameText on sync, and does not write on replay after changing locale', async () => {
    await store({ principles: 'Custom rules', unknownSetting: { keep: true } });
    await run();
    expect(valueOf(await read())).toMatchObject({
      ...defaultIdentity('zh-CN'),
      principles: 'Custom rules',
      unknownSetting: { keep: true },
    });
    const before = await read();
    await run('en-US');
    expect(await read()).toEqual(before);
    await h.manager.sync();
    expect(await h.agents.agents.get(PROJECT_MANAGER_ID)).toMatchObject({
      ...defaultIdentity('zh-CN'),
      nameText: null,
    });
  });

  it.each([null, '', '  '])(
    'preserves explicitly empty settings descriptions (%j)',
    async (description) => {
      await store({ name: 'My manager', description, future: 7 });
      await run();
      expect(valueOf(await read())).toEqual({
        name: 'My manager',
        description: null,
        future: 7,
      });
      expect(settingsOf(valueOf(await read()), 'zh-CN').description).toBeNull();
      await h.manager.ready();
      expect(
        (await h.agents.agents.get(PROJECT_MANAGER_ID)).description,
      ).toBeNull();
    },
  );

  it('prioritizes explicit settings including built-in values over a different legacy agent', async () => {
    await h.database
      .connection()
      .repository('agAgents')
      .updateOne({
        filter: { id: PROJECT_MANAGER_ID },
        values: { name: 'Legacy custom', description: 'Legacy text' },
      });
    await store(defaultIdentity());
    const before = await read();
    await run();
    expect(await read()).toEqual(before);
  });

  it.each([undefined, null, '', '   ', 7])(
    'recovers invalid names (%j) and missing descriptions from a custom legacy agent',
    async (name) => {
      await h.database
        .connection()
        .repository('agAgents')
        .updateOne({
          filter: { id: PROJECT_MANAGER_ID },
          values: { name: 'Legacy custom', description: null },
        });
      await store({ ...(name === undefined ? {} : { name }), future: 'kept' });
      await run();
      expect(valueOf(await read())).toEqual({
        name: 'Legacy custom',
        description: null,
        future: 'kept',
      });
    },
  );

  it('uses defaults when there is no legacy row', async () => {
    await store({});
    await h.database
      .connection()
      .repository('agAgents')
      .deleteMany({ filter: { id: PROJECT_MANAGER_ID } });
    await run();
    expect(valueOf(await read())).toEqual(defaultIdentity('zh-CN'));
  });

  it.each([null, [], 5, 'invalid JSON'])(
    'refuses damaged settings (%j) without overwriting them or exposing their contents',
    async (value) => {
      await store(value);
      const before = await read();
      await expect(run()).rejects.toThrow(
        'Repair studioSettings.projectManager.value: expected a JSON object.',
      );
      expect(await read()).toEqual(before);
    },
  );

  it('does not turn arbitrary database failures into missing Collections', async () => {
    await store({});
    const conn = h.database.connection();
    const failure = new Error('Database unavailable');
    await expect(
      seed.run({
        repository: (name: string) =>
          name === 'agAgents'
            ? { findOne: () => Promise.reject(failure) }
            : conn.repository(name),
        config: { get: () => 'zh-CN' },
      } as never),
    ).rejects.toBe(failure);
    expect(valueOf(await read())).toEqual({});
  });
});
