import type {
  ChannelCapabilities,
  ChannelConfigSummaryItem,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationContent,
  NotificationI18nText,
  ProviderSendResult,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';

import { notificationProviderText } from '../i18n.js';
import { PROVIDERS_CONTRIBUTOR } from '../summary.js';
import {
  createSmsProviderRegistry,
  validateSmsChannelConfig,
} from './config.js';
import {
  SmsProviderError,
  smsErrorResult,
  smsFailureResult,
} from './errors.js';
import {
  SmsProviderRegistry,
  smsProviderRegistryToken,
  userPhoneDirectoryToken,
  type SmsProvider,
} from './provider.js';
import {
  SMS_NOTIFICATION_TEMPLATE,
  type PreparedSmsMessage,
  type SmsChannelConfig,
  type SmsMessage,
  type SmsRecipient,
} from './types.js';

/** E.164: a plus sign, a country code that does not start with 0, at most 15 digits. */
const E164 = /^\+[1-9]\d{6,14}$/;
const MAX_RECIPIENTS = 100;
const MAX_PARAM_LENGTH = 500;
const NOTIFICATION_TITLE_LENGTH = 60;
const NOTIFICATION_BODY_LENGTH = 200;

export function isE164(value: unknown): value is string {
  return typeof value === 'string' && E164.test(value);
}

function clip(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

/** A channel's templates are its own: the message and the preparation both check against them. */
function templateOf(config: SmsChannelConfig, name: string) {
  const template = Object.hasOwn(config.templates, name)
    ? config.templates[name]
    : undefined;
  if (!template) throw new Error(`SMS template "${name}" is not configured.`);
  return template;
}

export class SmsChannel implements ChannelInstance<
  SmsMessage,
  SmsRecipient,
  PreparedSmsMessage
> {
  static readonly type = 'sms';
  static readonly contributor: string = PROVIDERS_CONTRIBUTOR;
  static readonly label: NotificationI18nText = notificationProviderText(
    'providers.sms',
    'SMS',
  );

  /** The service and signature, and each secret as set or not set. No part of a secret is shown. */
  static summarize(
    config: SmsChannelConfig,
  ): readonly ChannelConfigSummaryItem[] {
    const service = createSmsProviderRegistry().get(config.service);
    const settings = config[config.service];
    return [
      { label: 'service', value: String(config.service ?? 'not set') },
      { label: 'signName', value: String(config.signName ?? 'not set') },
      ...(service
        ? service.summarize(
            settings && typeof settings === 'object' ? settings : {},
          )
        : []),
      {
        label: 'templates',
        value: Object.keys(config.templates ?? {}).join(', ') || 'not set',
      },
    ];
  }

  static validateConfig(config: SmsChannelConfig): void {
    validateSmsChannelConfig(config);
  }

  public readonly capabilities?: ChannelCapabilities;
  private readonly provider: SmsProvider;

  constructor(
    private readonly context: ChannelContext,
    private readonly config: SmsChannelConfig,
  ) {
    const registry: SmsProviderRegistry = context.container.has(
      smsProviderRegistryToken,
    )
      ? context.container.resolve(smsProviderRegistryToken)
      : createSmsProviderRegistry();
    validateSmsChannelConfig(config, registry, { requireRegistered: true });
    const settings = config[config.service];
    this.provider = registry
      .get(config.service)!
      .create(
        (settings && typeof settings === 'object' ? settings : {}) as Record<
          string,
          unknown
        >,
      );
  }

  /** Each user's verified phone number, when the verification plugin provides the directory and `notification` is configured. */
  async resolveUsers(
    userIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly SmsRecipient[]>> {
    const found = new Map<string, readonly SmsRecipient[]>();
    if (
      !this.context.container.has(userPhoneDirectoryToken) ||
      !Object.hasOwn(this.config.templates, SMS_NOTIFICATION_TEMPLATE)
    )
      return found;
    const phones = await this.context.container
      .resolve(userPhoneDirectoryToken)
      .find(userIds);
    for (const [userId, phone] of phones)
      if (isE164(phone)) found.set(userId, [{ phone }]);
    return found;
  }

  /** A notification as the channel's `notification` template: its `title` and `body` variables, shortened for SMS. */
  compose(
    content: NotificationContent,
    recipients: readonly SmsRecipient[],
  ): SmsMessage {
    const [first, ...rest] = recipients.map(({ phone }) => phone);
    if (first === undefined)
      throw new Error('An SMS notification needs a recipient.');
    return {
      to: [first, ...rest],
      template: SMS_NOTIFICATION_TEMPLATE,
      params: {
        title: clip(content.title, NOTIFICATION_TITLE_LENGTH),
        body: clip(
          content.body.trim() ? content.body : content.title,
          NOTIFICATION_BODY_LENGTH,
        ),
      },
    };
  }

  recipientKey(recipient: SmsRecipient): string {
    return recipient.phone;
  }

  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<SmsMessage, SmsRecipient> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('SMS message is required.');
    for (const key of Object.keys(input))
      if (!['to', 'template', 'params', 'actionUrl'].includes(key))
        throw new Error(`Unsupported SMS message field "${key}".`);
    const message = input as SmsMessage;
    const phones = typeof message.to === 'string' ? [message.to] : message.to;
    if (
      !Array.isArray(phones) ||
      !phones.length ||
      phones.length > MAX_RECIPIENTS ||
      phones.some((phone: unknown) => !isE164(phone))
    )
      throw new Error(
        `SMS to must contain 1 to ${MAX_RECIPIENTS} phone numbers in E.164 form, such as +8613800138000.`,
      );
    if (typeof message.template !== 'string')
      throw new Error('SMS template is required.');
    templateOf(this.config, message.template);
    const params = message.params ?? {};
    if (!params || typeof params !== 'object' || Array.isArray(params))
      throw new Error('SMS params must be an object.');
    for (const [name, value] of Object.entries(params))
      if (typeof value !== 'string' || value.length > MAX_PARAM_LENGTH)
        throw new Error(
          `SMS param "${name}" must be a string of at most ${MAX_PARAM_LENGTH} characters.`,
        );
    return {
      message: { to: message.to, template: message.template, params },
      recipients: [...new Set(phones)].map((phone) => ({ phone })),
    };
  }

  async prepare(
    input: ChannelPreparationInput<SmsMessage, SmsRecipient>,
  ): Promise<PreparedSmsMessage> {
    templateOf(this.config, input.message.template);
    return {
      phone: input.recipient.phone,
      template: input.message.template,
      params: input.message.params ?? {},
    };
  }

  async send({
    message,
    signal,
  }: ChannelSendInput<PreparedSmsMessage>): Promise<ProviderSendResult> {
    try {
      const template = templateOf(this.config, message.template);
      const params: Record<string, string> = {};
      if (template.params) {
        for (const [providerName, messageName] of Object.entries(
          template.params,
        )) {
          const value = Object.hasOwn(message.params, messageName)
            ? message.params[messageName]
            : undefined;
          if (value === undefined)
            return smsErrorResult(
              new SmsProviderError('SMS_PARAMS_INVALID', {
                variable: messageName,
              }),
            );
          params[providerName] = value;
        }
      } else Object.assign(params, message.params);
      const receipt = await this.provider.send({
        phone: message.phone,
        templateId: template.templateId,
        params,
        signName: this.config.signName,
        signal,
      });
      return receipt.messageId
        ? { status: 'accepted', providerMessageId: receipt.messageId }
        : { status: 'accepted' };
    } catch (error) {
      return smsFailureResult(error, signal);
    }
  }
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    sms: { readonly recipient: SmsRecipient; readonly message: SmsMessage };
  }
}
