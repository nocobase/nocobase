import type { NotificationTarget } from '@nocobase/app-plugin-notification';
export interface InAppMessage {
  readonly to: string | readonly [string, ...string[]];
  readonly title: string;
  readonly body: string;
  readonly target?: NotificationTarget;
  /** The notification kind the message was sent for; `notify()` sets it. */
  readonly kind?: string;
  /** The kind's category key, which the inbox filters by. */
  readonly category?: string;
  /** The record the message is about. */
  readonly source?: { readonly type: string; readonly id?: string };
}

export interface InAppRecipient {
  readonly userId: string;
}

export interface InAppItem {
  readonly id: string;
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly userId: string;
  readonly title?: string;
  readonly body: string;
  readonly target?: NotificationTarget;
  readonly kind?: string;
  readonly category?: string;
  readonly sourceType?: string;
  readonly sourceId?: string;
  readonly readAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Unread messages of one category; `category` is absent for messages without one. */
export interface InAppCategoryCount {
  readonly category?: string;
  readonly count: number;
}
