import { type MailProviderView } from '../../shared/mail.js';
import { type DefaultMailServiceDependencies } from './dependencies.js';

export class MailProvidersService {
  public constructor(
    private readonly dependencies: Pick<
      DefaultMailServiceDependencies,
      'registry' | 'listProviderConfigs'
    >,
  ) {}

  public listProviders(): Promise<readonly MailProviderView[]> {
    const registry = this.dependencies.registry;
    const listConfigs = this.dependencies.listProviderConfigs;
    if (!registry || !listConfigs) return Promise.resolve([]);
    return Promise.resolve().then(() => {
      const configuredTypes = new Set<string>();
      const providers = listConfigs().flatMap((config) => {
        configuredTypes.add(config.type);
        const definition = registry.definition(config.type);
        if (!definition || config.enabled === false) return [];
        try {
          return [
            {
              type: definition.type,
              name: config.name,
              label: definition.label,
              capabilities: definition.capabilities,
              ...(definition.connection
                ? { connection: 'credentials' as const }
                : definition.authorization
                  ? { connection: 'oauth' as const }
                  : {}),
              configured: true,
            },
          ];
        } catch {
          return [];
        }
      });
      for (const definition of registry.definitions()) {
        if (configuredTypes.has(definition.type)) continue;
        providers.push({
          type: definition.type,
          name: definition.type,
          label: definition.label,
          capabilities: definition.capabilities,
          ...(definition.connection
            ? { connection: 'credentials' as const }
            : definition.authorization
              ? { connection: 'oauth' as const }
              : {}),
          configured: false,
        });
      }
      return providers;
    });
  }
}
