import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification';
import { createEmailChannelDefinition } from './email/channel.js';
import { createImChannelDefinition } from './im/channel.js';

/** Keep message handlers available to third-party legacy Providers. */
export function installLegacyMessageHandlers(
  registry: NotificationExtensionRegistry,
): void {
  registry
    .registerChannel(createEmailChannelDefinition())
    .registerChannel(createImChannelDefinition());
}
