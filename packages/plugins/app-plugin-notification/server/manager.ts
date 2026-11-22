import { resolveChannelType } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { randomUUID } from 'node:crypto';
import { legacyChannelConfig } from './channel-type-adapter.js';

import { Hono } from 'hono';

import {
  ChannelManager,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_RETRY_INTERVAL_MS,
} from './channel-manager.js';
import { createDeliveryJob, type DeliveryJobClass } from './delivery-job.js';
import {
  notificationRequestFingerprint,
  notifyRequestFingerprint,
  validateNotificationIdempotencyKey,
} from './idempotency.js';
import { notificationUserLocalesToken } from './tokens.js';
import type { NotificationContent } from './channel-type.js';
import type {
  NotificationPreferenceChange,
  NotificationPreferencesView,
} from '../shared/preferences.js';
import { NotificationLogs } from './logs.js';
import type { NotificationKindRuntime } from './templates.js';
import type { NotificationTemplateContent } from '../shared/templates.js';
import {
  DatabaseNotificationPreferenceStore,
  type NotificationPreferenceStore,
} from './preferences.js';
import { NotificationReconcileJob } from './notification-reconcile-job.js';
import {
  createNotificationRegistry,
  type NotificationRegistry,
} from './registry.js';
import { createNotificationRouter } from './router.js';
import {
  createDatabaseNotificationStore,
  summarizeNotificationDeliveries,
  type NotificationDeliveryRecord,
  type NotificationErrorRecord,
  type NotificationLogRecord,
  type NotificationLogStatus,
  type NotificationRetryResolutionRecord,
  type NotificationStore,
} from './store.js';
import type {
  NotificationDeliveryStatusSnapshot,
  NotificationI18nText,
  NotificationManagerOptions,
  NotificationNotifyInput,
  NotificationNotifyResult,
  NotificationProviderIdentity,
  NotificationRetryDeliveryInput,
  NotificationSendInput,
  NotificationSendResult,
  NotificationStatusChangedEvent,
  NotificationStatusChangedFilter,
  NotificationStatusChangedListener,
  NotificationStatusSnapshot,
  ProviderSendResult,
} from './types.js';

/** A configured channel as the settings page lists it. Never carries configuration values beyond the summary. */
export interface NotificationChannelView {
  readonly name: string;
  readonly type: string;
  /** The message family `notify()` and preferences use: `in-app`, `email`, `web-push`, `im`. */
  readonly channelType: string;
  readonly typeLabel?: string | NotificationI18nText;
  readonly contributor?: string;
  readonly enabled: boolean;
  readonly summary: readonly {
    readonly label: string | NotificationI18nText;
    readonly value: string;
  }[];
  /** Whether a test send can reach it: the type composes a message, and reaches users or a fixed group. */
  readonly testable: boolean;
  /** Whether `notify()` can reach users through it. */
  readonly reachesUsers: boolean;
  /** Deliveries in the last 24 hours, by outcome. */
  readonly last24h: {
    readonly accepted: number;
    readonly failed: number;
    readonly pending: number;
    readonly unknown: number;
  };
}

export interface NotificationDeliverySettingsView {
  readonly retry: {
    readonly maxAttempts: number;
    readonly intervalMs: number;
    readonly configured: boolean;
  };
  /** The `jobs` configuration deliveries run on; `undefined` follows `jobs.default`. */
  readonly jobs?: string;
}

/** Why a channel test could not be sent. */
export class NotificationChannelTestError extends Error {
  constructor(
    readonly code:
      | 'NOTIFICATION_CHANNEL_NOT_FOUND'
      | 'NOTIFICATION_CHANNEL_TEST_UNSUPPORTED'
      | 'NOTIFICATION_CHANNEL_NO_RECIPIENT',
    message: string,
  ) {
    super(message);
    this.name = 'NotificationChannelTestError';
  }
}

/** A preference change names a kind or channel type that cannot be chosen. */
export class NotificationPreferenceError extends Error {
  constructor(
    readonly code:
      'NOTIFICATION_PREFERENCE_UNKNOWN' | 'NOTIFICATION_PREFERENCE_REQUIRED',
    readonly index: number,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationPreferenceError';
  }
}

export class NotificationKindNotFoundError extends Error {
  readonly code = 'NOTIFICATION_KIND_NOT_FOUND';
  constructor(readonly kind: string) {
    super(`Notification kind "${kind}" is not registered.`);
    this.name = 'NotificationKindNotFoundError';
  }
}

interface ExpandedRecipientTarget {
  readonly channel: string;
  readonly provider: NotificationProviderIdentity;
  readonly recipient: object;
  /** The validated message this recipient receives; `notify()` gives each language its own. */
  readonly message: object;
  readonly error?: NotificationErrorRecord;
}

interface ExpandedRecipient {
  readonly channels: readonly ExpandedRecipientTarget[];
}

interface StatusSubscription {
  readonly filter: NotificationStatusChangedFilter;
  readonly listener: NotificationStatusChangedListener;
  lastDeliveredSequence: number;
}

const MAX_RETRY_TIMER_MS = 2_147_483_647;

export class NotificationIdempotencyConflictError extends Error {
  readonly code = 'IDEMPOTENCY_KEY_CONFLICT';
  constructor(readonly idempotencyKey: string) {
    super(
      `Notification idempotency key "${idempotencyKey}" was already used with a different request.`,
    );
    this.name = 'NotificationIdempotencyConflictError';
  }
}

/**
 * A Channel cannot reach its transport: it is not enabled, its Provider changed or is not registered, or creating the
 * Channel or Provider runtime failed (an SMTP transport that cannot be built, for example).
 */
export class NotificationTransportUnavailableError extends Error {
  readonly code = 'NOTIFICATION_TRANSPORT_UNAVAILABLE';
  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = 'NotificationTransportUnavailableError';
  }
}

export class NotificationDeliveryRetryError extends Error {
  readonly code = 'NOTIFICATION_DELIVERY_RETRY_NOT_ALLOWED';
  constructor(
    readonly deliveryId: string,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationDeliveryRetryError';
  }
}

