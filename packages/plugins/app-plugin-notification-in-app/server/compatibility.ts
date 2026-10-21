import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification';
import { createInAppChannelDefinition } from './definition.js';

/** Keep the message handler available to third-party legacy Providers. */
export function installLegacyMessageHandler(
  registry: NotificationExtensionRegistry,
): void {
  registry.registerChannel(createInAppChannelDefinition());
}
