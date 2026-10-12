import { createHmac } from 'node:crypto';

import {
  type SendingProviderDefinition,
  type ProviderSendResult,
} from '../../types.js';

import { postJson, validateHttpUrl } from '../../http.js';
import type { PreparedImMessage } from '../channel.js';
import { formatImText } from '../channel.js';
import { evaluateJsonResult } from '../result.js';

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

export function createDingTalkWebhookProviderDefinition(): SendingProviderDefinition<
  DingTalkWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    type: 'dingtalk-webhook',
    messageType: 'im',
    validateConfig: validateDingTalkConfig,
    async createProvider(_context, config) {
      validateDingTalkConfig(config);
      return {
        type: 'dingtalk-webhook',
        async send({
          message,
          signal,
          deliveryId,
        }): Promise<ProviderSendResult> {
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
        },
      };
    },
  };
}

function validateDingTalkConfig(config: DingTalkWebhookProviderConfig): void {
  validateHttpUrl(config.webhookUrl, {
    allowedHosts: ['oapi.dingtalk.com'],
  });
}
