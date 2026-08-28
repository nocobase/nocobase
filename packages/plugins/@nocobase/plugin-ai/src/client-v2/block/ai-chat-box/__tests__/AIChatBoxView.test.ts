/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from '@nocobase/client-v2';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import {
  AIChatBoxActionGroupModel,
  AIChatBoxItemGroupModel,
  AI_CHAT_BOX_ACTION_MODEL_NAMES,
  AI_CHAT_BOX_ITEM_MODEL_NAMES,
  isAIChatBoxCoreModel,
  moveAddedItemBeforeCore,
  renderAIChatBoxConfigureActions,
  renderAIChatBoxConfigureItems,
} from '../sub-models';

class JSBlockModel extends FlowModel {}
JSBlockModel.define({ label: 'JS block', sort: 30 });

class IframeBlockModel extends FlowModel {}
IframeBlockModel.define({ label: 'Iframe', sort: 10 });

class MarkdownBlockModel extends FlowModel {}
MarkdownBlockModel.define({ label: 'Markdown', sort: 20 });

class TableBlockModel extends FlowModel {}
TableBlockModel.define({ label: 'Table', sort: 5 });

class JSActionModel extends ActionModel {}
JSActionModel.define({ label: 'JS action', sort: 20 });

class AIEmployeeActionModel extends ActionModel {}
AIEmployeeActionModel.define({ label: 'AI employees', sort: 10 });

type AddSubModelButtonElementProps = {
  subModelBaseClass?: string;
  subModelKey?: string;
};

describe('AIChatBoxView helpers', () => {
  it('only allows JS Action and AI Employee action models', async () => {
    expect(AI_CHAT_BOX_ACTION_MODEL_NAMES).toEqual(['JSActionModel', 'AIEmployeeActionModel']);

    const engine = new FlowEngine();
    engine.registerModels({
      ActionModel,
      JSActionModel,
      AIEmployeeActionModel,
    });

    const items = await AIChatBoxActionGroupModel.defineChildren(engine.context);

    expect(items.map((item) => item.useModel).sort()).toEqual(['AIEmployeeActionModel', 'JSActionModel']);
    expect(items.find((item) => item.useModel === 'AIEmployeeActionModel')?.label).toBe('AI employees');
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

    const items = await AIChatBoxItemGroupModel.defineChildren(engine.context);

    expect(items.map((item) => item.useModel)).toEqual(['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel']);
    expect(items.map((item) => item.useModel)).not.toContain('TableBlockModel');
  });

  it('uses group models when rendering configure buttons', () => {
    const model = {
      context: {
        t: (key: string) => key,
      },
      getModelClassName: (name: string) => `local:${name}`,
      translate: (key: string) => `t:${key}`,
    } as AIChatBoxBlockModel;

    const actionButton = renderAIChatBoxConfigureActions(model) as ReactElement<AddSubModelButtonElementProps>;
    const itemButton = renderAIChatBoxConfigureItems(model) as ReactElement<AddSubModelButtonElementProps>;

    expect(actionButton.props.subModelKey).toBe('actions');
    expect(actionButton.props.subModelBaseClass).toBe('local:AIChatBoxActionGroupModel');
    expect(itemButton.props.subModelKey).toBe('items');
    expect(itemButton.props.subModelBaseClass).toBe('local:AIChatBoxItemGroupModel');
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
});
