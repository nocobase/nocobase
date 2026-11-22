import type {
  ChannelConfigSummaryItem,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
  NotificationContent,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification/server';
import { webPushServiceToken } from './tokens.js';
import type { WebPushMessage } from './service.js';
import {
  PushMessage,
  type PreparedPush,
  type WebPushService,
} from './service.js';

// Retain the legacy module exports for existing callers.
export {
  createWebPushChannelDefinition,
  registerWebPushChannel,
} from './compatibility.js';

export class WebPushChannel implements ChannelInstance<
  WebPushMessage,
  PreparedPush['device'],
  PreparedPush
> {
  static readonly type = 'web-push';
  static readonly contributor: string =
    '@nocobase/app-plugin-notification-web-push';
  /** Push needs no per-channel settings: its keys live in the plugin's secrets. */
  static summarize(): readonly ChannelConfigSummaryItem[] {
    return [];
  }
  private readonly service: WebPushService;
  constructor(context: ChannelContext) {
    this.service = context.container.resolve(webPushServiceToken);
  }
  /** Each user's enabled devices; a user without one is skipped. */
  async resolveUsers(
    userIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly PreparedPush['device'][]>> {
    const found = new Map<string, PreparedPush['device'][]>();
    if (!this.service.subscriptions.ready) return found;
    for (const row of await this.service.subscriptions.forUsers(userIds)) {
      const devices = found.get(row.userId) ?? [];
      devices.push({ id: row.id, userId: row.userId });
      found.set(row.userId, devices);
    }
    return found;
  }
  /** Opens the notification's route, or the application home for an external link the worker would refuse. */
  compose(
    content: NotificationContent,
    recipients: readonly PreparedPush['device'][],
  ): WebPushMessage {
    return {
      to: [...recipients],
      title: content.title.slice(0, 200),
      ...(content.body ? { body: content.body } : {}),
      url: content.target?.type === 'route' ? content.target.path : '/',
      dedupeKey: `${content.kind}:${content.key}`.slice(0, 512),
    };
  }
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<WebPushMessage, PreparedPush['device']> {
    const message = this.service.validateMessage(input);
    return { message, recipients: message.to };
  }
  async prepare({
    recipient,
    message,
  }: ChannelPreparationInput<
    WebPushMessage,
    PreparedPush['device']
  >): Promise<PreparedPush> {
    const { to: _to, ...data } = PushMessage.parse(message);
    return { device: recipient, message: data };
  }
  send({
    message,
    signal,
  }: ChannelSendInput<PreparedPush>): Promise<ChannelSendResult> {
    return this.service.deliver(message, signal);
  }
}
