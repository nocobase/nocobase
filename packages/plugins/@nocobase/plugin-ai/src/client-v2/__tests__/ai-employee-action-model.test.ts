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
import {
  AIEmployeeActionModel,
  AIEmployeeButtonModel,
  AIEmployeeShortcutListModel,
  AIEmployeeShortcutModel,
  normalizeShortcutTasksSkillSettings,
} from '../models/ai-employees';
import { dialogController } from '../ai-employees/stores/dialog-controller';

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
    expect(registeredLoaders).toHaveProperty('AIEmployeeShortcutListModel');
    expect(registeredLoaders).toHaveProperty('AIEmployeeButtonModel');
    expect(registeredLoaders).toHaveProperty('AIEmployeeActionModel');
  });

  it('keeps the public model classes exported', () => {
    expect(AIEmployeeShortcutModel).toBeDefined();
    expect(AIEmployeeShortcutListModel).toBeDefined();
    expect(AIEmployeeButtonModel).toBeDefined();
    expect(AIEmployeeActionModel).toBeDefined();
  });

  it('registers the shortcut task settings flow', () => {
    const flow = AIEmployeeShortcutModel.globalFlowRegistry.getFlow('shortcutSettings');

    expect(flow).toBeDefined();
    expect(flow?.getStep('migration')).toBeDefined();
    expect(flow?.getStep('editTasks')).toBeDefined();
  });

  it('adds chat box uid to shortcut task settings', async () => {
    const step = AIEmployeeShortcutModel.globalFlowRegistry.getFlow('shortcutSettings')?.getStep('editTasks');
    const uiSchema = step?.serialize().uiSchema as (ctx: FlowModelContext) => Promise<{
      tasks?: {
        items?: {
          properties?: Record<
            string,
            { title?: unknown; ['x-component']?: string; ['x-decorator-props']?: { tooltip?: unknown } }
          >;
        };
      };
    }>;
    const ctx = {
      model: {
        context: {},
      },
      aiConfigRepository: {
        getAIEmployees: vi.fn().mockResolvedValue([]),
      },
    } as unknown as FlowModelContext;

    const schema = await uiSchema(ctx);

    expect(schema.tasks?.items?.properties?.chatBoxUid).toMatchObject({
      title: expect.anything(),
      'x-component': 'Input',
      'x-decorator-props': {
        tooltip: expect.anything(),
      },
    });
  });

  it('hides the task settings dialog while selecting work context', () => {
    const step = AIEmployeeShortcutModel.globalFlowRegistry.getFlow('shortcutSettings')?.getStep('editTasks');
    const uiMode = step?.serialize().uiMode as () => {
      props?: { styles?: { mask?: { zIndex?: number }; wrapper?: { zIndex?: number } } };
    };

    dialogController.resume();
    expect(uiMode().props?.styles?.mask?.zIndex).toBe(9999);
    expect(uiMode().props?.styles?.wrapper?.zIndex).toBe(9999);

    dialogController.hide();
    expect(uiMode().props?.styles?.mask?.zIndex).toBe(-1);
    expect(uiMode().props?.styles?.wrapper?.zIndex).toBe(-1);
    dialogController.resume();
  });

  it('normalizes legacy shortcut skill settings versions during migration', () => {
    const tasks = [
      {
        skillSettings: {
          skills: [],
          tools: [],
        },
      },
      {
        skillSettings: {
          skillsVersion: 2,
          toolsVersion: 2,
          skills: ['summary'],
          tools: ['suggestions'],
        },
      },
    ];

    normalizeShortcutTasksSkillSettings(tasks, { dropEmptyLegacyArrays: true });

    expect(tasks[0].skillSettings).toEqual({
      skillsVersion: 2,
      toolsVersion: 2,
    });
    expect(tasks[1].skillSettings).toEqual({
      skillsVersion: 2,
      toolsVersion: 2,
      skills: ['summary'],
      tools: ['suggestions'],
    });
  });

  it('keeps tasks without skill settings untouched on save', () => {
    const tasks = [
      {},
      {
        skillSettings: {
          skills: ['summary'],
        },
      },
    ];

    normalizeShortcutTasksSkillSettings(tasks, { onlyExistingSettings: true });

    expect(tasks[0]).toEqual({});
    expect(tasks[1].skillSettings).toEqual({
      skills: ['summary'],
      skillsVersion: 2,
      toolsVersion: 2,
    });
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
