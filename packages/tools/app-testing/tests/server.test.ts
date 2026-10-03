import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  createAppTest,
  createTestApp,
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
      await expect(response.json()).resolves.toEqual([
        { name: 'first' },
        { name: 'second' },
      ]);
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
      ).resolves.toHaveLength(2);
      await expect((await left.request('/items')).json()).resolves.toHaveLength(
        3,
      );
    } finally {
      await Promise.all([left.close(), right.close()]);
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
    await expect((await request('/items')).json()).resolves.toHaveLength(2);
  });
});
