import type {
  NotificationChannelPolicy,
  NotificationTemplateText,
} from './templates.js';

/** One channel type of one kind in a person's preferences. */
export interface NotificationPreferenceChannel {
  readonly type: string;
  readonly policy: NotificationChannelPolicy;
  /** Whether the person may turn it on or off; a required channel never is. */
  readonly adjustable: boolean;
  /** Whether the person receives the kind on it: their choice, or the kind's default when they made none. */
  readonly enabled: boolean;
}

export interface NotificationPreferenceKind {
  readonly id: string;
  readonly contributor: string;
  readonly name: NotificationTemplateText;
  readonly category: NotificationTemplateText;
  readonly trigger?: NotificationTemplateText;
  readonly categoryKey: string;
  readonly channels: readonly NotificationPreferenceChannel[];
}

/** What `GET /notifications/preferences` answers. */
export interface NotificationPreferencesView {
  readonly email?: string;
  /** The channel types an enabled channel can reach the person on, in configuration order. */
  readonly channelTypes: readonly string[];
  readonly kinds: readonly NotificationPreferenceKind[];
}

export interface NotificationPreferenceChange {
  readonly kind: string;
  readonly channelType: string;
  readonly enabled: boolean;
}
