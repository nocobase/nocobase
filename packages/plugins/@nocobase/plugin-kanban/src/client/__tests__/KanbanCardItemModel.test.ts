/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { KanbanCardItemModel } from '../models';
import { KanbanCardViewActionModel } from '../models/actions/KanbanPopupModels';
import { FlowEngine } from '@nocobase/flow-engine';

describe('KanbanCardItemModel.cardSettings', () => {
  test('registers click, popup and layout settings on the card model', async () => {
    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');

    expect(Object.keys(flow.steps)).toEqual(['click', 'popup', 'layout']);
    expect(flow.steps.popup.use).toBe('openView');
    expect(await flow.steps.popup.defaultParams({ model: { props: {} } } as any)).toMatchObject({
      mode: 'drawer',
      size: 'medium',
    });
    expect((await flow.steps.popup.defaultParams({ model: { uid: 'card-1', props: {} } } as any)).uid).toBeUndefined();
    expect(flow.steps.click.defaultParams({ model: { props: {} } } as any)).toEqual({ enableCardClick: true });
  });

  test('card popup action uses the shared Details title', () => {
    const action = new KanbanCardViewActionModel({
      uid: 'kanban-card-view-action',
      flowEngine: new FlowEngine(),
    } as any);

    expect(action.defaultPopupTitle).toContain('Details');
  });

  test('popup settings persist from card forks back to the base card model', async () => {
    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');
    const syncCardViewAction = vi.fn();
    const ensureCardViewAction = vi.fn().mockResolvedValue({ uid: 'card-view-action' });
    const masterBlock = {
      subModels: {
        cardViewAction: { uid: 'card-view-action' },
      },
      ensureCardViewAction,
      syncCardViewAction,
    };
    const forkBlock = {
      isFork: true,
      master: masterBlock,
      subModels: {
        cardViewAction: { uid: 'fork-card-view-action' },
      },
    };
    const masterItem = {
      props: {},
      parent: masterBlock,
      setProps: vi.fn(),
    };
    const forkItem = {
      isFork: true,
      master: masterItem,
      parent: forkBlock,
      setProps: vi.fn(),
    };

    await flow.steps.popup.handler({ model: forkItem } as any, {
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: 'tpl-card',
      uid: 'popup-card-1',
    });

    expect(forkItem.setProps).toHaveBeenCalledWith({
      openMode: 'dialog',
      popupSize: 'large',
      popupTemplateUid: 'tpl-card',
      popupTargetUid: 'popup-card-1',
    });
    expect(masterItem.setProps).toHaveBeenCalledWith({
      openMode: 'dialog',
      popupSize: 'large',
      popupTemplateUid: 'tpl-card',
      popupTargetUid: 'popup-card-1',
    });
    expect(ensureCardViewAction).toHaveBeenCalledTimes(1);
    expect(syncCardViewAction).toHaveBeenCalledWith(masterBlock.subModels.cardViewAction);
  });

  test('layout changes persist from card forks and propagate to details items', () => {
    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');
    const detailsItem = {
      setProps: vi.fn(),
    };
    const grid = {
      findSubModel: vi.fn((_key, callback) => callback(detailsItem)),
    };
    const masterItem = {
      subModels: { grid },
      setProps: vi.fn(),
    };
    const forkItem = {
      isFork: true,
      master: masterItem,
      subModels: { grid },
      setProps: vi.fn(),
    };

    flow.steps.layout.handler({ model: forkItem } as any, {
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: false,
      colon: false,
    });

    expect(forkItem.setProps).toHaveBeenCalledWith({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: null,
      labelWrap: false,
      colon: false,
    });
    expect(masterItem.setProps).toHaveBeenCalledWith({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: null,
      labelWrap: false,
      colon: false,
    });
    expect(detailsItem.setProps).toHaveBeenCalledWith({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: '100%',
      labelWrap: true,
      colon: false,
    });
  });

  test('scopes the details grid fork to the card instance to avoid column data leakage', () => {
    const defineProperty = vi.fn();
    const createFork = vi.fn(() => ({
      context: {
        collection: undefined,
        t: () => 'Current record',
        defineProperty,
      },
    }));

    KanbanCardItemModel.prototype.render.call({
      uid: 'kanban-card-column-a-1',
      forkId: 'fork-card-a-1',
      context: {
        index: 0,
        record: { id: 1, title: 'Task 1' },
        onCardClick: undefined,
      },
      props: {},
      subModels: {
        grid: {
          createFork,
        },
      },
    });

    expect(createFork).toHaveBeenCalledWith({}, 'grid-fork-card-a-1');
    const fieldKeyRegistration = defineProperty.mock.calls.find(([key]) => key === 'fieldKey');
    expect(fieldKeyRegistration?.[1]?.get()).toBe('fork-card-a-1');
    const fieldIndexRegistration = defineProperty.mock.calls.find(([key]) => key === 'fieldIndex');
    expect(fieldIndexRegistration?.[1]?.get()).toEqual(['fork-card-a-1:0']);
  });
});
