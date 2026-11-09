import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  createAppTest,
  createTestApp,
  createTestAppConfig,
  inspectCollection,
  testDatabaseDialect,
} from '../src/server/index.js';
import { createStandaloneServer } from './fixtures/app/server/standalone.js';

describe('createTestApp', () => {
  it('starts the application through its own server, installed on test databases of its own', async () => {
    const testApp = await createTestApp({
      createServer: createStandaloneServer,
    });
    const { directory } = testApp.config;
    try {
      expect(testApp.connection.dialect).toBe(testDatabaseDialect());
      const response = await testApp.request('/items');
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        data: [{ name: 'first' }, { name: 'second' }],
      });
    } finally {
      await testApp.close();
    }
    expect(existsSync(directory)).toBe(false);
  });

  it('leaves installing to the test when asked', async () => {
    const testApp = await createTestApp({
      createServer: createStandaloneServer,
      install: false,
    });
    try {
      await expect(
        inspectCollection(testApp.connection, 'fixtureItems'),
      ).resolves.toBeUndefined();
    } finally {
      await testApp.close();
    }
  });

  it('keeps applications started side by side apart', async () => {
    const [left, right] = await Promise.all([
      createTestApp({ createServer: createStandaloneServer }),
      createTestApp({ createServer: createStandaloneServer }),
    ]);
    try {
      await left.connection.query
        .insertInto('fixtureItems')
        .values({ name: 'left only' })
        .execute();
      await expect(
        (await right.request('/items')).json(),
      ).resolves.toMatchObject({ data: { length: 2 } });
      await expect(
        (await left.request('/items')).json(),
      ).resolves.toMatchObject({ data: { length: 3 } });
    } finally {
      await Promise.all([left.close(), right.close()]);
    }
  });
});

describe('createTestAppConfig', () => {
  const written = async (
    options: Parameters<typeof createTestAppConfig>[0] = {},
  ): Promise<Record<string, unknown>> => {
    const config = await createTestAppConfig(options);
    try {
      return JSON.parse(await readFile(config.path, 'utf8')) as Record<
        string,
        unknown
      >;
    } finally {
      await config.dispose();
    }
  };

  it("turns off App Foundation's start-up scan unless the test asks for it", async () => {
    expect((await written()).foundation).toEqual({ scanOnStart: false });
    expect(
      (await written({ config: { foundation: { scanOnStart: true } } }))
        .foundation,
    ).toEqual({ scanOnStart: true });
    expect(
      (await written({ config: { foundation: { other: 1 } } })).foundation,
    ).toEqual({ scanOnStart: false, other: 1 });
  });

  it('starts an application without App Foundation on the same file', async () => {
    const testApp = await createTestApp({
      createServer: createStandaloneServer,
    });
    try {
      expect(testApp.application.config.get('foundation')).toEqual({
        scanOnStart: false,
      });
      expect((await testApp.request('/items')).status).toBe(200);
    } finally {
      await testApp.close();
    }
  });
});

const test = createAppTest({ createServer: createStandaloneServer });

describe('createAppTest', () => {
  test('carries the started application and its schema', async ({
    request,
    expectCollection,
  }) => {
    await expectCollection('fixtureItems').toHaveField('name');
    await expect((await request('/items')).json()).resolves.toMatchObject({
      data: { length: 2 },
    });
  });
});
