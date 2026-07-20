/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, type FlowModelContext, type ModelConstructor } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import {
  AI_CHAT_BOX_ACTION_MODEL_NAMES,
  AI_CHAT_BOX_ITEM_MODEL_NAMES,
  getAIChatBoxActionItems,
  getAIChatBoxItems,
  getAIChatBoxViewHeight,
  isAIChatBoxCoreModel,
  moveAddedItemBeforeCore,
} from '../components/AIChatBoxView';

class JSBlockModel extends FlowModel {}
JSBlockModel.define({ label: 'JS block', sort: 30 });

class IframeBlockModel extends FlowModel {}
IframeBlockModel.define({ label: 'Iframe', sort: 10 });

class MarkdownBlockModel extends FlowModel {}
MarkdownBlockModel.define({ label: 'Markdown', sort: 20 });

class TableBlockModel extends FlowModel {}
TableBlockModel.define({ label: 'Table', sort: 5 });

class JSActionModel extends FlowModel {}
class AIEmployeeActionModel extends FlowModel {}

describe('AIChatBoxView helpers', () => {
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

  it('only allows read-only display blocks in the chat body', async () => {
    expect(AI_CHAT_BOX_ITEM_MODEL_NAMES).toEqual(['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel']);

    const engine = new FlowEngine();
    engine.registerModels({
      JSBlockModel,
      IframeBlockModel,
      MarkdownBlockModel,
      TableBlockModel,
    });

    const items = await getAIChatBoxItems(engine.context);

    expect(items.map((item) => item.useModel)).toEqual(['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel']);
    expect(items.map((item) => item.useModel)).not.toContain('TableBlockModel');
  });

  it('identifies the core model and moves newly added blocks before it', async () => {
    const moveModel = vi.fn(async () => undefined);
    const core = Object.assign(Object.create(AIChatBoxCoreModel.prototype), { uid: 'core' }) as FlowModel;
    const added = Object.assign(Object.create(FlowModel.prototype), { uid: 'added' }) as FlowModel;
    const model = {
      subModels: {
        items: [added, core],
      },
      flowEngine: {
        moveModel,
      },
    } as unknown as AIChatBoxBlockModel;

    expect(isAIChatBoxCoreModel(core)).toBe(true);
    expect(isAIChatBoxCoreModel(added)).toBe(false);

    await moveAddedItemBeforeCore(model, added);
    await moveAddedItemBeforeCore(model, core);

    expect(moveModel).toHaveBeenCalledTimes(1);
    expect(moveModel).toHaveBeenCalledWith('added', 'core', { persist: false });
  });

  it('uses the common block height modes when rendering the chat box view', () => {
    const model = {
      decoratorProps: {},
    } as unknown as AIChatBoxBlockModel;

    expect(getAIChatBoxViewHeight(model, 640)).toBe(640);

    model.decoratorProps.heightMode = 'specifyValue';
    expect(getAIChatBoxViewHeight(model, 640)).toBe('100%');

    model.decoratorProps.heightMode = 'fullHeight';
    expect(getAIChatBoxViewHeight(model, 640)).toBe('100%');
  });
});
