/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { KanbanCardItemModel } from '../models';

describe('KanbanCardItemModel.cardSettings', () => {
  test('registers click, open mode and layout settings on the card model', () => {
    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');

    expect(Object.keys(flow.steps)).toEqual(['click', 'openMode', 'layout']);
    expect(flow.steps.openMode.defaultParams({ model: { props: {} } } as any)).toEqual({ openMode: 'drawer' });
    expect(flow.steps.click.defaultParams({ model: { props: {} } } as any)).toEqual({ enableCardClick: true });
  });

  test('open mode changes persist from card forks back to the base card model', async () => {
    const flow: any = (KanbanCardItemModel as any).globalFlowRegistry.getFlow('cardSettings');
    const syncCardViewAction = vi.fn();
    const masterBlock = {
      subModels: {
        cardViewAction: { uid: 'card-view-action' },
      },
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

    await flow.steps.openMode.handler({ model: forkItem } as any, { openMode: 'dialog' });

    expect(forkItem.setProps).toHaveBeenCalledWith({ openMode: 'dialog' });
    expect(masterItem.setProps).toHaveBeenCalledWith({ openMode: 'dialog' });
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
