import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const fields = ['cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens'];
const legacy = {
  id: '123',
  purpose: 'text',
  source: 'knowledge',
  modelService: 'fixture',
  model: 'chat',
  inputTokens: 20,
  outputTokens: 8,
  units: 1,
  createdAt: '2026-10-01T00:00:00.000Z',
};

describeMigration('202611250001_ag_model_usage_token_details', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('agModelUsage').createOne({ values: legacy });
  },
  up: async ({ connection, expectCollection }) => {
    for (const field of fields)
      await expectCollection('agModelUsage').toHaveField(field, {
        nullable: false,
      });
    const saved = await connection.repository('agModelUsage').findOne({
      filter: { id: legacy.id },
    });
    expect(saved).toMatchObject({ inputTokens: '20', outputTokens: '8' });
    expect(fields.map((field) => saved?.[field])).toEqual(['0', '0', '0']);
  },
  down: async ({ connection, expectCollection }) => {
    for (const field of fields)
      await expectCollection('agModelUsage').not.toHaveField(field);
    const saved = await connection.repository('agModelUsage').findOne({
      filter: { id: legacy.id },
    });
    expect(saved).toMatchObject({ inputTokens: '20', outputTokens: '8' });
  },
});