export class NotificationManager<
  TChannels extends {
    readonly [
      TType in keyof TChannels
    ]: import('./types.js').NotificationChannelSchema;
  },
> {
  readonly router: Hono;
  readonly logs: NotificationLogs;
  readonly store: NotificationStore;
  readonly registry: NotificationRegistry;
  readonly preferences: NotificationPreferenceStore;
  private readonly channelManager: ChannelManager;
  private readonly container: ServiceContainer;

  private readonly deliveryJob: DeliveryJobClass;
  private readonly reconcileJob: NotificationReconcileJob;
  private readonly runtimePromises = new Map<string, Promise<void>>();
  private readonly retryTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly statusSubscriptions = new Map<string, StatusSubscription>();
  private nextStatusSequence = 0;
  private activated = false;
  private activation?: Promise<void>;
  private started = false;
  private startPromise?: Promise<void>;
  private closePromise?: Promise<void>;
  private readonly requests = new Set<Promise<unknown>>();

  constructor(private readonly options: NotificationManagerOptions<TChannels>) {
    this.container = options.container ?? new ServiceContainer();
    this.registry = options.registry ?? createNotificationRegistry();
    this.store =
      options.store ?? createDatabaseNotificationStore(options.database);
    this.logs = new NotificationLogs(this.store);
    this.preferences =
      options.preferences ??
      new DatabaseNotificationPreferenceStore(options.database);
    this.router = createNotificationRouter({ logs: this.logs });
    this.channelManager = new ChannelManager({
      logger: options.logger,
      store: this.store,
      leaseMs: options.leaseMs,
      providerTimeoutMs: options.providerTimeoutMs,
      retry: options.config.retry,
      resolveRuntime: async (type): Promise<void> => this.ensureRuntime(type),
      onDeliveryChanged: (delivery): void => {
        this.scheduleStatusChanged(delivery.notificationId);
        this.scheduleRetry(delivery);
      },
    });
    this.deliveryJob = createDeliveryJob(this.channelManager);
    this.reconcileJob = new NotificationReconcileJob({
      intervalMs: options.reconcileIntervalMs ?? 30_000,
      logger: options.logger,
      execute: async (): Promise<void> => this.reconcile(),
    });
  }

  async activate(): Promise<void> {
    this.registry.validate(this.options.config);
    if (
      !Object.values(this.options.config.channels).some(
        (config) => config.enabled !== false,
      )
    )
      return;
    this.activation ??= this.activateInternal().catch((error: unknown) => {
      this.activation = undefined;
      throw error;
    });
    await this.activation;
  }

  private async activateInternal(): Promise<void> {
    // Register before setup(): setup() starts consuming, and a Delivery task
    // left waiting by an earlier run must find its handler.
    this.options.executor.registerJob(this.deliveryJob);
    await this.options.executor.setup();
    this.activated = true;
    this.reconcileJob.start();
  }

  async start(): Promise<void> {
    if (this.started) return;
    if (this.startPromise) return this.startPromise;
    const operation = this.startInternal();
    this.startPromise = operation;
    try {
      await operation;
    } finally {
      if (this.startPromise === operation) this.startPromise = undefined;
    }
  }

  private async startInternal(): Promise<void> {
    this.registry.validate(this.options.config);
    const enabledConfigs = Object.entries(this.options.config.channels).filter(
      ([, config]) => config.enabled !== false,
    );
    this.options.logger.debug(
      {
        event: 'notification.manager.starting',
        enabledChannelCount: enabledConfigs.length,
      },
      'Starting Notification Manager.',
    );
    if (enabledConfigs.length === 0) {
      this.started = true;
      this.options.logger.info(
        {
          event: 'notification.manager.started',
          channelCount: 0,
          providerCount: 0,
          reconcileIntervalMs: this.options.reconcileIntervalMs ?? 30_000,
        },
        'Notification Manager started.',
      );
      return;
    }
    try {
      await this.activate();
      for (const [name] of enabledConfigs) await this.ensureRuntime(name);
      await this.reconcile();
      this.started = true;
      this.options.logger.info(
        {
          event: 'notification.manager.started',
          channelCount: enabledConfigs.length,
          providerCount: enabledConfigs.length,
          reconcileIntervalMs: this.options.reconcileIntervalMs ?? 30_000,
        },
        'Notification Manager started.',
      );
    } catch (error) {
      await this.reconcileJob.stop();
      this.started = false;
      await this.channelManager.close();
      this.runtimePromises.clear();
      this.activated = false;
      // The executor stays set up: a later start() activates again on it.
      this.activation = undefined;
      this.options.logger.error(
        { event: 'notification.manager.start_failed', err: error },
        'Failed to start Notification Manager.',
      );
      throw error;
    }
  }

  /** Credentials must never enter notification snapshots or persistent job payloads. */
  sendTransient(input: {
    readonly channel: string;
    readonly message: object;
  }): Promise<readonly ProviderSendResult[]> {
    return this.trackRequest(() => this.sendTransientInternal(input));
  }

  private async sendTransientInternal(input: {
    readonly channel: string;
    readonly message: object;
  }): Promise<readonly ProviderSendResult[]> {
    await this.activate();
    await this.ensureRuntime(input.channel);
    return this.channelManager.sendTransient(input.channel, input.message);
  }

  send(
    input: NotificationSendInput<TChannels>,
  ): Promise<NotificationSendResult> {
    return this.trackRequest(() => this.sendInternal(input));
  }

  private trackRequest<T>(run: () => Promise<T>): Promise<T> {
    if (this.closePromise)
      return Promise.reject(
        new NotificationTransportUnavailableError(
          'Notification runtime is closing.',
        ),
      );
    const request = run();
    this.requests.add(request);
    const remove = (): void => {
      this.requests.delete(request);
    };
    request.then(remove, remove);
    return request;
  }

  private async sendInternal(
    input: NotificationSendInput<TChannels>,
  ): Promise<NotificationSendResult> {
    await this.activate();
    validateNotificationIdempotencyKey(input.idempotencyKey);
    if (
      input.source !== undefined &&
      (!input.source ||
        typeof input.source.type !== 'string' ||
        !input.source.type.trim() ||
        (input.source.referenceId !== undefined &&
          typeof input.source.referenceId !== 'string'))
    )
      throw new Error(
        'Notification source requires a type and an optional string referenceId.',
      );
    if (
      !input.messages ||
      typeof input.messages !== 'object' ||
      Array.isArray(input.messages)
    )
      throw new Error(
        'Notification messages must be a Channel-to-message map.',
      );
    if (
      input.kind !== undefined &&
      (typeof input.kind !== 'string' ||
        !input.kind.trim() ||
        input.kind.length > 200)
    )
      throw new Error('Notification kind must be a non-empty string.');
    for (const key of [
      'to',
      'channels',
      'content',
      'routing',
      'channelOverrides',
    ])
      if (key in input)
        throw new Error(`Unsupported notification send property "${key}".`);
    const channels = Object.keys(input.messages) as (keyof TChannels &
      string)[];
    if (channels.length === 0)
      throw new Error('At least one notification message is required.');
    const message: Record<string, object> = {};
    const expandedRecipients: ExpandedRecipient[] = [];
    for (const channel of channels) {
      const validated = await this.expandMessage(
        channel,
        input.messages[channel],
      );
      message[channel] = validated.message;
      expandedRecipients.push(...validated.recipients);
    }
    const requestFingerprint = notificationRequestFingerprint({
      ...input,
      messages: message,
    });
    const existing = await this.replayExisting(
      input.idempotencyKey,
      requestFingerprint,
    );
    if (existing) return existing;
    return this.sendExpanded({
      idempotencyKey: input.idempotencyKey,
      requestFingerprint,
      source: input.source,
      kind: input.kind,
      recipients: expandedRecipients,
    });
  }

  /** Validates one channel message and lists a delivery target per recipient, each carrying that message. */
  private async expandMessage(
    channel: string,
    value: unknown,
  ): Promise<{
    readonly message: object;
    readonly recipients: readonly ExpandedRecipient[];
  }> {
    await this.ensureRuntime(channel);
    const validated = this.channelManager.validateMessage(channel, value);
    const [provider] = this.channelManager.providerIdentities(channel);
    return {
      message: validated.message,
      recipients: validated.recipients.map((recipient) => ({
        channels: [
          { channel, provider, recipient, message: validated.message },
        ],
      })),
    };
  }

  /**
   * The earlier send under `idempotencyKey`, with its pending deliveries dispatched again, or `undefined` when there is
   * none. A different request under the same key is a conflict, never a silent duplicate.
   */
  private async replayExisting(
    idempotencyKey: string,
    requestFingerprint: string,
  ): Promise<NotificationSendResult | undefined> {
    const existing = await this.store.getLogByIdempotencyKey(idempotencyKey);
    if (!existing) return undefined;
    if (existing.requestFingerprint !== requestFingerprint) {
      throw new NotificationIdempotencyConflictError(idempotencyKey);
    }
    const existingDeliveries = await this.store.listDeliveries(existing.id);
    await Promise.all(
      existingDeliveries
        .filter((delivery) => delivery.status === 'pending')
        .map(async (delivery): Promise<void> => this.dispatch(delivery.id)),
    );
    const snapshot = await this.statusSnapshot(existing);
    return {
      notificationId: snapshot.notificationId,
      idempotencyKey,
      deduplicated: true,
      status: snapshot.status,
      deliveries: snapshot.deliveries,
    };
  }

  private async sendExpanded(input: {
    readonly idempotencyKey: string;
    readonly requestFingerprint: string;
    readonly source?: {
      readonly type: string;
      readonly referenceId?: string;
    };
    readonly kind?: string;
    readonly recipients: readonly ExpandedRecipient[];
  }): Promise<NotificationSendResult> {
    if (input.recipients.length === 0)
      throw new Error('At least one notification recipient is required.');
    const now = await this.store.now();
    const notificationId = randomUUID();
    const deliveries: NotificationDeliveryRecord[] = [];
    for (const recipient of input.recipients) {
      for (const target of recipient.channels) {
        const { message } = target;
        if (!this.channelManager.has(target.channel))
          throw new Error(
            `Notification Channel "${target.channel}" is not enabled.`,
          );
        deliveries.push({
          id: randomUUID(),
          notificationId,
          channelName: target.channel,
          channelType: this.channelManager.type(target.channel),
          recipientSnapshot: target.recipient,
          messageSnapshot: message,
          recipientKey: recipientKeyOf(
            target.recipient,
            target.channel,
            this.channelManager.recipientKey(target.channel, target.recipient),
          ),
          providerType: target.provider.type,
          attemptCount: 0,
          status: target.error ? 'failed' : 'pending',
          lastError: target.error,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    if (deliveries.length === 0)
      throw new Error(
        'At least one notification Channel delivery is required.',
      );
    const log: NotificationLogRecord = {
      id: notificationId,
      idempotencyKey: input.idempotencyKey,
      requestFingerprint: input.requestFingerprint,
      sourceType: input.source?.type ?? 'application',
      sourceReferenceId: input.source?.referenceId,
      ...(input.kind === undefined ? {} : { kind: input.kind }),
      messageSnapshot: Object.fromEntries(
        deliveries.map((delivery) => [
          delivery.channelName,
          delivery.messageSnapshot,
        ]),
      ),
      status: initialNotificationStatus(deliveries),
      createdAt: now,
      updatedAt: now,
    };
    const persisted = await this.store.createOrGetByIdempotency({
      log,
      deliveries,
    });
    if (persisted.outcome === 'conflict') {
      throw new NotificationIdempotencyConflictError(input.idempotencyKey);
    }
    const currentDeliveries = persisted.bundle.deliveries;
    if (persisted.outcome === 'created') {
      this.scheduleStatusChanged(persisted.bundle.log.id);
    }
    await Promise.all(
      currentDeliveries
        .filter((delivery) => delivery.status === 'pending')
        .map(async (delivery): Promise<void> => this.dispatch(delivery.id)),
    );
    this.options.logger.debug(
      {
        event: 'notification.queued',
        notificationId: persisted.bundle.log.id,
        sourceType: persisted.bundle.log.sourceType,
        deliveryCount: currentDeliveries.length,
        channels: [
          ...new Set(currentDeliveries.map((delivery) => delivery.channelName)),
        ],
        deduplicated: persisted.outcome === 'existing',
      },
      'Notification queued for delivery.',
    );
    const snapshot = await this.getNotification(persisted.bundle.log.id);
    if (!snapshot)
      throw new Error(
        'Persisted notification could not be read after creation.',
      );
    return {
      notificationId: snapshot.notificationId,
      idempotencyKey: input.idempotencyKey,
      deduplicated: persisted.outcome === 'existing',
      status: snapshot.status,
      deliveries: snapshot.deliveries,
    };
  }

  notify(
    kind: string,
    input: NotificationNotifyInput,
  ): Promise<NotificationNotifyResult> {
    return this.trackRequest(() => this.notifyInternal(kind, input));
  }

  private async notifyInternal(
    kindId: string,
    input: NotificationNotifyInput,
  ): Promise<NotificationNotifyResult> {
    await this.activate();
    const kind: NotificationKindRuntime | undefined =
      this.options.kinds?.kind(kindId);
    if (!kind) throw new NotificationKindNotFoundError(kindId);
    if (!Array.isArray(input?.to))
      throw new Error('Notification to must list application user ids.');
    const userIds: readonly string[] = [...new Set<string>(input.to)];
    if (
      userIds.some(
        (id) => typeof id !== 'string' || !id.trim() || id !== id.trim(),
      )
    )
      throw new Error('Notification to must list application user ids.');
    const idempotencyKey =
      input.idempotencyKey ?? `notify:${kindId}:${randomUUID()}`;
    validateNotificationIdempotencyKey(idempotencyKey);
    const source = input.source ?? {
      type: kind.view.contributor.slice(0, 100),
    };
    const requestFingerprint = notifyRequestFingerprint({
      kind: kindId,
      to: userIds,
      data: input.data,
      target: input.target,
      source,
    });
    // A repeat of the same request returns the first send as it is, whatever preferences and languages say now; another
    // request under the same key, including a direct send(), is a conflict.
    if (input.idempotencyKey !== undefined) {
      const existing = await this.replayExisting(
        idempotencyKey,
        requestFingerprint,
      );
      if (existing) return { kind: kindId, send: existing, skipped: [] };
    }
    const skipped: NotificationNotifyResult['skipped'][number][] = [];
    if (!userIds.length) return { kind: kindId, skipped };
    const adjustable = kind.policies.filter(({ adjustable }) => adjustable);
    const choices = new Map<string, boolean>();
    if (adjustable.length)
      for (const record of await this.preferences.listForKind(kindId, userIds))
        choices.set(
          `${record.userId}\u0000${record.channelType}`,
          record.enabled,
        );
    const content: Omit<NotificationContent, 'title' | 'body' | 'html'> = {
      kind: kindId,
      category: kind.view.categoryKey,
      ...(input.target === undefined ? {} : { target: input.target }),
      source,
      key: idempotencyKey,
    };
    const localeOf = await this.recipientLocales(kind, userIds);
    const renderings = new Map<string, Promise<NotificationTemplateContent>>();
    const render = (locale: string): Promise<NotificationTemplateContent> => {
      let rendering = renderings.get(locale);
      if (!rendering) {
        rendering = kind.render(locale, input.data ?? {});
        renderings.set(locale, rendering);
      }
      return rendering;
    };
    const recipients: ExpandedRecipient[] = [];
    for (const { type, policy } of kind.policies) {
      const receivers = userIds.filter((userId) => {
        if (policy === 'required') return true;
        const chosen = choices.get(`${userId}\u0000${type}`);
        const receives = chosen ?? policy === 'on';
        if (!receives)
          skipped.push({ userId, channelType: type, reason: 'preference' });
        return receives;
      });
      if (!receivers.length) continue;
      const channel = await this.userChannelOf(type);
      if (!channel) {
        for (const userId of receivers)
          skipped.push({ userId, channelType: type, reason: 'no_channel' });
        continue;
      }
      const resolved = await channel.audience.resolveUsers(receivers);
      // One message per language, each to the people who read that language.
      const byLocale = new Map<string, object[]>();
      for (const userId of receivers) {
        const found = resolved.get(userId) ?? [];
        if (!found.length) {
          skipped.push({ userId, channelType: type, reason: 'no_recipient' });
          continue;
        }
        const locale = localeOf(userId);
        byLocale.set(locale, [...(byLocale.get(locale) ?? []), ...found]);
      }
      for (const [locale, addressed] of byLocale) {
        const composed = channel.audience.compose(
          { ...content, ...(await render(locale)) },
          addressed,
        );
        recipients.push(
          ...(await this.expandMessage(channel.name, composed)).recipients,
        );
      }
    }
    if (!recipients.length) return { kind: kindId, skipped };
    const send = await this.sendExpanded({
      idempotencyKey,
      requestFingerprint,
      kind: kindId,
      source,
      recipients,
    });
    return { kind: kindId, send, skipped };
  }

  /**
   * The language each person receives `kind` in: their own when the kind offers it, otherwise the application's
   * default when offered, otherwise the kind's first. A kind with one combined message uses the default for everyone.
   */
  private async recipientLocales(
    kind: NotificationKindRuntime,
    userIds: readonly string[],
  ): Promise<(userId: string) => string> {
    const offered = kind.view.locales;
    const requestedDefault = this.options.defaultLocale?.() ?? 'en-US';
    const fallback = offered.includes(requestedDefault)
      ? requestedDefault
      : (offered[0] ?? requestedDefault);
    if (kind.view.localeMode === 'combined' || offered.length <= 1)
      return () => fallback;
    const container = this.options.container;
    const chosen: ReadonlyMap<string, string> = container?.has(
      notificationUserLocalesToken,
    )
      ? await container.resolve(notificationUserLocalesToken).resolve(userIds)
      : new Map();
    return (userId) => {
      const locale = chosen.get(userId);
      return locale !== undefined && offered.includes(locale)
        ? locale
        : fallback;
    };
  }

  /** The first enabled channel of `type` in configuration order that reaches users, with its runtime started. */
  private async userChannelOf(type: string): Promise<
    | {
        readonly name: string;
        readonly audience: Required<
          Pick<
            NonNullable<ReturnType<ChannelManager['audience']>>,
            'resolveUsers' | 'compose'
          >
        >;
      }
    | undefined
  > {
    for (const [name, config] of Object.entries(this.options.config.channels)) {
      if (config.enabled === false) continue;
      if (this.registry.describe(config)?.messageType !== type) continue;
      try {
        await this.ensureRuntime(name);
      } catch (error) {
        this.options.logger.warn(
          {
            event: 'notification.notify.channel_unavailable',
            err: error,
            channel: name,
          },
          'A notification channel is unavailable; notify() tries the next one of its type.',
        );
        continue;
      }
      const audience = this.channelManager.audience(name);
      if (audience?.resolveUsers && audience.compose)
        return {
          name,
          audience: {
            resolveUsers: audience.resolveUsers.bind(audience),
            compose: audience.compose.bind(audience),
          },
        };
    }
    return undefined;
  }

  /** Every configured channel, for the settings page: types, safe summaries and the last 24 hours of deliveries. */
  async channels(): Promise<readonly NotificationChannelView[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const counts = (await this.store.countDeliveriesByChannel?.(since)) ?? [];
    const views: NotificationChannelView[] = [];
    for (const [name, config] of Object.entries(this.options.config.channels)) {
      const described =
        config.enabled === false &&
        Reflect.get(config, 'type') === undefined &&
        Reflect.get(config, 'provider') === undefined
          ? undefined
          : this.registry.describe(config);
      const enabled = config.enabled !== false;
      let audience: ReturnType<ChannelManager['audience']>;
      if (enabled && described)
        try {
          await this.ensureRuntime(name);
          audience = this.channelManager.audience(name);
        } catch {
          audience = undefined;
        }
      const count = (statuses: readonly string[]): number =>
        counts
          .filter((item) => item.key === name && statuses.includes(item.status))
          .reduce((total, item) => total + item.count, 0);
      views.push({
        name,
        type: described?.type ?? 'unknown',
        channelType: described?.messageType ?? 'unknown',
        ...(described?.label === undefined
          ? {}
          : { typeLabel: described.label }),
        ...(described?.contributor
          ? { contributor: described.contributor }
          : {}),
        enabled,
        summary: described?.summary ?? [],
        testable: audience?.compose !== undefined,
        reachesUsers:
          audience?.compose !== undefined &&
          audience.resolveUsers !== undefined,
        last24h: {
          accepted: count(['accepted']),
          failed: count(['failed']),
          pending: count(['pending', 'preparing', 'submitting', 'retrying']),
          unknown: count(['unknown']),
        },
      });
    }
    return views;
  }

  /** Retry and job settings deliveries use, with their defaults filled in. */
  deliverySettings(): NotificationDeliverySettingsView {
    const retry = this.options.config.retry;
    return {
      retry: {
        maxAttempts: retry?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        intervalMs: retry?.intervalMs ?? DEFAULT_RETRY_INTERVAL_MS,
        configured:
          retry?.maxAttempts !== undefined || retry?.intervalMs !== undefined,
      },
      ...(this.options.config.jobs === undefined
        ? {}
        : { jobs: this.options.config.jobs }),
    };
  }

  /**
   * Sends a test through channel `name` to `userId` alone: to their inbox, account address or devices, or to the
   * channel's group when it reaches no users. The send is logged like any other.
   */
  testChannel(
    name: string,
    input: {
      readonly userId: string;
      readonly title: string;
      readonly body: string;
    },
  ): Promise<NotificationSendResult> {
    return this.trackRequest(async () => {
      const config = this.options.config.channels[name];
      if (!config || config.enabled === false)
        throw new NotificationChannelTestError(
          'NOTIFICATION_CHANNEL_NOT_FOUND',
          `Notification Channel "${name}" is not enabled.`,
        );
      await this.activate();
      await this.ensureRuntime(name);
      const audience = this.channelManager.audience(name);
      if (!audience?.compose)
        throw new NotificationChannelTestError(
          'NOTIFICATION_CHANNEL_TEST_UNSUPPORTED',
          `Notification Channel "${name}" cannot send a test message.`,
        );
      let recipients: readonly object[] = [];
      if (audience.resolveUsers) {
        recipients =
          (await audience.resolveUsers([input.userId])).get(input.userId) ?? [];
        if (!recipients.length)
          throw new NotificationChannelTestError(
            'NOTIFICATION_CHANNEL_NO_RECIPIENT',
            `Notification Channel "${name}" has no recipient for this user.`,
          );
      }
      const idempotencyKey = `notification.test:${randomUUID()}`;
      return this.sendInternal({
        idempotencyKey,
        source: { type: 'notification.test', referenceId: name },
        messages: {
          [name]: audience.compose(
            {
              // No category: a test is not a kind people choose, so the inbox lists it under All only.
              kind: 'notification.test',
              title: input.title,
              body: input.body,
              key: idempotencyKey,
            },
            recipients,
          ),
        } as NotificationSendInput<TChannels>['messages'],
      });
    });
  }

  /**
   * The kinds `userId` may receive with what they receive each on: a kind lists only channel types an enabled channel
   * can reach users on. Kinds without channel policies are left out.
   */
  async preferencesFor(userId: string): Promise<NotificationPreferencesView> {
    await this.activate();
    const reachable: string[] = [];
    for (const config of Object.values(this.options.config.channels)) {
      if (config.enabled === false) continue;
      const type = this.registry.describe(config)?.messageType;
      if (!type || reachable.includes(type)) continue;
      if (await this.userChannelOf(type)) reachable.push(type);
    }
    const choices = new Map(
      (await this.preferences.listForUser(userId)).map((record) => [
        `${record.kind}\u0000${record.channelType}`,
        record.enabled,
      ]),
    );
    const kinds = (this.options.kinds?.list() ?? []).flatMap((view) => {
      const channels = (view.policies ?? [])
        .filter(({ type }) => reachable.includes(type))
        .map(({ type, policy, adjustable }) => ({
          type,
          policy,
          adjustable,
          enabled:
            policy === 'required' ||
            (adjustable
              ? (choices.get(`${view.id}\u0000${type}`) ?? policy === 'on')
              : policy === 'on'),
        }));
      return channels.length
        ? [
            {
              id: view.id,
              contributor: view.contributor,
              name: view.name,
              category: view.category,
              categoryKey: view.categoryKey,
              channels,
            },
          ]
        : [];
    });
    return { channelTypes: reachable, kinds };
  }

  /** Records `userId`'s choices. Every change must name a kind's adjustable channel type, or nothing is saved. */
  async savePreferences(
    userId: string,
    changes: readonly NotificationPreferenceChange[],
  ): Promise<NotificationPreferencesView> {
    changes.forEach((change, index) => {
      const policy = this.options.kinds
        ?.kind(change.kind)
        ?.policies.find(({ type }) => type === change.channelType);
      if (!policy)
        throw new NotificationPreferenceError(
          'NOTIFICATION_PREFERENCE_UNKNOWN',
          index,
          `Notification kind "${change.kind}" has no channel type "${change.channelType}".`,
        );
      if (!policy.adjustable)
        throw new NotificationPreferenceError(
          'NOTIFICATION_PREFERENCE_REQUIRED',
          index,
          `Notification kind "${change.kind}" cannot be turned off or on for "${change.channelType}".`,
        );
    });
    await this.preferences.save(userId, changes);
    return this.preferencesFor(userId);
  }

  async getByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationStatusSnapshot | undefined> {
    validateNotificationIdempotencyKey(idempotencyKey);
    const log = await this.store.getLogByIdempotencyKey(idempotencyKey);
    return log ? this.statusSnapshot(log) : undefined;
  }

  async getNotification(
    notificationId: string,
  ): Promise<NotificationStatusSnapshot | undefined> {
    const log = await this.store.getLog(notificationId);
    return log ? this.statusSnapshot(log) : undefined;
  }

  onStatusChanged(
    filter: NotificationStatusChangedFilter,
    listener: NotificationStatusChangedListener,
  ): () => void {
    if (!filter.notificationId && !filter.idempotencyKey) {
      throw new Error(
        'Notification status subscription requires notificationId or idempotencyKey.',
      );
    }
    if (filter.idempotencyKey)
      validateNotificationIdempotencyKey(filter.idempotencyKey);
    const id = randomUUID();
    const sequence = this.issueStatusSequence();
    const subscription = {
      filter,
      listener,
      lastDeliveredSequence: sequence - 1,
    };
    this.statusSubscriptions.set(id, subscription);
    void this.emitCurrentStatus(id, subscription, sequence).catch(
      (error: unknown) => {
        this.options.logger.warn(
          { event: 'notification.status_initial_read_failed', err: error },
          'Failed to read initial notification status for a listener.',
        );
      },
    );
    return (): void => {
      this.statusSubscriptions.delete(id);
    };
  }

  retryDelivery(
    input: NotificationRetryDeliveryInput,
  ): Promise<NotificationDeliveryStatusSnapshot> {
    return this.trackRequest(() => this.retryDeliveryInternal(input));
  }

  private async retryDeliveryInternal(
    input: NotificationRetryDeliveryInput,
  ): Promise<NotificationDeliveryStatusSnapshot> {
    const reason = input.reason?.trim();
    if (!reason) {
      throw new NotificationDeliveryRetryError(
        input.deliveryId,
        'A retry reason is required.',
      );
    }
    const delivery = await this.store.getDelivery(input.deliveryId);
    if (!delivery) {
      throw new NotificationDeliveryRetryError(
        input.deliveryId,
        `Notification Delivery "${input.deliveryId}" was not found.`,
      );
    }
    await this.ensureRuntime(delivery.channelName);
    if (this.channelManager.type(delivery.channelName) !== delivery.channelType)
      throw new Error(
        `Notification Channel "${delivery.channelName}" type has changed.`,
      );
    if (delivery.status !== 'failed') {
      throw new NotificationDeliveryRetryError(
        delivery.id,
        'Only a failed Notification Delivery can be retried.',
      );
    }
    if (
      this.channelManager.providerIdentities(delivery.channelName)[0]?.type !==
      delivery.providerType
    )
      throw new NotificationDeliveryRetryError(
        delivery.id,
        'The original Notification Provider is unavailable.',
      );
    if (delivery.lastError?.code === 'RECIPIENT_UNSUPPORTED')
      throw new NotificationDeliveryRetryError(
        delivery.id,
        'An unsupported recipient must be corrected with a new logical send.',
      );
    const resolution: NotificationRetryResolutionRecord = {
      type: 'terminal_failure',
      reason,
      requestedAt: await this.store.now(),
    };
    const retried = await this.store.retryDelivery(delivery.id, resolution);
    if (!retried) {
      throw new NotificationDeliveryRetryError(
        delivery.id,
        'Notification Delivery changed while the retry was requested.',
      );
    }
    this.scheduleStatusChanged(retried.notificationId);
    await this.dispatch(retried.id);
    return this.deliverySnapshot(
      (await this.store.getDelivery(retried.id)) ?? retried,
    );
  }

  close(): Promise<void> {
    this.closePromise ??= this.closeInternal().finally(() => {
      this.closePromise = undefined;
    });
    return this.closePromise;
  }

  private async closeInternal(): Promise<void> {
    await Promise.allSettled([...this.requests]);
    await this.startPromise?.catch(() => undefined);
    const activation = this.activation;
    await activation?.catch(() => undefined);
    const wasActive = this.activated;
    this.activated = false;
    this.activation = undefined;
    this.clearRetryTimers();
    await this.reconcileJob.stop();
    // Running Deliveries finish before the Channels they send through close.
    if (activation) await this.options.executor.shutdown();
    await Promise.allSettled([...this.runtimePromises.values()]);
    await this.channelManager.close();
    this.runtimePromises.clear();
    this.started = false;
    this.statusSubscriptions.clear();
    if (wasActive) {
      this.options.logger.info(
        { event: 'notification.manager.closed' },
        'Notification Manager closed.',
      );
    }
  }

  private async dispatch(deliveryId: string): Promise<void> {
    try {
      await this.options.executor.addJob(new this.deliveryJob({ deliveryId }));
    } catch (error) {
      this.options.logger.warn(
        {
          event: 'notification.delivery.enqueue_failed',
          err: error,
          deliveryId,
        },
        'Failed to enqueue notification Delivery; reconciler will enqueue it later.',
      );
    }
  }

  private scheduleRetry(delivery: NotificationDeliveryRecord): void {
    const existing = this.retryTimers.get(delivery.id);
    if (existing) {
      clearTimeout(existing);
      this.retryTimers.delete(delivery.id);
    }
    if (
      !this.activated ||
      delivery.status !== 'retrying' ||
      !delivery.nextRunAt
    )
      return;
    const nextRunAt = Date.parse(delivery.nextRunAt);
    if (!Number.isFinite(nextRunAt)) return;
    const delay = Math.max(0, nextRunAt - Date.now());
    const timer = setTimeout(
      () => {
        this.retryTimers.delete(delivery.id);
        if (delay > MAX_RETRY_TIMER_MS) {
          void this.store.getDelivery(delivery.id).then((current) => {
            if (current) this.scheduleRetry(current);
          });
          return;
        }
        void this.dispatch(delivery.id);
      },
      Math.min(delay, MAX_RETRY_TIMER_MS),
    );
    timer.unref?.();
    this.retryTimers.set(delivery.id, timer);
  }

  private clearRetryTimers(): void {
    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    this.retryTimers.clear();
  }

  private async reconcile(): Promise<void> {
    const now = await this.store.now();
    const recovered = await this.store.recoverExpired(now);
    for (const delivery of recovered)
      this.scheduleStatusChanged(delivery.notificationId);
    const deliveries = await this.store.listReady(
      now,
      this.options.reconcileBatchSize ?? 100,
    );
    await Promise.all(
      deliveries.map(async (delivery): Promise<void> =>
        this.dispatch(delivery.id),
      ),
    );
    if (recovered.length > 0 || deliveries.length > 0) {
      this.options.logger.info(
        {
          event: 'notification.reconciled',
          recoveredDeliveryCount: recovered.length,
          pendingDeliveryCount: deliveries.length,
        },
        'Notification deliveries reconciled.',
      );
    }
  }

  private async statusSnapshot(
    log: NotificationLogRecord,
  ): Promise<NotificationStatusSnapshot> {
    const deliveries = await this.store.listDeliveries(log.id);
    const snapshots = await Promise.all(
      deliveries.map(async (delivery) => this.deliverySnapshot(delivery)),
    );
    const summary = {
      total: snapshots.length,
      pending: snapshots.filter((item) => item.status === 'pending').length,
      processing: snapshots.filter((item) =>
        ['preparing', 'submitting'].includes(item.status),
      ).length,
      retrying: snapshots.filter((item) => item.status === 'retrying').length,
      accepted: snapshots.filter((item) => item.status === 'accepted').length,
      failed: snapshots.filter((item) => item.status === 'failed').length,
      unknown: snapshots.filter((item) => item.status === 'unknown').length,
    };
    const status = summarizeNotificationDeliveries(deliveries);
    const updatedAt = deliveries.reduce(
      (latest, delivery) =>
        delivery.updatedAt > latest ? delivery.updatedAt : latest,
      log.updatedAt,
    );
    return {
      notificationId: log.id,
      idempotencyKey: log.idempotencyKey,
      status,
      terminal: ['completed', 'partial', 'failed', 'unknown'].includes(status),
      requiresAction: summary.failed > 0 || summary.unknown > 0,
      updatedAt,
      summary,
      deliveries: snapshots,
    };
  }

  private async deliverySnapshot(
    delivery: NotificationDeliveryRecord,
  ): Promise<NotificationDeliveryStatusSnapshot> {
    return {
      id: delivery.id,
      channelName: delivery.channelName,
      channelType: delivery.channelType,
      provider: {
        type: delivery.providerType,
      },
      attemptCount: delivery.attemptCount,
      status: delivery.status,
      nextRunAt: delivery.nextRunAt,
      error: delivery.lastError,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }

  private async emitStatusChanged(
    notificationId: string,
    sequence: number,
  ): Promise<void> {
    if (this.statusSubscriptions.size === 0) return;
    const snapshot = await this.getNotification(notificationId);
    if (!snapshot?.idempotencyKey) return;
    const event: NotificationStatusChangedEvent = {
      ...snapshot,
      idempotencyKey: snapshot.idempotencyKey,
    };
    for (const subscription of this.statusSubscriptions.values()) {
      if (
        subscription.filter.notificationId &&
        subscription.filter.notificationId !== event.notificationId
      )
        continue;
      if (
        subscription.filter.idempotencyKey &&
        subscription.filter.idempotencyKey !== event.idempotencyKey
      )
        continue;
      this.notifySubscription(subscription, event, sequence);
    }
  }

  private scheduleStatusChanged(notificationId: string): void {
    const sequence = this.issueStatusSequence();
    void this.emitStatusChanged(notificationId, sequence).catch(
      (error: unknown) => {
        this.options.logger.warn(
          {
            event: 'notification.status_emit_failed',
            err: error,
            notificationId,
          },
          'Failed to emit a notification status change.',
        );
      },
    );
  }

  private async emitCurrentStatus(
    subscriptionId: string,
    subscription: StatusSubscription,
    sequence: number,
  ): Promise<void> {
    const snapshot = subscription.filter.notificationId
      ? await this.getNotification(subscription.filter.notificationId)
      : await this.getByIdempotencyKey(subscription.filter.idempotencyKey!);
    if (
      !snapshot?.idempotencyKey ||
      this.statusSubscriptions.get(subscriptionId) !== subscription
    )
      return;
    this.notifySubscription(
      subscription,
      {
        ...snapshot,
        idempotencyKey: snapshot.idempotencyKey,
      },
      sequence,
    );
  }

  private notifySubscription(
    subscription: StatusSubscription,
    event: NotificationStatusChangedEvent,
    sequence: number,
  ): void {
    if (sequence <= subscription.lastDeliveredSequence) return;
    subscription.lastDeliveredSequence = sequence;
    void Promise.resolve()
      .then(() => subscription.listener(event))
      .catch((error: unknown) => {
        this.options.logger.warn(
          {
            event: 'notification.status_listener_failed',
            err: error,
            notificationId: event.notificationId,
          },
          'Notification status listener failed.',
        );
      });
  }

  private issueStatusSequence(): number {
    this.nextStatusSequence += 1;
    return this.nextStatusSequence;
  }

  private ensureRuntime(type: string): Promise<void> {
    const config = this.options.config.channels[type];
    if (!config || config.enabled === false)
      return Promise.reject(
        new NotificationTransportUnavailableError(
          `Notification Channel "${type}" is not enabled.`,
        ),
      );
    if (this.channelManager.has(type)) {
      if (
        this.channelManager.providerIdentities(type)[0]?.type !==
        resolveChannelType(config)
      )
        return Promise.reject(
          new NotificationTransportUnavailableError(
            `Notification Channel "${type}" Provider has changed; restart the runtime.`,
          ),
        );
      return Promise.resolve();
    }
    const existing = this.runtimePromises.get(type);
    if (existing) return existing;
    const operation = this.createRuntime(type).catch((error: unknown) => {
      throw error instanceof NotificationTransportUnavailableError
        ? error
        : // Keep the original message: a failed delivery records it as the reason the Channel was unavailable.
          new NotificationTransportUnavailableError(
            error instanceof Error ? error.message : String(error),
            { cause: error },
          );
    });
    this.runtimePromises.set(type, operation);
    operation.catch(() => {
      if (this.runtimePromises.get(type) === operation) {
        this.runtimePromises.delete(type);
      }
    });
    return operation;
  }

  private async createRuntime(name: string): Promise<void> {
    const config = this.options.config.channels[name];
    if (!config || config.enabled === false)
      throw new NotificationTransportUnavailableError(
        `Notification Channel "${name}" is not enabled.`,
      );
    const type = resolveChannelType(config);
    const registered = this.registry.channelType(type);
    if (registered) {
      const runtime = await registered.create(
        { channelName: name, container: this.container },
        config,
      );
      this.channelManager.register(name, runtime);
      return;
    }
    const legacyConfig = legacyChannelConfig(config);
    const providerDefinition = this.registry.provider(type);
    const definition =
      providerDefinition &&
      this.registry.channel(providerDefinition.messageType);
    if (!providerDefinition || !definition)
      throw new NotificationTransportUnavailableError(
        `Notification Channel type "${type}" is unavailable.`,
      );
    const channel = await definition.createChannel(
      { logger: this.options.logger },
      legacyConfig,
    );
    const provider = await providerDefinition.createProvider(
      { logger: this.options.logger, now: () => this.store.now() },
      legacyConfig,
    );
    if (provider.type !== type) {
      await provider.close?.();
      throw new Error(
        'Notification Provider runtime type must match its definition.',
      );
    }
    this.channelManager.register(name, {
      channel,
      provider: {
        type: provider.type,
        capabilities: provider.capabilities ?? providerDefinition.capabilities,
        send: (input) => provider.send(input),
        close: provider.close ? () => provider.close!() : undefined,
      },
    });
  }
}

/** What the delivery log searches a delivery by: the recipient's user id, address or device, else the channel. */
function recipientKeyOf(
  recipient: object,
  channel: string,
  own?: string,
): string {
  if (typeof own === 'string' && own) return own.slice(0, 191);
  for (const key of ['userId', 'address', 'email', 'id'])
    if (key in recipient) {
      const value: unknown = Reflect.get(recipient, key);
      if (typeof value === 'string' && value) return value.slice(0, 191);
    }
  return channel.slice(0, 191);
}

function initialNotificationStatus(
  deliveries: readonly NotificationDeliveryRecord[],
): NotificationLogStatus {
  if (deliveries.every((delivery) => delivery.status === 'failed'))
    return 'failed';
  if (deliveries.some((delivery) => delivery.status === 'failed'))
    return 'processing';
  return 'pending';
}

export function createNotificationManager<
  const TConfig extends Readonly<
    Record<string, import('./types.js').NotificationChannelConfigInput>
  >,
>(
  options: Omit<
    NotificationManagerOptions<
      import('./types.js').ConfiguredNotificationChannels<TConfig>
    >,
    'config'
  > & {
    readonly config: Omit<
      import('./types.js').NotificationConfigInput,
      'channels'
    > & { readonly channels: TConfig };
  },
): NotificationManager<
  import('./types.js').ConfiguredNotificationChannels<TConfig>
>;
export function createNotificationManager<
  TChannels extends {
    readonly [
      K in keyof TChannels
    ]: import('./types.js').NotificationChannelSchema;
  },
>(
  options: NotificationManagerOptions<TChannels>,
): NotificationManager<TChannels>;
export function createNotificationManager<
  TChannels extends {
    readonly [
      TType in keyof TChannels
    ]: import('./types.js').NotificationChannelSchema;
  },
>(
  options: NotificationManagerOptions<TChannels>,
): NotificationManager<TChannels> {
  return new NotificationManager(options);
}
