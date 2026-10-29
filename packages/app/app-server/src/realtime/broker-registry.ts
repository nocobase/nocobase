import {
  createInMemoryBroker,
  type RealtimeBroker,
  type RealtimeServiceOptions,
} from '@nocobase/realtime/server';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface RealtimeBrokerFactoryContext {
  readonly namespace: string;
  readonly config: Readonly<Record<string, unknown>>;
  readonly logger?: RealtimeServiceOptions['logger'];
}

export type RealtimeBrokerFactory = (
  context: RealtimeBrokerFactoryContext,
) => RealtimeBroker;

export interface RealtimeBrokerRegistry {
  register(adapter: string, factory: RealtimeBrokerFactory): void;
  create(
    adapter: string,
    context: RealtimeBrokerFactoryContext,
  ): RealtimeBroker;
}

/** One application, one selection. Resource ownership stays with RealtimeService. */
export function createRealtimeBrokerRegistry(): RealtimeBrokerRegistry {
  const factories = new Map<string, RealtimeBrokerFactory>([
    ['inMemory', () => createInMemoryBroker()],
  ]);
  let selected = false;
  function validate(adapter: string): void {
    if (typeof adapter !== 'string' || !adapter.trim())
      throw new TypeError('Realtime adapter must be a non-empty string.');
  }
  return {
    register(adapter, factory) {
      validate(adapter);
      if (selected)
        throw new Error(
          `Realtime broker registration is too late for "${adapter}"; register factories before resolving realtimeServiceToken.`,
        );
      if (factories.has(adapter))
        throw new Error(`Realtime broker "${adapter}" is already registered.`);
      if (typeof factory !== 'function')
        throw new TypeError('Realtime broker factory must be a function.');
      factories.set(adapter, factory);
    },
    create(adapter, context) {
      validate(adapter);
      if (selected)
        throw new Error('Realtime broker has already been selected.');
      selected = true;
      const factory = factories.get(adapter);
      if (!factory)
        throw new Error(
          `Realtime broker "${adapter}" is not registered. Install its implementation and register its Server plugin before resolving realtimeServiceToken.`,
        );
      return factory(context);
    },
  };
}

export const realtimeBrokerRegistryToken: ServiceToken<RealtimeBrokerRegistry> =
  createServiceToken<RealtimeBrokerRegistry>(
    '@nocobase/app-server/realtime/broker-registry',
  );
