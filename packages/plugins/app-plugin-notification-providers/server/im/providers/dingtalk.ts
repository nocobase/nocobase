import type {
  ChannelConfigSummaryItem,
  ChannelContext,
  ChannelInstance,
  NotificationContent,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationI18nText,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { createHmac } from 'node:crypto';
import {
  prepareImMessage,
  validateImMessage,
  type ImMessage,
  type ImRecipient,
} from '../channel.js';

import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';

import { postJson, validateHttpUrl } from '../../http.js';
import type { PreparedImMessage } from '../channel.js';
import { formatImText } from '../channel.js';
import { evaluateJsonResult } from '../result.js';
import {
  maskedSecret,
  PROVIDERS_CONTRIBUTOR,
  webhookOrigin,
} from '../../summary.js';
import { composeImMessage } from '../channel.js';

export interface DingTalkWebhookProviderConfig {
  readonly provider: 'dingtalk-webhook';
  readonly enabled?: boolean;
  readonly webhookUrl: string;
  readonly secret?: string;
}

export function defineDingTalkWebhookProviderConfig(
  input: Omit<DingTalkWebhookProviderConfig, 'provider'>,
): DingTalkWebhookProviderConfig {
  return { provider: 'dingtalk-webhook', ...input };
}

/** @deprecated Use registerChannelType(DingTalkWebhookChannel) instead. */
export function createDingTalkWebhookProviderDefinition(): NotificationProviderDefinition<
  DingTalkWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    type: 'dingtalk-webhook',
    messageType: 'im',
    label: notificationProviderText(
      'providers.dingtalkWebhook',
      'DingTalk webhook',
    ),
    validateConfig: validateDingTalkConfig,
    async createProvider(_context, config) {
      validateDingTalkConfig(config);
      return {
        type: 'dingtalk-webhook',
        send: (input) => sendDingTalk(config, input),
      };
    },
  };
}

function validateDingTalkConfig(config: DingTalkWebhookProviderConfig): void {
  validateHttpUrl(config.webhookUrl, {
    allowedHosts: ['oapi.dingtalk.com'],
  });
}

function sendDingTalk(
  config: DingTalkWebhookProviderConfig | DingTalkWebhookChannelConfig,
  { message, signal, deliveryId }: ChannelSendInput<PreparedImMessage>,
): Promise<ProviderSendResult> {
  const timestamp = Date.now().toString();
  const url = new URL(config.webhookUrl);
  if (config.secret) {
    url.searchParams.set('timestamp', timestamp);
    url.searchParams.set(
      'sign',
      createHmac('sha256', config.secret)
        .update(`${timestamp}\n${config.secret}`)
        .digest('base64'),
    );
  }
  return postJson(
    url.toString(),
    message.content.payloads?.dingtalk ?? {
      msgtype: 'text',
      text: { content: formatImText(message.content) },
    },
    { signal },
    {
      headers: { 'x-nocobase-delivery-id': deliveryId },
      evaluateSuccess: (response) =>
        evaluateJsonResult(response, {
          code: [['errcode']],
          message: [['errmsg']],
          success: (code) => code === 0,
        }),
    },
  );
}

export interface DingTalkWebhookChannelConfig extends Omit<
  DingTalkWebhookProviderConfig,
  'provider'
> {
  readonly type: 'dingtalk-webhook';
}

export class DingTalkWebhookChannel implements ChannelInstance<
  ImMessage,
  ImRecipient,
  PreparedImMessage
> {
  static readonly type = 'dingtalk-webhook';
  static readonly contributor: string = PROVIDERS_CONTRIBUTOR;
  /** The webhook's host only: its path and query carry the token. */
  static summarize(
    config: DingTalkWebhookChannelConfig,
  ): readonly ChannelConfigSummaryItem[] {
    return [
      { label: 'webhookUrl', value: webhookOrigin(config.webhookUrl) },
      { label: 'secret', value: maskedSecret(config.secret) },
    ];
  }
  static readonly label: NotificationI18nText = notificationProviderText(
    'providers.dingtalkWebhook',
    'DingTalk webhook',
  );
  static validateConfig(config: DingTalkWebhookChannelConfig): void {
    validateDingTalkConfig({ ...config, provider: 'dingtalk-webhook' });
  }
  constructor(
    _context: ChannelContext,
    private readonly config: DingTalkWebhookChannelConfig,
  ) {
    DingTalkWebhookChannel.validateConfig(config);
  }
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<ImMessage, ImRecipient> {
    return validateImMessage(input);
  }
  prepare(
    input: ChannelPreparationInput<ImMessage, ImRecipient>,
  ): Promise<PreparedImMessage> {
    return prepareImMessage(input);
  }
  /** A group webhook reaches no user; a test send posts the text to its group. */
  compose(content: NotificationContent): ImMessage {
    return composeImMessage(content);
  }
  send(
    input: ChannelSendInput<PreparedImMessage>,
  ): Promise<ProviderSendResult> {
    return sendDingTalk(this.config, input);
  }
}
