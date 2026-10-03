import { describe, expect, it, vi } from 'vitest';
import { managerFactoryToken } from '../server/factory/manager-factory.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';

async function managerWithEnabled(
  enabled: Array<{ llmService: string; models: string[] }>,
) {
  const fixture = await createTestAIEmployeeFixture();
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'listAllEnabledModels',
  ).mockResolvedValue(
    enabled.map(({ llmService, models }) => ({
      llmService,
      enabledModels: models.map((value) => ({ label: value, value })),
    })) as never,
  );
  return fixture.container.resolve(managerFactoryToken).aiEmployeesManager;
}

const employee = {
  username: 'order-desk',
  modelSettings: {
    enabled: true,
    models: [
      { llmService: 'main', model: 'removed-model' },
      { llmService: 'gateway', model: 'fast-model' },
    ],
  },
} as never;

describe('AIEmployeesManager.resolveModel', () => {
  it('skips a listed model that is no longer enabled', async () => {
    const manager = await managerWithEnabled([
      { llmService: 'gateway', models: ['fast-model'] },
    ]);

    await expect(manager.resolveModel(employee)).resolves.toEqual({
      llmService: 'gateway',
      model: 'fast-model',
    });
  });

  it('does not run a requested model that is listed but disabled', async () => {
    const manager = await managerWithEnabled([
      { llmService: 'gateway', models: ['fast-model'] },
    ]);

    await expect(
      manager.resolveModel(employee, {
        llmService: 'main',
        model: 'removed-model',
      }),
    ).resolves.toEqual({ llmService: 'gateway', model: 'fast-model' });
  });

  it('fails when none of the listed models is enabled', async () => {
    const manager = await managerWithEnabled([
      { llmService: 'main', models: ['general-model'] },
    ]);

    await expect(manager.resolveModel(employee)).rejects.toThrow(
      'None of the models this AI employee may use is enabled',
    );
  });
});
