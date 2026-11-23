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
  /** Complete service configuration; implementation options live under config.broker. */
  readonly config: Readonly<Record<string, unknown>>;
  readonly logger?: RealtimeServiceOptions['logger'];
}

export type RealtimeBrokerFactory = (
  context: RealtimeBrokerFactoryContext,
) => RealtimeBroker;

export interface RealtimeBrokerRegisterOptions {
  /**
   * `local` delivers events within this process only, `shared` through a broker every instance reaches. Left out, the
   * broker is reported as `unknown`.
   */
  readonly sharing?: 'local' | 'shared';
}

/** The broker this application selected, by adapter name only; never its options. */
export interface RealtimeBrokerDescription {
  /** The configured `realtime.broker.adapter`; `null` when no broker is configured and in-memory delivery runs. */
  readonly default: string | null;
  readonly adapter: string;
  readonly sharing: 'local' | 'shared' | 'unknown';
  readonly registered: boolean;
}

export interface RealtimeBrokerRegistry {
  register(
    adapter: string,
    factory: RealtimeBrokerFactory,
    options?: RealtimeBrokerRegisterOptions,
  ): void;
  create(
    adapter: string,
    context: RealtimeBrokerFactoryContext,
  ): RealtimeBroker;
  /**
   * The selected broker once the realtime service exists, or what would be selected from `config` before. Optional
   * so that test doubles need not implement it.
   */
  describe?(
    config?: Readonly<Record<string, unknown>>,
  ): RealtimeBrokerDescription;
}

/** One application, one selection. Resource ownership stays with RealtimeService. */
export function createRealtimeBrokerRegistry(): RealtimeBrokerRegistry {
  const factories = new Map<string, RealtimeBrokerFactory>([
    ['inMemory', () => createInMemoryBroker()],
  ]);
  const sharing = new Map<string, 'local' | 'shared'>([['inMemory', 'local']]);
  let selected = false;
  let selection: { adapter: string; configured: boolean } | undefined;
  function validate(adapter: string): void {
    if (typeof adapter !== 'string' || !adapter.trim())
      throw new TypeError('Realtime adapter must be a non-empty string.');
  }
  return {
    register(adapter, factory, options = {}) {
      validate(adapter);
      if (selected)
        throw new Error(
          `Realtime broker registration is too late for "${adapter}"; register factories before resolving realtimeServiceToken.`,
        );
      if (factories.has(adapter))
        throw new Error(`Realtime broker "${adapter}" is already registered.`);
      if (typeof factory !== 'function')
        throw new TypeError('Realtime broker factory must be a function.');
      if (
        options.sharing !== undefined &&
        options.sharing !== 'local' &&
        options.sharing !== 'shared'
      )
        throw new TypeError(
          `Realtime broker "${adapter}" declares an unknown sharing "${String(options.sharing)}".`,
        );
      factories.set(adapter, factory);
      if (options.sharing) sharing.set(adapter, options.sharing);
    },
    create(adapter, context) {
      validate(adapter);
      if (selected)
        throw new Error('Realtime broker has already been selected.');
      selected = true;
      selection = {
        adapter,
        configured: isRecord(context.config.broker),
      };
      const factory = factories.get(adapter);
      if (!factory)
        throw new Error(
          'realtime.broker.adapter is not registered. Install its implementation and register its Server plugin before resolving realtimeServiceToken.',
        );
      return factory(context);
    },
    describe(config) {
      const broker = config?.broker;
      const current = selection ?? {
        adapter:
          isRecord(broker) && typeof broker.adapter === 'string'
            ? broker.adapter
            : 'inMemory',
        configured: isRecord(broker),
      };
      return {
        default: current.configured ? current.adapter : null,
        adapter: current.adapter,
        sharing: sharing.get(current.adapter) ?? 'unknown',
        registered: factories.has(current.adapter),
      };
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const realtimeBrokerRegistryToken: ServiceToken<RealtimeBrokerRegistry> =
  createServiceToken<RealtimeBrokerRegistry>(
    '@nocobase/app-server/realtime/broker-registry',
  );
