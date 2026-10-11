// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

// The installation tokens app connections keep (`server/git/installation-tokens.ts`).
describeMigration('202610200010_studio_create_git_installation_tokens', {
  sources: [
    {
      packageName: 'studio-installation-tokens-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const tokens = await expectCollection(
      'studioGitInstallationTokens',
    ).toExist();
    expect(Object.keys(tokens.fields)).toEqual([
      'id',
      'connectionId',
      'valueSealed',
      'expiresAt',
    ]);
    expect(tokens.primaryKey).toEqual(['id']);
    const row = {
      id: 'a'.repeat(64),
      connectionId: 'c1',
      valueSealed: 'sealed',
      expiresAt: new Date(),
    };
    await connection.query
      .insertInto('studioGitInstallationTokens')
      .values(row)
      .execute();
    // One row per key.
    await expect(
      connection.query
        .insertInto('studioGitInstallationTokens')
        .values(row)
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioGitInstallationTokens').not.toExist();
  },
});
