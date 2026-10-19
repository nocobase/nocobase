import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification/server';
import {
  PushMessage,
  type PreparedPush,
  type WebPushService,
} from './service.js';

export function registerWebPushChannel(
  registry: NotificationExtensionRegistry,
  service: () => WebPushService,
): void {
  registry
    .registerChannel({
      type: 'web-push',
      async createChannel() {
        return {
          type: 'web-push',
          validateMessage(input) {
            const message = PushMessage.parse(input);
            return { message, recipients: message.to };
          },
          async prepare({ recipient, message }) {
            const { to: _to, ...data } = PushMessage.parse(message);
            return { device: recipient, message: data };
          },
        };
      },
    })
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
