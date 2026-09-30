import { randomUUID } from 'node:crypto';

import { Hono } from 'hono';

import { ChannelManager } from './channel-manager.js';
import { createDeliveryJob, type DeliveryJobClass } from './delivery-job.js';
import { NotificationLogs } from './logs.js';
import { NotificationReconcileJob } from './notification-reconcile-job.js';
import {
  notificationRequestFingerprint,
  validateNotificationIdempotencyKey,
} from './idempotency.js';
import { notificationTestError } from './types.js';
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
  NotificationManagerOptions,
  NotificationProviderIdentity,
  NotificationRetryDeliveryInput,
  NotificationSendInput,
  NotificationSendResult,
  NotificationStatusChangedEvent,
  NotificationStatusChangedFilter,
  NotificationStatusChangedListener,
  NotificationStatusSnapshot,
  NotificationTestActor,
  NotificationTestSendRequest,
  NotificationTestTargetDescriptor,
} from './types.js';

interface ExpandedRecipientTarget {
  readonly channel: string;
  readonly provider: NotificationProviderIdentity;
  readonly recipient: object;
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
  private readonly channelManager: ChannelManager;

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

  constructor(private readonly options: NotificationManagerOptions<TChannels>) {
    this.registry = options.registry ?? createNotificationRegistry();
    this.store =
      options.store ?? createDatabaseNotificationStore(options.database);
    this.logs = new NotificationLogs(this.store);
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

  listTestTargets(): readonly NotificationTestTargetDescriptor[] {
    return this.registry.testTargets(this.options.config);
  }

  async sendTest(
    request: NotificationTestSendRequest,
    actor: NotificationTestActor,
  ): Promise<NotificationSendResult> {
    const target = this.resolveTestTarget(request);
    const channelConfig = this.options.config.channels[request.channel];
    const provider = this.registry.provider(channelConfig.provider);
    const definition = provider && this.registry.channel(provider.messageType);
    if (!definition?.test)
      throw new Error('Notification test target is unavailable.');
    const message = definition.test.toSendInput({
      actor,
      values: request.values,
      channelConfig,
    });
    return this.send({
      idempotencyKey: `notification-test:${randomUUID()}`,
      messages: {
        [target.channel.name]: message,
      } as NotificationSendInput<TChannels>['messages'],
      source: { type: 'notification-test', referenceId: actor.userId },
    });
  }

  async getTestStatus(
    notificationId: string,
    actor: NotificationTestActor,
  ): Promise<import('./logs.js').NotificationLogDetails | undefined> {
    const details = await this.logs.get(notificationId);
    return details?.log.sourceType === 'notification-test' &&
      details.log.sourceReferenceId === actor.userId
      ? details
      : undefined;
  }

  private resolveTestTarget(
    request: NotificationTestSendRequest,
  ): NotificationTestTargetDescriptor {
    const target = this.listTestTargets().find(
      (candidate) => candidate.channel.name === request.channel,
    );
    if (!target)
      throw notificationTestError(
        'NOTIFICATION_TEST_TARGET_UNAVAILABLE',
        'errors.testTargetUnavailable',
      );
    const fieldNames = new Set(target.fields.map((field) => field.name));
    for (const name of Object.keys(request.values)) {
      if (!fieldNames.has(name)) {
        throw notificationTestError(
          'NOTIFICATION_TEST_UNKNOWN_FIELD',
          'errors.testUnknownField',
          { params: { name } },
        );
      }
    }
    for (const field of target.fields) {
      const value = request.values[field.name]?.trim() ?? '';
      if (field.required && !value) {
        throw notificationTestError(
          'NOTIFICATION_TEST_REQUIRED_FIELD',
          'errors.testRequiredField',
          { params: { name: field.name } },
        );
      }
      if (field.maxLength !== undefined && value.length > field.maxLength) {
        throw notificationTestError(
          'NOTIFICATION_TEST_FIELD_TOO_LONG',
          'errors.testFieldTooLong',
          { params: { name: field.name, maxLength: field.maxLength } },
        );
      }
    }
    return target;
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

  async send(
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
      await this.ensureRuntime(channel);
      const validated = this.channelManager.validateMessage(
        channel,
        input.messages[channel],
      );
      message[channel] = validated.message;
      const [provider] = this.channelManager.providerIdentities(channel);
      for (const recipient of validated.recipients)
        expandedRecipients.push({
          channels: [{ channel, provider, recipient }],
        });
    }
    const requestFingerprint = notificationRequestFingerprint({
      ...input,
      messages: message,
    });
    const existing = await this.store.getLogByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new NotificationIdempotencyConflictError(input.idempotencyKey);
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
        idempotencyKey: input.idempotencyKey,
        deduplicated: true,
        status: snapshot.status,
        deliveries: snapshot.deliveries,
      };
    }
    return this.sendExpanded({
      idempotencyKey: input.idempotencyKey,
      requestFingerprint,
      source: input.source,
      recipients: expandedRecipients,
      message,
    });
  }

  private async sendExpanded(input: {
    readonly idempotencyKey: string;
    readonly requestFingerprint: string;
    readonly source?: {
      readonly type: string;
      readonly referenceId?: string;
    };
    readonly recipients: readonly ExpandedRecipient[];
    readonly message: Readonly<Record<string, object | undefined>>;
  }): Promise<NotificationSendResult> {
    if (input.recipients.length === 0)
      throw new Error('At least one notification recipient is required.');
    const now = await this.store.now();
    const notificationId = randomUUID();
    const deliveries: NotificationDeliveryRecord[] = [];
    for (const recipient of input.recipients) {
      for (const target of recipient.channels) {
        const message = input.message[target.channel];
        if (!message)
          throw new Error(
            `Message for Channel "${target.channel}" is required.`,
          );
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
      messageSnapshot: input.message as Readonly<Record<string, object>>,
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

  async retryDelivery(
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

  async close(): Promise<void> {
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
        new Error(`Notification Channel "${type}" is not enabled.`),
      );
    if (this.channelManager.has(type)) {
      if (
        this.channelManager.providerIdentities(type)[0]?.type !==
        config.provider
      )
        return Promise.reject(
          new Error(
            `Notification Channel "${type}" Provider has changed; restart the runtime.`,
          ),
        );
      return Promise.resolve();
    }
    const existing = this.runtimePromises.get(type);
    if (existing) return existing;
    const operation = this.createRuntime(type);
    this.runtimePromises.set(type, operation);
    void operation.catch(() => {
      if (this.runtimePromises.get(type) === operation) {
        this.runtimePromises.delete(type);
      }
    });
    return operation;
  }

  private async createRuntime(name: string): Promise<void> {
    const config = this.options.config.channels[name];
    if (!config || config.enabled === false)
      throw new Error(`Notification Channel "${name}" is not enabled.`);
    const providerDefinition = this.registry.provider(config.provider);
    const definition =
      providerDefinition &&
      this.registry.channel(providerDefinition.messageType);
    if (!providerDefinition || !definition)
      throw new Error(
        `Notification Provider "${config.provider}" is unavailable.`,
      );
    const channel = await definition.createChannel(
      { logger: this.options.logger },
      config,
    );
    const provider = await providerDefinition.createProvider(
      { logger: this.options.logger, now: () => this.store.now() },
      config,
    );
    if (provider.type !== config.provider) {
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
    Record<string, import('./types.js').NotificationChannelConfig>
  >,
>(
  options: Omit<
    NotificationManagerOptions<
      import('./types.js').ConfiguredNotificationChannels<TConfig>
    >,
    'config'
  > & {
    readonly config: Omit<
      import('./types.js').NotificationConfig,
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
