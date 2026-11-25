import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Context } from 'hono';

import type { AppPaths } from '../config/paths.js';
import {
  auditDefaults,
  isAuditName,
  validateAuditConfig,
  type AuditConfig,
} from './config.js';
import type { AuditActor, AuditEvent } from './index.js';

export interface AuditTransportContext {
  readonly name: string;
  readonly paths: AppPaths;
}

export interface AuditTransport {
  /** Honor cancellation and settle the write when it is finished. */
  write(
    event: AuditEvent,
    options: { readonly signal: AbortSignal },
  ): void | Promise<void>;
  close?(): void | Promise<void>;
}

export interface AuditTransportDriver {
  readonly name: string;
  createTransport(
    options: Readonly<Record<string, unknown>>,
    context: AuditTransportContext,
  ): AuditTransport;
}

/** Classify a session already selected by the authentication middleware. */
export type AuditActorResolver = (context: Context) => AuditActor | undefined;

export interface AuditService {
  registerDriver(driver: AuditTransportDriver): void;
  registerActorResolver(resolver: AuditActorResolver): void;
}

export const auditServiceToken: ServiceToken<AuditService> =
  createServiceToken<AuditService>('@nocobase/app-server/audit');

type Report = (message: string, destination?: string) => void;

interface Destination {
  readonly name: string;
  readonly transport: AuditTransport;
  readonly pending: Map<AbortController, Promise<void>>;
}

const deliveryTimeout = 1_000;
const maxPendingPerDestination = 64;

export class AuditCoordinator implements AuditService {
  private readonly drivers = new Map<string, AuditTransportDriver>();
  private readonly actorResolvers: AuditActorResolver[] = [];
  private readonly destinations: Destination[] = [];
  private started = false;
  private closed = false;

  constructor(private readonly report: Report) {}

  registerDriver(driver: AuditTransportDriver): void {
    if (this.started)
      throw new Error('Register audit drivers before routes are installed.');
    if (
      !isAuditName(driver.name) ||
      typeof driver.createTransport !== 'function'
    )
      throw new Error('An audit driver requires a valid name and a factory.');
    if (this.drivers.has(driver.name))
      throw new Error(`Audit driver "${driver.name}" is already registered.`);
    this.drivers.set(driver.name, driver);
  }

  registerActorResolver(resolver: AuditActorResolver): void {
    this.actorResolvers.push(resolver);
  }

  resolveActor(context: Context): AuditActor | undefined {
    for (const resolve of this.actorResolvers) {
      const actor = resolve(context);
      if (actor) return actor;
    }
    return undefined;
  }

  async start(
    config: AuditConfig | undefined,
    paths: AppPaths,
  ): Promise<boolean> {
    this.started = true;
    if (config === undefined) return false;
    validateAuditConfig(config, (path, message) => {
      throw new Error(`audit${path ? `.${path}` : ''} ${message}`);
    });
    if (!(config.enabled ?? auditDefaults.enabled)) return false;
    const definitions = Object.entries(config.transports ?? {});
    for (const [name, definition] of definitions) {
      if (!this.drivers.has(definition.driver))
        throw new Error(
          `Audit destination "${name}" uses unregistered driver "${definition.driver}".`,
        );
    }
    try {
      for (const [name, definition] of definitions) {
        const driver = this.drivers.get(definition.driver)!;
        try {
          const transport = driver.createTransport(definition.options ?? {}, {
            name,
            paths,
          });
          if (!transport || typeof transport.write !== 'function')
            throw new Error();
          this.destinations.push({ name, transport, pending: new Map() });
        } catch {
          throw new Error(
            `Invalid configuration for audit destination "${name}" (driver "${driver.name}").`,
          );
        }
      }
    } catch (error) {
      await this.close();
      throw error;
    }
    return this.destinations.length > 0;
  }

  async record(event: AuditEvent): Promise<void> {
    if (this.closed) return;
    await Promise.all(
      this.destinations.map((destination) => this.deliver(destination, event)),
    );
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Promise.all(
      this.destinations.map(async ({ name, transport, pending }) => {
        for (const controller of pending.keys()) controller.abort();
        await this.withDeadline(Promise.allSettled(pending.values()), () =>
          this.report('Audit writes did not settle during shutdown.', name),
        );
        await this.withDeadline(
          Promise.resolve()
            .then(() => transport.close?.())
            .catch(() => {
              this.report('Could not close audit destination.', name);
            }),
          () => this.report('Audit destination shutdown timed out.', name),
        );
      }),
    );
    this.destinations.length = 0;
  }

  private async deliver(
    destination: Destination,
    event: AuditEvent,
  ): Promise<void> {
    const { transport, pending, name } = destination;
    if (pending.size >= maxPendingPerDestination) {
      this.report('Audit destination has too many pending writes.', name);
      return;
    }
    const controller = new AbortController();
    const write = Promise.resolve()
      .then(() =>
        transport.write(structuredClone(event), { signal: controller.signal }),
      )
      .catch(() => {
        if (!controller.signal.aborted)
          this.report('Could not write audit event.', name);
      })
      .finally(() => pending.delete(controller));
    pending.set(controller, write);
    await this.withDeadline(write, () => {
      controller.abort();
      this.report('Audit destination write timed out.', name);
    });
  }

  private async withDeadline(
    operation: Promise<unknown>,
    onTimeout: () => void,
  ): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        operation,
        new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            resolve();
            onTimeout();
          }, deliveryTimeout);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
