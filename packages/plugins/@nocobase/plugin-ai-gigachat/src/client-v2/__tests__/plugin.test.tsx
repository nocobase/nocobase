/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginAIClientV2 from '@nocobase/plugin-ai/client-v2';
import { describe, expect, it } from 'vitest';
import PluginAIGigaChatClientV2 from '../plugin';
import { gigachatProviderOptions } from '../llm-providers/gigachat';

describe('plugin-ai-gigachat client-v2', () => {
  it('registers the GigaChat LLM provider through plugin-ai client-v2', async () => {
    const app = createMockClient({ publicPath: '/v/' });

    await app.pm.add(PluginAIClientV2);
    await app.pm.add(PluginAIGigaChatClientV2);
    await app.load();

    const aiPlugin = app.pm.get(PluginAIClientV2) as PluginAIClientV2;

    expect(aiPlugin.aiManager.llmProviders.get('gigachat')).toBe(gigachatProviderOptions);
    expect(gigachatProviderOptions.components.ProviderSettingsForm).toBeDefined();
    expect(gigachatProviderOptions.components.ModelSettingsForm).toBeDefined();
  });
});
