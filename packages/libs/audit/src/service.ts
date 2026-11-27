import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Context } from 'hono';

import {
  auditDefaults,
  isAuditName,
  validateAuditConfig,
  type AuditConfig,
} from './config.js';
import { fileAuditDriver } from './file-transport.js';
import type { AuditActor, AuditTransportEvent } from './index.js';
import { copyAuditRedactRules, type AuditRedactRule } from './redact.js';

export interface AuditTransportContext {
  readonly name: string;
  readonly paths: { readonly storageDir: string };
}

export interface AuditTransport {
  /** Honor cancellation and settle the write when it is finished. */
  write: (
    event: AuditTransportEvent,
    options: { readonly signal: AbortSignal },
  ) => void | Promise<void>;
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

export interface AuditCapturePolicy {
  readonly recordExports: boolean;
  readonly captureBody: boolean;
  readonly redact: readonly AuditRedactRule[];
}

/** Read the committed policy for this application and honor cancellation where supported. */
export type AuditCapturePolicyProvider = (
  signal: AbortSignal,
) => Promise<AuditCapturePolicy>;

export interface AuditService {
  registerDriver(driver: AuditTransportDriver): void;
  registerActorResolver(resolver: AuditActorResolver): void;
  registerCapturePolicyProvider(provider: AuditCapturePolicyProvider): void;
}

export const auditServiceToken: ServiceToken<AuditService> =
  createServiceToken<AuditService>('@nocobase/audit');

type Report = (message: string, destination?: string) => void;

interface Destination {
  readonly name: string;
  readonly transport: AuditTransport;
  readonly pending: Map<AbortController, Promise<void>>;
}

const deliveryTimeout = 1_000;
const maxPendingPerDestination = 64;
const policyReadTimeout = 100;
const maxPendingPolicyReads = 16;
const policyWarningInterval = 60_000;

export class AuditCoordinator implements AuditService {
  private readonly drivers = new Map<string, AuditTransportDriver>([
    [fileAuditDriver.name, fileAuditDriver],
  ]);
  private readonly actorResolvers: AuditActorResolver[] = [];
  private readonly destinations: Destination[] = [];
  private readonly pendingPolicyReads = new Set<AbortController>();
  private capturePolicyProvider?: AuditCapturePolicyProvider;
  private nextPolicyWarning = 0;
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

  registerCapturePolicyProvider(provider: AuditCapturePolicyProvider): void {
    if (this.started)
      throw new Error(
        'Register the audit capture policy provider before routes are installed.',
      );
    if (this.capturePolicyProvider)
      throw new Error(
        'An audit capture policy provider is already registered.',
      );
    this.capturePolicyProvider = provider;
  }

  /** Undefined uses built-in defaults. False selects outcome-only capture. */
  readCapturePolicy(): Promise<AuditCapturePolicy | false> | undefined {
    const provider = this.capturePolicyProvider;
    if (!provider) return undefined;
    if (this.closed) return Promise.resolve(false);
    const pending = this.pendingPolicyReads;
    if (pending.size >= maxPendingPolicyReads) {
      this.reportPolicyFailure(
        'Too many audit capture policy reads are pending.',
      );
      return Promise.resolve(false);
    }
    const controller = new AbortController();
    pending.add(controller);
    const read = Promise.resolve()
      .then(() => provider(controller.signal))
      .then(({ recordExports, captureBody, redact }) => {
        controller.signal.throwIfAborted();
        if (
          typeof recordExports !== 'boolean' ||
          typeof captureBody !== 'boolean'
        )
          throw new TypeError('Invalid audit capture policy flags.');
        return {
          recordExports,
          captureBody,
          redact: copyAuditRedactRules(redact),
        };
      })
      .catch(() => {
        if (!controller.signal.aborted)
          this.reportPolicyFailure('Could not read the audit capture policy.');
        return false as const;
      })
      // A provider that ignores cancellation still occupies a slot until it settles.
      .finally(() => pending.delete(controller));
    return this.withDeadline(
      read,
      () => {
        controller.abort();
        this.reportPolicyFailure('The audit capture policy read timed out.');
      },
      policyReadTimeout,
    ).then((policy) => policy ?? false);
  }

  private reportPolicyFailure(message: string): void {
    const now = Date.now();
    if (now < this.nextPolicyWarning) return;
    this.nextPolicyWarning = now + policyWarningInterval;
    try {
      this.report(message);
    } catch {
      // A logging failure must not prevent the request handler from running.
    }
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
    paths: AuditTransportContext['paths'],
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

  async record(event: AuditTransportEvent): Promise<void> {
    if (this.closed) return;
    await Promise.all(
      this.destinations.map((destination) => this.deliver(destination, event)),
    );
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const controller of this.pendingPolicyReads) controller.abort();
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
    event: AuditTransportEvent,
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

  private async withDeadline<T>(
    operation: Promise<T>,
    onTimeout: () => void,
    timeout: number = deliveryTimeout,
  ): Promise<T | undefined> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<undefined>((resolve) => {
          timer = setTimeout(() => {
            resolve(undefined);
            onTimeout();
          }, timeout);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
