import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ChannelConfigSummaryItem } from '@nocobase/app-plugin-notification';

export interface SmsSendInput {
  /** The number in E.164 form. */
  readonly phone: string;
  readonly templateId: string;
  /** The variables under the provider's names, in the template's order. */
  readonly params: Readonly<Record<string, string>>;
  readonly signName: string;
  readonly signal: AbortSignal;
}

export interface SmsSendReceipt {
  /** The provider's id of the submission, when it returns one. */
  readonly messageId?: string | undefined;
}

/** One sending service. Throw `SmsProviderError` for any refusal or failure; never put `params` in an error. */
export interface SmsProvider {
  send(input: SmsSendInput): Promise<SmsSendReceipt>;
}

/** A sending service the SMS channel can use: its settings, their summary and the provider they create. */
export interface SmsProviderDefinition<TOptions = Record<string, unknown>> {
  readonly service: string;
  readonly label?: string;
  /** Throws on invalid settings. `options` is the channel's `<service>` object, or `{}` when absent. */
  validate(options: Partial<TOptions> | Record<string, unknown>): void;
  /** Safe lines for the settings page: show whether a secret is set, never any part of it. */
  summarize(
    options: Partial<TOptions> | Record<string, unknown>,
  ): readonly ChannelConfigSummaryItem[];
  create(options: TOptions): SmsProvider;
}

export class SmsProviderRegistry {
  private readonly definitions = new Map<string, SmsProviderDefinition>();

  public constructor(builtIn: readonly SmsProviderDefinition[] = []) {
    for (const definition of builtIn) this.register(definition);
  }

  public register<TOptions>(definition: SmsProviderDefinition<TOptions>): this {
    if (!definition.service.trim())
      throw new Error('An SMS service needs a name.');
    if (this.definitions.has(definition.service))
      throw new Error(
        `SMS service "${definition.service}" is already registered.`,
      );
    this.definitions.set(
      definition.service,
      definition as unknown as SmsProviderDefinition,
    );
    return this;
  }

  public get(service: string): SmsProviderDefinition | undefined {
    return this.definitions.get(service);
  }

  public list(): readonly string[] {
    return [...this.definitions.keys()];
  }
}

/** Where another package registers an SMS service. The notification providers plugin binds it. */
export const smsProviderRegistryToken: ServiceToken<SmsProviderRegistry> =
  createServiceToken<SmsProviderRegistry>(
    '@nocobase/app-plugin-notification-providers/sms-provider-registry',
  );

/**
 * The verified phone numbers of users. The verification plugin provides it; without it `notify()` reaches nobody by
 * SMS, which is how it treats email without the authentication plugin.
 */
export interface UserPhoneDirectory {
  /** The verified number of each user that has one, in E.164 form. */
  find(userIds: readonly string[]): Promise<ReadonlyMap<string, string>>;
}

export const userPhoneDirectoryToken: ServiceToken<UserPhoneDirectory> =
  createServiceToken<UserPhoneDirectory>(
    '@nocobase/app-plugin-notification-providers/user-phone-directory',
  );
