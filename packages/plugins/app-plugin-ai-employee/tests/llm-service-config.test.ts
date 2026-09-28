import { AIManager, MemoryRepositoryFactory } from '@nocobase/ai-employee';
import { describe, expect, it, vi } from 'vitest';

import { LLMServiceConfigSynchronizer } from '../server/manager/llm-service-config.js';

function createManager(): AIManager {
  return new AIManager({ repositories: new MemoryRepositoryFactory() });
}

describe('LLMServiceConfigSynchronizer', () => {
  it('names each service by its key and normalizes enabled models', async () => {
    const ai = createManager();

    await new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize({
      openai: {
        provider: 'openai',
        // Configuration is never expanded: an application maps a variable onto
        // this path with `env` in its `defineAppConfig` instead.
        options: { apiKey: '${OPENAI_API_KEY}', nested: { region: 'us' } },
        enabledModels: [{ label: 'GPT-4.1', value: 'gpt-4.1' }],
      },
    });

    await expect(
      ai.llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      name: 'openai',
      options: { apiKey: '${OPENAI_API_KEY}', nested: { region: 'us' } },
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'GPT-4.1', value: 'gpt-4.1' }],
      },
    });
  });

  it('updates definitions, preserves user state, and deletes stale services', async () => {
    const ai = createManager();
    await ai.llmServiceManager.registerLLMService({
      name: 'openai',
      title: 'Database title',
      provider: 'old-provider',
      options: { apiKey: 'old' },
      enabledModels: ['user-model'],
      modelOptions: { temperature: 0.5 },
      enabled: false,
      sort: 99,
    });
    await ai.llmServiceManager.registerLLMService({
      name: 'obsolete',
      provider: 'openai',
    });

    const summary = await new LLMServiceConfigSynchronizer(
      ai.llmServiceManager,
    ).synchronize({
      openai: {
        title: 'Configured title',
        provider: 'openai',
        options: { apiKey: 'configured' },
        enabledModels: [
          { label: 'Configured model', value: 'configured-model' },
        ],
        enabled: true,
        sort: 10,
      },
      new: {
        provider: 'deepseek',
        enabledModels: [{ label: 'New model', value: 'new-model' }],
        enabled: false,
      },
    });

    expect(summary).toEqual({
      configured: 2,
      created: 1,
      updated: 1,
      deleted: 1,
    });
    await expect(
      ai.llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      title: 'Configured title',
      provider: 'openai',
      options: { apiKey: 'configured' },
      modelOptions: {
        temperature: 1,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
      sort: 10,
      enabled: false,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'user-model', value: 'user-model' }],
      },
    });
    await expect(
      ai.llmServiceManager.getLLMService('new'),
    ).resolves.toMatchObject({
      enabled: false,
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'New model', value: 'new-model' }],
      },
    });
    await expect(
      ai.llmServiceManager.getLLMService('obsolete'),
    ).resolves.toBeUndefined();
  });

  it('treats a missing or empty service list as authoritative', async () => {
    const ai = createManager();
    await ai.llmServiceManager.registerLLMService({
      name: 'openai',
      provider: 'openai',
    });

    await new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize(
      undefined,
    );

    await expect(ai.llmServiceManager.listLLMServices()).resolves.toEqual([]);
  });

  it('serializes rapid updates and leaves the latest snapshot active', async () => {
    const ai = createManager();
    const synchronizer = new LLMServiceConfigSynchronizer(ai.llmServiceManager);
    const first = synchronizer.enqueue({ first: { provider: 'openai' } });
    const second = synchronizer.enqueue({ second: { provider: 'deepseek' } });

    await Promise.all([first, second]);

    await expect(ai.llmServiceManager.listLLMServices()).resolves.toMatchObject(
      [{ name: 'second' }],
    );
  });

  it('does not expose service options in synchronization logs', async () => {
    const ai = createManager();
    const info = vi.fn();
    await new LLMServiceConfigSynchronizer(ai.llmServiceManager, {
      info,
    } as never).synchronize({
      openai: { provider: 'openai', options: { apiKey: 'secret' } },
    });

    expect(JSON.stringify(info.mock.calls)).not.toContain('secret');
    expect(info).toHaveBeenCalledWith(
      { configured: 1, created: 1, updated: 0, deleted: 0 },
      'AI LLM services synchronized from application config',
    );
  });
});

describe('overrideEnabledModels', () => {
  it('leaves a curated model list alone by default', async () => {
    const ai = createManager();
    await ai.llmServiceManager.registerLLMService({
      name: 'openai',
      provider: 'openai',
      enabledModels: ['curated-in-the-ui'],
      enabled: false,
    });

    await new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize({
      openai: {
        provider: 'openai',
        enabledModels: [{ label: 'From config', value: 'from-config' }],
      },
    });

    await expect(
      ai.llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'curated-in-the-ui', value: 'curated-in-the-ui' }],
      },
      enabled: false,
    });
  });

  it('reapplies the configured list when the service opts in, without re-enabling it', async () => {
    const ai = createManager();
    await ai.llmServiceManager.registerLLMService({
      name: 'openai',
      provider: 'openai',
      enabledModels: ['curated-in-the-ui'],
      enabled: false,
    });

    await new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize({
      openai: {
        provider: 'openai',
        overrideEnabledModels: true,
        enabledModels: [{ label: 'From config', value: 'from-config' }],
      },
    });

    await expect(
      ai.llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'From config', value: 'from-config' }],
      },
      // The administrator turned this service off; reapplying models is not a
      // reason to turn it back on.
      enabled: false,
    });
  });

  it('keeps a disabled service disabled even when the config says enabled', async () => {
    const ai = createManager();
    await ai.llmServiceManager.registerLLMService({
      name: 'openai',
      provider: 'openai',
      enabledModels: ['curated-in-the-ui'],
      enabled: false,
    });

    await new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize({
      openai: {
        provider: 'openai',
        overrideEnabledModels: true,
        enabled: true,
        enabledModels: [{ label: 'From config', value: 'from-config' }],
      },
    });

    await expect(
      ai.llmServiceManager.getLLMService('openai'),
    ).resolves.toMatchObject({
      enabledModels: {
        mode: 'custom',
        models: [{ label: 'From config', value: 'from-config' }],
      },
      enabled: false,
    });
  });

  it('rejects a non-boolean overrideEnabledModels', async () => {
    const ai = createManager();
    await expect(
      new LLMServiceConfigSynchronizer(ai.llmServiceManager).synchronize({
        openai: { provider: 'openai', overrideEnabledModels: 'yes' } as never,
      }),
    ).rejects.toThrow('overrideEnabledModels');
  });
});
