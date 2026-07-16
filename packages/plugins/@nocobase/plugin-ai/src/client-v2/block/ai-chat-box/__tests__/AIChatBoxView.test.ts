/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, type FlowModelContext, type ModelConstructor, type SubModelItem } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import {
  AI_CHAT_BOX_ACTION_MODEL_NAMES,
  filterNestedAIChatBoxBlockItems,
  getAIChatBoxActionItems,
  isAIChatBoxCoreModel,
  moveAddedBlockBeforeCore,
} from '../components/AIChatBoxView';

class JSActionModel extends FlowModel {}
class AIEmployeeActionModel extends FlowModel {}

const subModelItem = (item: Partial<SubModelItem> & { key: string }): SubModelItem => item as SubModelItem;

describe('AIChatBoxView helpers', () => {
  it('filters production and demo AI chat box entries from nested Add block items', async () => {
    const filtered = filterNestedAIChatBoxBlockItems([
      subModelItem({
        key: 'BlockModel',
        type: 'group',
        children: [
          subModelItem({ key: 'AIChatBoxBlockModel', useModel: 'AIChatBoxBlockModel' }),
          subModelItem({ key: 'AIChatDemoBlockModel', useModel: 'AIChatDemoBlockModel' }),
          subModelItem({ key: 'PlainBlockModel', useModel: 'PlainBlockModel' }),
        ],
      }),
      subModelItem({
        key: 'AsyncGroup',
        type: 'group',
        children: async () => [
          subModelItem({ key: 'AIChatBoxBlockModel', useModel: 'AIChatBoxBlockModel' }),
          subModelItem({ key: 'ChartBlockModel', useModel: 'ChartBlockModel' }),
        ],
      }),
    ]);

    expect(filtered).toHaveLength(2);
    expect((filtered[0].children as SubModelItem[]).map((item) => item.key)).toEqual(['PlainBlockModel']);

    const asyncChildren = filtered[1].children as Exclude<SubModelItem['children'], SubModelItem[] | false | undefined>;
    const resolved = await asyncChildren({} as FlowModelContext);
    expect(resolved.map((item) => item.key)).toEqual(['ChartBlockModel']);
  });

  it('only allows JS Action and AI Employee action models', async () => {
    expect(AI_CHAT_BOX_ACTION_MODEL_NAMES).toEqual(['JSActionModel', 'AIEmployeeActionModel']);

    const getModelClassAsync = vi.fn(async (name: string) => {
      const models: Record<string, ModelConstructor> = {
        JSActionModel,
        AIEmployeeActionModel,
      };
      return models[name];
    });
    const ctx = {
      engine: {
        getModelClassAsync,
      },
      t: (key: string) => `t:${key}`,
    } as unknown as FlowModelContext;

    const items = await getAIChatBoxActionItems(ctx);

    expect(getModelClassAsync.mock.calls.map(([name]) => name)).toEqual(['JSActionModel', 'AIEmployeeActionModel']);
    expect(items.map((item) => item.useModel)).toEqual(['JSActionModel', 'AIEmployeeActionModel']);
    expect(items[1].label).toBe('t:AI employee');
  });

  it('identifies the core model and moves newly added blocks before it', async () => {
    const moveModel = vi.fn(async () => undefined);
    const core = Object.assign(Object.create(AIChatBoxCoreModel.prototype), { uid: 'core' }) as FlowModel;
    const added = Object.assign(Object.create(FlowModel.prototype), { uid: 'added' }) as FlowModel;
    const model = {
      subModels: {
        bodyBlocks: [added, core],
      },
      flowEngine: {
        moveModel,
      },
    } as unknown as AIChatBoxBlockModel;

    expect(isAIChatBoxCoreModel(core)).toBe(true);
    expect(isAIChatBoxCoreModel(added)).toBe(false);

    await moveAddedBlockBeforeCore(model, added);
    await moveAddedBlockBeforeCore(model, core);

    expect(moveModel).toHaveBeenCalledTimes(1);
    expect(moveModel).toHaveBeenCalledWith('added', 'core', { persist: false });
  });
});
