/** An SMS recipient: a phone number in E.164 form, such as `+8613800138000`. */
export interface SmsRecipient {
  readonly phone: string;
}

export interface SmsMessage {
  /** One or more phone numbers in E.164 form. Each number gets its own message and delivery. */
  readonly to: string | readonly [string, ...string[]];
  /** The name of a template of the channel's `templates` configuration, such as `code` or `notification`. */
  readonly template: string;
  /** The message's variables. The template's `params` map them to the provider's variable names. */
  readonly params?: Readonly<Record<string, string>>;
}

export interface PreparedSmsMessage {
  readonly phone: string;
  readonly template: string;
  readonly params: Readonly<Record<string, string>>;
}

/** The templates of a channel, by purpose. */
export interface SmsTemplateConfig {
  /** The provider's template ID or code. */
  readonly templateId: string;
  /**
   * The provider's variable name mapped to the message's variable name, in the order the provider takes them (Tencent
   * Cloud fills variables by position). Without it the message's variables pass through under their own names.
   */
  readonly params?: Readonly<Record<string, string>>;
}

export interface SmsChannelConfig {
  readonly type: 'sms';
  readonly enabled?: boolean;
  /** The service that sends: `aliyun`, `tencent`, or one registered with `SmsProviderRegistry`. */
  readonly service: string;
  /** The approved signature, without brackets. */
  readonly signName: string;
  readonly templates: Readonly<Record<string, SmsTemplateConfig>>;
  /** The service's own settings live under its name: `aliyun`, `tencent` or the registered service name. */
  readonly [service: string]: unknown;
}

/** The name of the template `notify()` uses, with the variables `title` and `body`. */
export const SMS_NOTIFICATION_TEMPLATE = 'notification';
