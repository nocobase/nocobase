import type {
  NotificationChannelDefinition,
  NotificationExtensionRegistry,
} from '@nocobase/app-plugin-notification/server';
import {
  PushMessage,
  type PreparedPush,
  type WebPushService,
} from './service.js';

/** Keep the message handler available to third-party legacy Providers. */
export function installLegacyMessageHandler(
  registry: NotificationExtensionRegistry,
  service: () => WebPushService,
): void {
  registry.registerChannel(createWebPushChannelDefinition(service));
}

export function createWebPushChannelDefinition(
  service: () => WebPushService,
): NotificationChannelDefinition {
  return {
    type: 'web-push',
    async createChannel() {
      return {
        type: 'web-push',
        validateMessage(input) {
          const message = service().validateMessage(input);
          return { message, recipients: message.to };
        },
        async prepare({ recipient, message }) {
          const { to: _to, ...data } = PushMessage.parse(message);
          return { device: recipient, message: data };
        },
      };
    },
  };
}

/** @deprecated Register WebPushChannel with registerChannelType. */
export function registerWebPushChannel(
  registry: NotificationExtensionRegistry,
  service: () => WebPushService,
): void {
  registry
    .registerChannel(createWebPushChannelDefinition(service))
    .registerProvider({
      type: 'web-push',
      messageType: 'web-push',
      async createProvider() {
        return {
          type: 'web-push',
          send: ({ message, signal }) =>
            service().deliver(message as PreparedPush, signal),
        };
      },
    });
}
