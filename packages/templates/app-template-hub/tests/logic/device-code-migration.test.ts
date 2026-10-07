// @vitest-environment node
import path from 'node:path';
import type { MigrationSource } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'device-code-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

// The table Better Auth's `deviceAuthorization()` reads and writes (`server/config/auth.ts`).
describeMigration('202610060001_create_device_code', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const deviceCode = await expectCollection('deviceCode').toExist();
    expect(Object.keys(deviceCode.fields)).toEqual([
      'id',
      'deviceCode',
      'userCode',
      'userId',
      'expiresAt',
      'status',
      'lastPolledAt',
      'pollingInterval',
      'clientId',
      'scope',
    ]);
    expect(deviceCode.primaryKey).toEqual(['id']);
    await expectCollection('deviceCode').toHaveField('userId', {
      nullable: true,
    });
    await expectCollection('deviceCode').toHaveField('expiresAt', {
      nullable: false,
    });
    const row = {
      deviceCode: 'device-1',
      userCode: 'WXYZ2345',
      expiresAt: new Date(),
      status: 'pending',
      pollingInterval: 5000,
      clientId: 'cli',
    };
    await connection.query
      .insertInto('deviceCode')
      .values({ ...row, id: 'a' })
      .execute();
    // Both codes are unique.
    await expect(
      connection.query
        .insertInto('deviceCode')
        .values({ ...row, id: 'b', userCode: 'OTHER234' })
        .execute(),
    ).rejects.toThrow();
    await expect(
      connection.query
        .insertInto('deviceCode')
        .values({ ...row, id: 'c', deviceCode: 'device-2' })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('deviceCode').not.toExist();
  },
});
