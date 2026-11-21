// @vitest-environment node

import { fileURLToPath } from 'node:url';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { API_KEY_TABLE_NAME } from '@better-auth/api-key';

import { apiKey } from '../server/api-keys.js';

const sources = [
  {
    packageName: '@nocobase/app-plugin-api-keys',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

describeMigration('202609150001_create_api_key_table', {
  sources,
  up: async ({ connection, expectCollection }) => {
    // The table carries a Field for every field the Better Auth plugin declares.
    const fields = Object.keys(
      apiKey().schema?.[API_KEY_TABLE_NAME]?.fields ?? {},
    ).concat('id');

    expect(fields.length).toBeGreaterThan(1);
    for (const field of fields) {
      await expectCollection(API_KEY_TABLE_NAME).toHaveField(field);
    }

    // It accepts and returns a row the way the plugin writes one.
    const now = new Date();
    await connection.query
      .insertInto(API_KEY_TABLE_NAME)
      .values({
        id: 'key-1',
        configId: 'default',
        name: 'nightly-export',
        start: 'nb_abc',
        prefix: 'nb_',
        key: 'a-hashed-value',
        referenceId: 'user-1',
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    const [row] = await connection.query
      .selectFrom(API_KEY_TABLE_NAME)
      .selectAll()
      .execute();

    expect(row).toMatchObject({
      id: 'key-1',
      name: 'nightly-export',
      referenceId: 'user-1',
      requestCount: 0,
    });
    // SQLite has no boolean type; dialects agree on the value, not the type.
    expect(Boolean(row?.enabled)).toBe(true);
  },
  down: async ({ expectCollection }) => {
    await expectCollection(API_KEY_TABLE_NAME).not.toExist();
  },
});

describeMigration('202611210003_api_keys_system_keys', {
  sources,
  up: async ({ connection, expectCollection }) => {
    for (const [name, fields] of [
      [
        'apiKeySystemKeys',
        ['identityId', 'keyId', 'ownerId', 'managedBy', 'createdById'],
      ],
      ['apiKeyEvents', ['id', 'identityId', 'action', 'actorId', 'details']],
      [
        'apiKeyRules',
        ['allowSameAsMe', 'personalMaxDays', 'idleDisableDays', 'idleSince'],
      ],
    ] as const)
      for (const field of fields)
        await expectCollection(name).toHaveField(field);
    const now = new Date();
    await connection.query
      .insertInto('apiKeyEvents')
      .values({
        id: 'event-1',
        identityId: 'service-1',
        action: 'permissions',
        actorId: null,
        details: JSON.stringify({ before: [], after: [] }),
        createdAt: now,
      })
      .execute();
    expect(
      await connection.query
        .selectFrom('apiKeyEvents')
        .select(['action'])
        .execute(),
    ).toEqual([{ action: 'permissions' }]);
  },
  down: async ({ expectCollection }) => {
    for (const name of ['apiKeySystemKeys', 'apiKeyEvents', 'apiKeyRules'])
      await expectCollection(name).not.toExist();
  },
});

describeMigration('202611210004_api_keys_manager_notices', {
  sources,
  up: async ({ expectCollection }) => {
    for (const field of [
      'id',
      'identityId',
      'managedBy',
      'actorId',
      'how',
      'attempts',
      'createdAt',
    ])
      await expectCollection('apiKeyManagerNotices').toHaveField(field);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('apiKeyManagerNotices').not.toExist();
  },
});
