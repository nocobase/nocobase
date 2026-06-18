/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { FlowEngine, type FlowModelContext } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import PluginAIClientV2 from '@nocobase/plugin-ai/client-v2';
import { AIEmployeeActionModel, AIEmployeeButtonModel, AIEmployeeShortcutModel } from '../models/ai-employees';

describe('AI employee v2 action models', () => {
  it('registers shortcut and action model loaders from the plugin entry', async () => {
    const app = createMockClient({ publicPath: '/v/' });
    const registerModelLoaders = vi.spyOn(app.flowEngine, 'registerModelLoaders');

    await app.pm.add(PluginAIClientV2);
    await app.load();

    const registeredLoaders = Object.assign(
      {},
      ...registerModelLoaders.mock.calls.map(([loaders]) => loaders as Record<string, unknown>),
    );
    expect(registeredLoaders).toHaveProperty('AIEmployeeShortcutModel');
    expect(registeredLoaders).toHaveProperty('AIEmployeeButtonModel');
    expect(registeredLoaders).toHaveProperty('AIEmployeeActionModel');
  });

  it('keeps the public model classes exported', () => {
    expect(AIEmployeeShortcutModel).toBeDefined();
    expect(AIEmployeeButtonModel).toBeDefined();
    expect(AIEmployeeActionModel).toBeDefined();
  });

  it('builds v2 shortcut action children with current flow-model work context', async () => {
    const engine = new FlowEngine();
    const ctx = {
      engine,
      model: { uid: 'block-1' },
      aiConfigRepository: {
        getAIEmployees: vi.fn().mockResolvedValue([
          { username: 'business', nickname: 'Business', category: 'business' },
          { username: 'developer', nickname: 'Developer', category: 'developer' },
          { username: 'deprecated', nickname: 'Deprecated', deprecated: true },
        ]),
      },
    } as FlowModelContext & {
      aiConfigRepository: {
        getAIEmployees: ReturnType<typeof vi.fn>;
      };
    };

    const children = await AIEmployeeActionModel.defineChildren(ctx);

    expect(children).toHaveLength(1);
    expect(children[0]).toMatchObject({
      key: 'business',
      createModelOptions: {
        use: 'AIEmployeeButtonModel',
        props: {
          aiEmployee: { username: 'business' },
          context: {
            workContext: [{ type: 'flow-model', uid: 'block-1' }],
          },
          auto: false,
        },
      },
    });
  });
});
