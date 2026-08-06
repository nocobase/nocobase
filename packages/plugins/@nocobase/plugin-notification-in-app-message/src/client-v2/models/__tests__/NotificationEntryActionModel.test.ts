/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  dispatchEvent: vi.fn(),
  eventBus: new EventTarget(),
  inboxVisibleObs: { value: false },
  observable: Object.assign(
    vi.fn((value: unknown) => value),
    { ref: 'ref' },
  ),
  stepParams: {} as Record<string, Record<string, unknown>>,
  subscribeInAppUnreadCount: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  openViewFlow: {
    key: 'popupSettings',
  },
  ActionModel: class {
    static define = vi.fn();
    static registerFlow = vi.fn();

    context = {
      app: {
        eventBus: holder.eventBus,
      },
      isMobileLayout: false,
      t: (key: string) => key,
    };

    dispatchEvent = holder.dispatchEvent;

    async afterAddAsSubModel() {}

    onMount() {}

    onUnmount() {}

    getStepParams(flowKey: string, stepKey: string) {
      return holder.stepParams[flowKey]?.[stepKey];
    }

    setStepParams(flowKey: string, stepKey: string, params: unknown) {
      holder.stepParams[flowKey] = {
        ...holder.stepParams[flowKey],
        [stepKey]: params,
      };
    }
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  observable: holder.observable,
  tExpr: (key: string) => key,
}));

vi.mock('../../state', () => ({
  inboxVisibleObs: holder.inboxVisibleObs,
}));

vi.mock('../../service', () => ({
  subscribeInAppUnreadCount: holder.subscribeInAppUnreadCount,
}));

import { NotificationEntryActionModel } from '../NotificationEntryActionModel';

describe('NotificationEntryActionModel', () => {
  beforeEach(() => {
    holder.dispatchEvent.mockClear();
    holder.dispatchEvent.mockResolvedValue(undefined);
    holder.inboxVisibleObs.value = false;
    holder.stepParams = {};
    holder.eventBus = new EventTarget();
    holder.unsubscribe.mockClear();
    holder.subscribeInAppUnreadCount.mockReset();
    holder.subscribeInAppUnreadCount.mockImplementation(({ onChange }) => {
      onChange(2);
      return {
        reload: vi.fn().mockResolvedValue(2),
        unsubscribe: holder.unsubscribe,
      };
    });
  });

  it('opens the existing desktop inbox drawer outside mobile layout', async () => {
    const model = new NotificationEntryActionModel();

    await model.onClick({ type: 'click' });

    expect(holder.inboxVisibleObs.value).toBe(true);
    expect(holder.dispatchEvent).not.toHaveBeenCalled();
  });

  it('opens the embedded notification page in mobile layout', async () => {
    const model = new NotificationEntryActionModel();
    model.context.isMobileLayout = true;

    await model.onClick({ type: 'click' });

    expect(holder.inboxVisibleObs.value).toBe(false);
    expect(holder.dispatchEvent).toHaveBeenCalledWith(
      'click',
      expect.objectContaining({
        event: { type: 'click' },
        isMobileLayout: true,
        pageModelClass: 'NotificationEmbeddedPageModel',
        showFlowSettings: false,
      }),
      expect.objectContaining({
        debounce: true,
      }),
    );
  });

  it('syncs the embedded page model into open view step params', async () => {
    const model = new NotificationEntryActionModel();
    holder.stepParams = {
      popupSettings: {
        openView: {
          mode: 'drawer',
        },
      },
    };

    await model.afterAddAsSubModel();

    expect(holder.stepParams.popupSettings.openView).toEqual({
      mode: 'embed',
      pageModelClass: 'NotificationEmbeddedPageModel',
      showFlowSettings: false,
    });
  });

  it('updates the action panel badge from the shared unread subscription', async () => {
    const model = new NotificationEntryActionModel();

    (model as unknown as { onMount: () => void }).onMount();

    await vi.waitFor(() => expect(model.actionPanelBadge).toEqual({ count: 2, overflowCount: 99 }));

    const onChange = holder.subscribeInAppUnreadCount.mock.calls[0][0].onChange;
    onChange(0);
    expect(model.actionPanelBadge).toBeNull();

    onChange(5);
    expect(model.actionPanelBadge).toEqual({ count: 5, overflowCount: 99 });

    (model as unknown as { onUnmount: () => void }).onUnmount();
    expect(holder.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
