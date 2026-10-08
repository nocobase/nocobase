import type { MailAccount, MailProviderConfig } from '../shared/mail.js';
import type {
  MailProviderAdapter,
  MailProviderAdapterResolver,
  MailProviderContext,
  MailProviderRegistry,
} from './contracts/provider.js';

export interface DefaultMailProviderAdapterResolverOptions {
  readonly registry: MailProviderRegistry;
  readonly context: MailProviderContext;
  readonly resolveConfig?: (
    account: MailAccount,
  ) => Promise<MailProviderConfig> | MailProviderConfig;
}

export class DefaultMailProviderAdapterResolver implements MailProviderAdapterResolver {
  public constructor(
    private readonly options: DefaultMailProviderAdapterResolverOptions,
  ) {}

  public async resolve(
    account: MailAccount,
    _signal?: AbortSignal,
  ): Promise<MailProviderAdapter> {
    const definition = this.options.registry.definition(account.provider.type);
    if (!definition) {
      throw new Error(
        `Mail Provider definition "${account.provider.type}" is not registered.`,
      );
    }
    const config = this.options.resolveConfig
      ? await this.options.resolveConfig(account)
      : account.provider;
    definition.validateConfig?.(config);
    return definition.createAdapter(this.options.context, config, account);
  }
}

export function createMailProviderAdapterResolver(
  options: DefaultMailProviderAdapterResolverOptions,
): DefaultMailProviderAdapterResolver {
  return new DefaultMailProviderAdapterResolver(options);
}
