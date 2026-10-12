import { createHmac } from 'node:crypto';

import {
  type SendingProviderDefinition,
  type ProviderSendResult,
} from '../../types.js';

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

export function createFeishuWebhookProviderDefinition(): SendingProviderDefinition<
  FeishuWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    type: 'feishu-webhook',
    messageType: 'im',
    validateConfig: validateFeishuConfig,
    async createProvider(_context, config) {
      validateFeishuConfig(config);
      return {
        type: 'feishu-webhook',
        async send({
          message,
          signal,
          deliveryId,
        }): Promise<ProviderSendResult> {
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
                  sign: createHmac(
                    'sha256',
                    `${timestamp}\n${config.secret}`,
                  ).digest('base64'),
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
        },
      };
    },
  };
}

function validateFeishuConfig(config: FeishuWebhookProviderConfig): void {
  validateHttpUrl(config.webhookUrl, {
    allowedHosts: ['open.feishu.cn', 'open.larksuite.com'],
  });
}
