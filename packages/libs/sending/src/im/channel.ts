import { validateSendingTarget, type SendingTarget } from '../target.js';
import { type SendingChannelDefinition } from '../types.js';

export interface ImRecipient {
  readonly webhook: true;
}

export interface ImMessage {
  readonly to?: never;
  readonly text: string;
  readonly title?: string;
  readonly target?: Extract<SendingTarget, { type: 'url' }>;
  readonly format?: 'text' | 'markdown';
  readonly payloads?: {
    readonly feishu?: object;
    readonly dingtalk?: object;
  };
}

export interface PreparedImMessage {
  readonly recipient: ImRecipient;
  readonly content: ImMessage;
}

export interface ImProviderConfig {
  readonly provider: string;
  readonly enabled?: boolean;
}
export type ImChannelConfig = ImProviderConfig;

export function createImChannelDefinition(): SendingChannelDefinition<
  ImChannelConfig,
  ImRecipient,
  ImMessage,
  PreparedImMessage
> {
  return {
    type: 'im',
    async createChannel() {
      return {
        type: 'im',
        validateMessage(value: unknown) {
          if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new Error('IM message is required.');
          for (const key of Object.keys(value)) {
            if (
              ![
                'to',
                'text',
                'title',
                'target',
                'format',
                'payloads',
                'actionUrl',
              ].includes(key)
            )
              throw new Error(`Unsupported IM message field "${key}".`);
          }
          const message = value as ImMessage;
          if ('to' in message)
            throw new Error('Webhook messages do not accept to.');
          if (typeof message.text !== 'string' || !message.text.trim())
            throw new Error('IM text is required.');
          if (message.title !== undefined && typeof message.title !== 'string')
            throw new Error('IM title must be a string.');
          if (
            message.format !== undefined &&
            message.format !== 'text' &&
            message.format !== 'markdown'
          )
            throw new Error('Unsupported IM format.');
          if (message.payloads !== undefined) {
            if (
              !message.payloads ||
              typeof message.payloads !== 'object' ||
              Array.isArray(message.payloads)
            )
              throw new Error('IM payloads must be an object.');
            for (const payload of Object.values(message.payloads)) {
              if (
                !payload ||
                typeof payload !== 'object' ||
                Array.isArray(payload)
              )
                throw new Error('IM Provider payload must be an object.');
            }
          }
          const target = validateSendingTarget(message.target);
          if (target?.type === 'route')
            throw new Error('IM notifications require a full URL target.');
          return {
            message: {
              text: message.text,
              title: message.title,
              target: message.target,
              format: message.format,
              payloads: message.payloads,
            },
            recipients: [{ webhook: true as const }],
          };
        },
        async prepare(input: {
          readonly recipient: ImRecipient;
          readonly message: ImMessage;
        }): Promise<PreparedImMessage> {
          if (!input.message.text.trim() && !input.message.payloads)
            throw new Error('IM text or provider payload is required.');
          const target = validateSendingTarget(input.message.target);
          if (target?.type === 'route')
            throw new Error('IM notifications require a full URL target.');
          return {
            recipient: input.recipient,
            content: { ...input.message, target },
          };
        },
      };
    },
  };
}

export function formatImText(message: ImMessage): string {
  return [message.title, message.text, message.target?.url]
    .filter((value): value is string => Boolean(value))
    .join('\n');
}
