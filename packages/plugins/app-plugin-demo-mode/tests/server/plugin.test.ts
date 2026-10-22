import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DemoModeConfig } from '../../server/index.js';
import { demoWriteGuardToken } from '../../server/guard.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

async function startApp(demoMode: DemoModeConfig): Promise<TestApp> {
  return createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { ...demoMode } },
  });
}

async function names(app: TestApp, table: string): Promise<string[]> {
  const rows = await app.connection.query
    .selectFrom(table)
    .select(['name'])
    .execute();
  return rows.map((row) => String(row.name)).sort();
}

const post = (app: TestApp, path: string) =>
  app.request(path, { method: 'POST' });

describe('read-only mode', () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await startApp({
      mode: 'read-only',
      allowCollections: ['demonotes'],
    });
    // Writes outside any request, as a seed or job makes them, are never refused.
    await app.connection.query
      .insertInto('demoitems')
      .values({ name: 'seeded' })
      .execute();
  });
  afterAll(() => app.close());

  it('reports the mode to the browser without a session', async () => {
    const response = await app.request('/demoMode/status');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { mode: 'read-only' },
    });
  });

  it('lets requests read', async () => {
    const response = await app.request('/items');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ name: 'seeded' }],
    });
  });

  it.each(['/items', '/items/raw', '/items/transaction', '/items/wrapped'])(
    'refuses the write %s makes before it reaches the database',
    async (path) => {
      const response = await post(app, path);
      expect(response.status).toBe(400);
      expect(response.headers.get('server-timing')).toContain('demo-read-only');
      await expect(response.json()).resolves.toMatchObject({
        error: {
          code: 400,
          status: 'FAILED_PRECONDITION',
          reason: 'DEMO_READ_ONLY',
          domain: 'demoMode',
        },
      });
      expect(await names(app, 'demoitems')).toEqual(['seeded']);
    },
  );

  it('keeps the answer of a route that handles the failure, unmarked', async () => {
    const response = await post(app, '/items/swallowed');
    expect(response.status).toBe(200);
    expect(response.headers.get('server-timing')).toBeNull();
    await expect(response.json()).resolves.toEqual({
      data: { saved: false },
    });
    expect(await names(app, 'demoitems')).toEqual(['seeded']);
  });

  it('lets requests write the tables the deployment allows', async () => {
    const response = await post(app, '/notes');
    expect(response.status).toBe(200);
    expect(response.headers.get('server-timing')).toBeNull();
    expect(await names(app, 'demonotes')).toEqual(['note']);
  });

  it.each(['/auth/revoke-other-sessions', '/users/1/revokeSessions'])(
    'refuses %s, which ends other sessions, although the session table is allowed',
    async (path) => {
      const response = await post(app, path);
      expect(response.status).toBe(400);
      expect(await names(app, 'session')).toEqual([]);
    },
  );
});

it('isolates an asynchronous demo import from other requests and restores its guard after failure', async () => {
  const app = await startApp({ mode: 'read-only' });
  const guard = app.application.container.resolve(demoWriteGuardToken);
  let release!: () => void;
  let started!: () => void;
  const paused = new Promise<void>((resolve) => {
    release = resolve;
  });
  const importing = new Promise<void>((resolve) => {
    started = resolve;
  });
  const insert = (name: string) =>
    app.connection.query.insertInto('demoitems').values({ name }).execute();
  try {
    await guard.run(
      { method: 'POST', path: '/demoMode/data/import', blocked: [] },
      async () => {
        const job = guard.runDemoData(async () => {
          await insert('imported');
          started();
          await paused;
          await insert('background');
          // Failure cleanup must keep the import's exemption too.
          await app.connection.query
            .deleteFrom('demoitems')
            .allowAllRows()
            .execute();
          throw new Error('import failed');
        });
        const completed = job.catch((error: unknown) => error);
        try {
          await importing;
          expect((await post(app, '/items')).status).toBe(400);
          expect(await names(app, 'demoitems')).toEqual(['imported']);
        } finally {
          release();
          await completed;
        }
        expect(await completed).toMatchObject({ message: 'import failed' });
        await expect(insert('outside-import')).rejects.toThrow();
      },
    );
    expect((await post(app, '/items')).status).toBe(400);
    expect(await names(app, 'demoitems')).toEqual([]);
  } finally {
    release();
    await app.close();
  }
});

describe('observe mode', () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await startApp({ mode: 'observe' });
  });
  afterAll(() => app.close());

  it('lets writes through', async () => {
    const response = await post(app, '/items');
    expect(response.status).toBe(200);
    expect(response.headers.get('server-timing')).toBeNull();
    expect(await names(app, 'demoitems')).toEqual(['builder']);
  });
});

describe('off', () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await startApp({});
  });
  afterAll(() => app.close());

  it('changes nothing', async () => {
    await expect(
      (await app.request('/demoMode/status')).json(),
    ).resolves.toEqual({ data: { mode: 'off' } });
    expect((await post(app, '/items')).status).toBe(200);
    expect(await names(app, 'demoitems')).toEqual(['builder']);
  });
});
