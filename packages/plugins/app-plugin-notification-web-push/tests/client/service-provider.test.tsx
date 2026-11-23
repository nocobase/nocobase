import type { ClientApplication } from '@nocobase/app-client';
import {
  createNotificationChannelTypeRegistry,
  createNotificationPreferenceSectionRegistry,
  notificationChannelTypesToken,
  notificationPreferenceSectionsToken,
} from '@nocobase/app-plugin-notification/client';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import { PushPreferences } from '../../client/components/preferences.js';
import { WebPushClientServiceProvider } from '../../client/service-provider.js';

const boot = (container: ServiceContainer) =>
  new WebPushClientServiceProvider({
    container,
  } as unknown as ClientApplication).boot();

describe('web push client service provider', () => {
  it('adds its devices section and channel type to the notification registries', async () => {
    const container = new ServiceContainer();
    const sections = createNotificationPreferenceSectionRegistry();
    const types = createNotificationChannelTypeRegistry();
    container.instance(notificationPreferenceSectionsToken, sections);
    container.instance(notificationChannelTypesToken, types);
    await boot(container);
    expect(sections.list()).toEqual([
      { key: 'web-push.devices', order: 100, component: PushPreferences },
    ]);
    expect(types.get('web-push')?.title).toMatchObject({
      key: 'channelType.title',
    });
  });

  it('does nothing without the notification plugin', async () => {
    await expect(boot(new ServiceContainer())).resolves.toBeUndefined();
  });
});
