/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { unreadMsgsCountObs, updateUnreadMsgsCount } from './state';

type InAppMessageEventBus = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

type SubscribeInAppUnreadCountOptions = {
  eventBus?: InAppMessageEventBus | null;
  onChange: (count: number) => void;
  onError?: (error: unknown) => void;
};

export type InAppUnreadCountSubscription = {
  reload: () => Promise<number>;
  unsubscribe: () => void;
};

const UNREAD_REFRESH_EVENTS = ['ws:message:in-app-message:created', 'ws:message:in-app-message:updated'];

export async function loadInAppUnreadCount() {
  await updateUnreadMsgsCount();
  return unreadMsgsCountObs.value ?? 0;
}

export function subscribeInAppUnreadCount({
  eventBus,
  onChange,
  onError,
}: SubscribeInAppUnreadCountOptions): InAppUnreadCountSubscription {
  let active = true;

  const reload = async () => {
    const count = await loadInAppUnreadCount();
    if (active) {
      onChange(count);
    }
    return count;
  };

  const handleRefresh = () => {
    reload().catch((error) => {
      onError?.(error);
    });
  };

  UNREAD_REFRESH_EVENTS.forEach((eventName) => {
    eventBus?.addEventListener(eventName, handleRefresh);
  });

  handleRefresh();

  return {
    reload,
    unsubscribe() {
      active = false;
      UNREAD_REFRESH_EVENTS.forEach((eventName) => {
        eventBus?.removeEventListener(eventName, handleRefresh);
      });
    },
  };
}
