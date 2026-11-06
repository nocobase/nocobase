import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
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
  private readonly service: WebPushService;
  constructor(context: ChannelContext) {
    this.service = context.container.resolve(webPushServiceToken);
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
