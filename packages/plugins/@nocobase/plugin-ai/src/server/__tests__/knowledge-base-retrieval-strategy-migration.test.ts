/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import RetrievalStrategyMigration from '../migrations/20260501000000-ai-employee-knowledge-base-retrieval-strategy';

type EmployeeRecord = {
  get: (field: string) => unknown;
  update: ReturnType<typeof vi.fn>;
};

const createEmployee = (knowledgeBase: unknown): EmployeeRecord => ({
  get: (field) => (field === 'knowledgeBase' ? knowledgeBase : undefined),
  update: vi.fn(),
});

describe('knowledge base retrieval strategy migration', () => {
  it('marks only missing or invalid legacy settings as always and preserves other JSON values', async () => {
    const missingStrategy = createEmployee({ knowledgeBaseKeys: ['handbook'], topK: 5, score: '0.7' });
    const explicitOnDemand = createEmployee({ knowledgeBaseKeys: ['sales'], retrievalStrategy: 'onDemand' });
    const invalidStrategy = createEmployee({ score: '0.8', retrievalStrategy: 'later' });
    const noSettings = createEmployee(undefined);
    const find = vi.fn().mockResolvedValue([missingStrategy, explicitOnDemand, invalidStrategy, noSettings]);
    const migration = new RetrievalStrategyMigration({
      db: { getRepository: () => ({ find }) },
    } as never);

    await migration.up();

    expect(missingStrategy.update).toHaveBeenCalledWith({
      knowledgeBase: { knowledgeBaseKeys: ['handbook'], topK: 5, score: '0.7', retrievalStrategy: 'always' },
    });
    expect(invalidStrategy.update).toHaveBeenCalledWith({
      knowledgeBase: { score: '0.8', retrievalStrategy: 'always' },
    });
    expect(noSettings.update).toHaveBeenCalledWith({ knowledgeBase: { retrievalStrategy: 'always' } });
    expect(explicitOnDemand.update).not.toHaveBeenCalled();
  });
});
