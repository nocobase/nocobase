import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationTestAdapter,
  NotificationI18nText,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import {
  imTestAdapter,
  validateImMessage,
  prepareImMessage,
  type ImMessage,
  type ImRecipient,
} from '../channel.js';
import { createHmac } from 'node:crypto';

import {
  type NotificationProviderDefinition,
  type ProviderSendResult,
} from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';

import { postJson, validateHttpUrl } from '../../http.js';
import type { PreparedImMessage } from '../channel.js';
import { formatImText } from '../channel.js';
import { evaluateJsonResult } from '../result.js';

export interface FeishuWebhookProviderConfig {
  readonly provider: 'feishu-webhook';
  readonly enabled?: boolean;
  readonly webhookUrl: string;
  readonly secret?: string;
}

export function defineFeishuWebhookProviderConfig(
  input: Omit<FeishuWebhookProviderConfig, 'provider'>,
): FeishuWebhookProviderConfig {
  return { provider: 'feishu-webhook', ...input };
}

/** @deprecated Use registerChannelType(FeishuWebhookChannel) instead. */
export function createFeishuWebhookProviderDefinition(): NotificationProviderDefinition<
  FeishuWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    type: 'feishu-webhook',
    messageType: 'im',
    label: notificationProviderText(
      'test.providers.feishuWebhook',
      'Feishu webhook',
    ),
    validateConfig: validateFeishuConfig,
    async createProvider(_context, config) {
      validateFeishuConfig(config);
      return {
        type: 'feishu-webhook',
        send: (input) => sendFeishu(config, input),
      };
    },
  };
}

function validateFeishuConfig(config: FeishuWebhookProviderConfig): void {
  validateHttpUrl(config.webhookUrl, {
    allowedHosts: ['open.feishu.cn', 'open.larksuite.com'],
  });
}

function sendFeishu(
  config: FeishuWebhookProviderConfig | FeishuWebhookChannelConfig,
  { message, signal, deliveryId }: ChannelSendInput<PreparedImMessage>,
): Promise<ProviderSendResult> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = message.content.payloads?.feishu ?? {
    msg_type: 'text',
    content: { text: formatImText(message.content) },
  };
  return postJson(
    config.webhookUrl,
    config.secret
      ? {
          ...body,
          timestamp,
          sign: createHmac('sha256', `${timestamp}\n${config.secret}`).digest(
            'base64',
          ),
        }
      : body,
    { signal },
    {
      headers: { 'x-nocobase-delivery-id': deliveryId },
      evaluateSuccess: (response) =>
        evaluateJsonResult(response, {
          code: [['StatusCode'], ['code']],
          message: [['StatusMessage'], ['msg']],
          success: (code) => code === 0,
        }),
    },
  );
}

export interface FeishuWebhookChannelConfig extends Omit<
  FeishuWebhookProviderConfig,
  'provider'
> {
  readonly type: 'feishu-webhook';
}

export class FeishuWebhookChannel implements ChannelInstance<
  ImMessage,
  ImRecipient,
  PreparedImMessage
> {
  static readonly type = 'feishu-webhook';
  static readonly label: NotificationI18nText = notificationProviderText(
    'test.providers.feishuWebhook',
    'Feishu webhook',
  );
  static readonly test: NotificationTestAdapter<FeishuWebhookChannelConfig> =
    imTestAdapter;
  static validateConfig(config: FeishuWebhookChannelConfig): void {
    validateFeishuConfig({ ...config, provider: 'feishu-webhook' });
  }
  constructor(
    _context: ChannelContext,
    private readonly config: FeishuWebhookChannelConfig,
  ) {
    FeishuWebhookChannel.validateConfig(config);
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
  send(
    input: ChannelSendInput<PreparedImMessage>,
  ): Promise<ProviderSendResult> {
    return sendFeishu(this.config, input);
  }
}
