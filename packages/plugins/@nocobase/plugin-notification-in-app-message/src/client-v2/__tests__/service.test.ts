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
  nextCount: 0,
  unreadMsgsCountObs: { value: 0 as number | null },
  updateUnreadMsgsCount: vi.fn(),
}));

vi.mock('../state', () => ({
  unreadMsgsCountObs: holder.unreadMsgsCountObs,
  updateUnreadMsgsCount: holder.updateUnreadMsgsCount,
}));

import { subscribeInAppUnreadCount } from '../service';

describe('subscribeInAppUnreadCount', () => {
  beforeEach(() => {
    holder.nextCount = 2;
    holder.unreadMsgsCountObs.value = 0;
    holder.updateUnreadMsgsCount.mockReset();
    holder.updateUnreadMsgsCount.mockImplementation(async () => {
      holder.unreadMsgsCountObs.value = holder.nextCount;
    });
  });

  it('loads the initial unread count and refreshes it from websocket events', async () => {
    const eventBus = new EventTarget();
    const onChange = vi.fn();

    const subscription = subscribeInAppUnreadCount({ eventBus, onChange });

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(2));

    holder.nextCount = 5;
    eventBus.dispatchEvent(new CustomEvent('ws:message:in-app-message:created'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(5));

    subscription.unsubscribe();
    holder.nextCount = 8;
    eventBus.dispatchEvent(new CustomEvent('ws:message:in-app-message:updated'));

    expect(onChange).not.toHaveBeenCalledWith(8);
  });
});
