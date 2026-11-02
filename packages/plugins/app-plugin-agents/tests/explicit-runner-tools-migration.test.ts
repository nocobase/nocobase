import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const native = ['claude', 'codex', 'opencode', 'pi'];
describeMigration('202610280001_ag_explicit_runner_tools', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const [id, enabledTools] of [
      ['implicit', null],
      ['limited', ['codex']],
      ['none', []],
    ] as const) {
      await connection.repository('agRunners').createOne({
        values: {
          id,
          name: id,
          hostname: id,
          os: 'linux',
          arch: 'x64',
          version: 'test',
          protocolVersion: 12,
          features: [],
          tools: [],
          enabledTools,
          trust: 'team',
          status: 'offline',
          slots: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await connection.repository('agRegistrationTokens').createOne({
        values: {
          id,
          tokenHash: id,
          createdById: 'owner',
          trust: 'team',
          enabledTools,
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      });
    }
  },
  up: async ({ connection }) => {
    for (const collection of ['agRunners', 'agRegistrationTokens']) {
      expect(
        (
          await connection
            .repository(collection)
            .findOne({ filter: { id: 'implicit' } })
        )?.enabledTools,
      ).toEqual(native);
      expect(
        (
          await connection
            .repository(collection)
            .findOne({ filter: { id: 'limited' } })
        )?.enabledTools,
      ).toEqual(['codex']);
      expect(
        (
          await connection
            .repository(collection)
            .findOne({ filter: { id: 'none' } })
        )?.enabledTools,
      ).toEqual([]);
    }
  },
});
