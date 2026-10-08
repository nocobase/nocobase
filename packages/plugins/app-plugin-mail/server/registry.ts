import type {
  MailProviderDefinition,
  MailProviderRegistry,
} from './contracts/provider.js';

/** Collects Provider definitions without creating accounts or external clients. */
export class DefaultMailProviderRegistry implements MailProviderRegistry {
  private readonly providerDefinitions = new Map<
    string,
    MailProviderDefinition
  >();

  public register(definition: MailProviderDefinition): this {
    if (this.providerDefinitions.has(definition.type)) {
      throw new Error(
        `Mail Provider definition "${definition.type}" is already registered.`,
      );
    }
    this.providerDefinitions.set(definition.type, definition);
    return this;
  }

  public definition(type: string): MailProviderDefinition | undefined {
    return this.providerDefinitions.get(type);
  }

  public definitions(): readonly MailProviderDefinition[] {
    return [...this.providerDefinitions.values()];
  }
}

export function createMailProviderRegistry(): MailProviderRegistry {
  return new DefaultMailProviderRegistry();
}
