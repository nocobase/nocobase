/**
 * The notification plugin's client extension points, bound by its service provider. A plugin adds to them in its own
 * client service provider's `boot()`, which runs after every `register()`:
 *
 * ```ts
 * class MyNotificationProvider extends ServiceProvider<ClientApplication> {
 *   public override boot(): Promise<void> {
 *     const { container } = this.app;
 *     if (container.has(notificationPreferenceSectionsToken))
 *       container.resolve(notificationPreferenceSectionsToken).register({ key: 'my.section', component: MySection });
 *     return Promise.resolve();
 *   }
 * }
 * ```
 *
 * Each `register()` returns what removes the entry again.
 */
import { useClientApplication } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ComponentType } from 'react';

import type { NotificationTemplateText } from '../shared/templates.js';
import type { NotificationChannelView } from './settings/api.js';

/** How the channels tab shows the channels of one configured type, such as `smtp` or `web-push`. */
export interface NotificationChannelTypeDisplay {
  /** The configured channel type (`type` in `notification.channels`). */
  readonly type: string;
  /** The type's name; a plain string or a translation key in its own namespace. */
  readonly title: NotificationTemplateText;
  readonly icon?: ComponentType<{ readonly className?: string }>;
  /** Replaces the summary the server built from the channel's configuration. */
  readonly Summary?: ComponentType<{
    readonly channel: NotificationChannelView;
  }>;
  /** What a test send does, shown in the test dialog, such as "Sends to your enabled browser devices". */
  readonly testHint?: NotificationTemplateText;
}

/** A section of the personal notification page, below the table of kinds, such as the browser push devices. */
export interface NotificationPreferenceSection {
  /** Unique among sections, such as `web-push.devices`. */
  readonly key: string;
  /** Lower values come first; defaults to 0, with ties in registration order. */
  readonly order?: number;
  /** Renders nothing when it has nothing to offer the signed-in person. */
  readonly component: ComponentType;
}

export interface NotificationChannelTypeRegistry {
  register(display: NotificationChannelTypeDisplay): () => void;
  get(type: string): NotificationChannelTypeDisplay | undefined;
  list(): readonly NotificationChannelTypeDisplay[];
}

export interface NotificationPreferenceSectionRegistry {
  register(section: NotificationPreferenceSection): () => void;
  /** In display order. */
  list(): readonly NotificationPreferenceSection[];
}

export const notificationChannelTypesToken: ServiceToken<NotificationChannelTypeRegistry> =
  createServiceToken<NotificationChannelTypeRegistry>(
    '@nocobase/app-plugin-notification/client/channel-types',
  );

export const notificationPreferenceSectionsToken: ServiceToken<NotificationPreferenceSectionRegistry> =
  createServiceToken<NotificationPreferenceSectionRegistry>(
    '@nocobase/app-plugin-notification/client/preference-sections',
  );

function keyedRegistry<T>(
  keyOf: (entry: T) => string,
  what: string,
): {
  register(entry: T): () => void;
  get(key: string): T | undefined;
  list(): readonly T[];
} {
  const entries = new Map<string, T>();
  return {
    register(entry) {
      const key = keyOf(entry);
      if (entries.has(key))
        throw new Error(`A notification ${what} "${key}" is registered.`);
      entries.set(key, entry);
      return () => {
        if (entries.get(key) === entry) entries.delete(key);
      };
    },
    get: (key) => entries.get(key),
    list: () => [...entries.values()],
  };
}

export function createNotificationChannelTypeRegistry(
  initial: readonly NotificationChannelTypeDisplay[] = [],
): NotificationChannelTypeRegistry {
  const registry = keyedRegistry<NotificationChannelTypeDisplay>(
    (display) => display.type,
    'channel type',
  );
  for (const display of initial) registry.register(display);
  return registry;
}

export function createNotificationPreferenceSectionRegistry(): NotificationPreferenceSectionRegistry {
  const registry = keyedRegistry<NotificationPreferenceSection>(
    (section) => section.key,
    'preference section',
  );
  return {
    register: (section) => registry.register(section),
    list: () =>
      registry
        .list()
        .map((section, index) => ({ section, index }))
        .sort(
          (a, b) =>
            (a.section.order ?? 0) - (b.section.order ?? 0) ||
            a.index - b.index,
        )
        .map(({ section }) => section),
  };
}

const emptyChannelTypes = createNotificationChannelTypeRegistry();
const emptySections = createNotificationPreferenceSectionRegistry();

/** The channel type displays the application's plugins registered. */
export function useNotificationChannelTypes(): NotificationChannelTypeRegistry {
  const { services } = useClientApplication();
  return services.has(notificationChannelTypesToken)
    ? services.resolve(notificationChannelTypesToken)
    : emptyChannelTypes;
}

/** The personal notification sections the application's plugins registered. */
export function useNotificationPreferenceSections(): NotificationPreferenceSectionRegistry {
  const { services } = useClientApplication();
  return services.has(notificationPreferenceSectionsToken)
    ? services.resolve(notificationPreferenceSectionsToken)
    : emptySections;
}
