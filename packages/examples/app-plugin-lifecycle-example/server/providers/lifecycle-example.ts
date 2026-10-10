import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  realtimeServiceToken,
  type RealtimePublicTopic,
} from '@nocobase/app-server/realtime';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { databaseManagerToken } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
  SYSTEM_ACTOR,
} from '@nocobase/lifecycle';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { expenseLifecycle } from '../lifecycles/expense.js';
import { exportLifecycle } from '../lifecycles/export.js';
import {
  createFailureSwitch,
  type FlowServices,
} from '../lifecycles/flow-services.js';
import { fulfilmentLifecycle } from '../lifecycles/fulfilment.js';
import { orderLifecycle } from '../lifecycles/order.js';
import { purchaseLifecycle } from '../lifecycles/purchase.js';
import { createExampleServices } from '../lifecycles/services.js';
import { subscriptionLifecycle } from '../lifecycles/subscription.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
import { buildSampleRecords, SAMPLE_DATA_NAME } from '../samples.js';
import { RepositorySandboxObjects } from '../sandbox/objects.js';
import { WebhookOutbox } from '../sandbox/outbox.js';
import { Sandbox } from '../sandbox/sandbox.js';
import {
  LIFECYCLE_CHANGES_TOPIC,
  type LifecycleChange,
} from '../../shared/routes.js';
import {
  LIFECYCLE_EXAMPLE_COLLECTIONS,
  LIFECYCLE_EXAMPLE_SCOPE,
} from '../scope.js';
import { DurableFlowService } from '../services/durable-flows.js';
import { LifecycleExampleService } from '../services/lifecycle-example.js';
import {
  durableFlowServiceToken,
  lifecycleExampleServiceToken,
} from '../tokens.js';
import { WebhookReceiver } from '../webhooks/receiver.js';

/** How often the triggers are swept and expired attempts taken back. */
export const TRIGGER_SWEEP_MS: number = 10_000;

/** How long finished effect runs are kept. */
export const RUN_RETENTION_MS: number = 7 * 86_400_000;

/**
 * Wires the lifecycles to the application: the Repository store on the
 * default connection, and `createLifecycleJobs()` for the rest — effects as
 * jobs on a JobExecutor, the sweep on a ScheduleExecutor rule, and recovery
 * once both are open, so effects a stopped process left queued run again.
 */
export class LifecycleExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = LIFECYCLE_EXAMPLE_SCOPE;
  private jobs: LifecycleJobs | undefined;
  private runtime: LifecycleRuntime | undefined;
  private flows: DurableFlowService | undefined;
  private sandboxInstance: Sandbox | undefined;
  private changes: RealtimePublicTopic<LifecycleChange> | undefined;

  public override register(): void {
    this.app.container.singleton(
      lifecycleExampleServiceToken,
      () =>
        new LifecycleExampleService(
          this.app.container.resolve(databaseManagerToken),
          this.lifecycleRuntime(),
        ),
    );
    this.app.container.singleton(durableFlowServiceToken, () =>
      this.durableFlows(),
    );
  }

  public override async boot(): Promise<void> {
    // Built once every provider is ready, and only when the database was
    // installed with sample data asked for; `nocobase db sample` builds it
    // later on a database installed without.
    if (!this.app.container.has(sampleDataToken)) return;
    this.app.container.resolve(sampleDataToken).register({
      name: SAMPLE_DATA_NAME,
      packageName: '@nocobase/app-plugin-lifecycle-example',
      run: () =>
        buildSampleRecords(
          this.app.container.resolve(lifecycleExampleServiceToken),
          this.durableFlows(),
        ),
    });
  }

  public override async start(): Promise<void> {
    // The pages reload when told a record changed instead of asking every
    // few seconds. An application without realtime still works; its pages
    // then reload only after their own actions.
    if (this.app.container.has(realtimeServiceToken))
      this.changes = this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic<LifecycleChange, 'public'>(LIFECYCLE_CHANGES_TOPIC, {
          audience: 'public',
        });
    const runtime = this.lifecycleRuntime();
    await this.effectJobs().start(runtime);
  }

  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
    this.jobs = undefined;
    this.changes?.close();
    this.changes = undefined;
  }

  /** Tells the pages that a record changed; they read it back themselves. */
  private publishChange(change: LifecycleChange): void {
    this.changes?.publish(change);
  }

  /** One runtime for the service and the executors, created on first use. */
  private lifecycleRuntime(): LifecycleRuntime {
    if (this.runtime) return this.runtime;
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('lifecycle-example');
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(
        this.app.container.resolve(databaseManagerToken),
        {
          collections: {
            transitions: LIFECYCLE_EXAMPLE_COLLECTIONS.transitions,
            effectRuns: LIFECYCLE_EXAMPLE_COLLECTIONS.effectRuns,
          },
        },
      ),
      dispatcher: this.effectJobs(),
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    const services = createExampleServices({
      info: (message, details) => logger.info(details, message),
    });
    runtime.register(ticketLifecycle, { services });
    runtime.register(expenseLifecycle, { services });
    // The durable flows call the sandbox standing in for the outside
    // systems, and may fire a transition themselves when what follows
    // depends on what they found.
    const flowServices: FlowServices = {
      sandbox: this.sandbox(),
      shouldFail: createFailureSwitch(),
      fire: async (lifecycle, id, transition, options) => {
        await runtime.fire(lifecycle, id, transition, {
          actor: SYSTEM_ACTOR,
          requestId: options.requestId,
          ...(options.input === undefined ? {} : { input: options.input }),
        });
      },
    };
    runtime.register(orderLifecycle, { services: flowServices });
    runtime.register(exportLifecycle, { services: flowServices });
    runtime.register(purchaseLifecycle, { services: flowServices });
    runtime.register(fulfilmentLifecycle, { services: flowServices });
    runtime.register(subscriptionLifecycle, { services: flowServices });
    // Another plugin would subscribe the same way, to refresh a page, keep a
    // to-do list or feed a search index; work that must happen is an effect.
    runtime.on('completed', {}, (event) => {
      this.publishChange({
        lifecycle: event.lifecycle,
        recordId: String(event.entry.recordId),
      });
      logger.info(
        {
          lifecycle: event.lifecycle,
          recordId: event.entry.recordId,
          transition: event.transition,
          from: event.from,
          to: event.to,
          actor: event.actor.id,
        },
        'transition committed',
      );
    });
    this.runtime = runtime;
    return runtime;
  }

  /** The simulated outside systems, kept in the plugin's own table. */
  private sandbox(): Sandbox {
    this.sandboxInstance ??= new Sandbox(
      new RepositorySandboxObjects(
        this.app.container.resolve(databaseManagerToken),
      ),
    );
    return this.sandboxInstance;
  }

  /** The durable flows' service, over the same runtime and the sandbox. */
  private durableFlows(): DurableFlowService {
    if (this.flows) return this.flows;
    const database = this.app.container.resolve(databaseManagerToken);
    const runtime = this.lifecycleRuntime();
    this.flows = new DurableFlowService(
      database,
      runtime,
      this.sandbox(),
      new WebhookOutbox(
        database,
        new WebhookReceiver(runtime),
        undefined,
        (event) =>
          this.publishChange({
            lifecycle: event.lifecycle,
            recordId: event.recordId,
          }),
      ),
    );
    return this.flows;
  }

  /** The dispatcher, created before the runtime that uses it. */
  private effectJobs(): LifecycleJobs {
    if (this.jobs) return this.jobs;
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('lifecycle-example');
    this.jobs = createLifecycleJobs({
      jobs: executors.getJobExecutor(LIFECYCLE_EXAMPLE_SCOPE),
      schedule: executors.getScheduleExecutor(LIFECYCLE_EXAMPLE_SCOPE),
      // Stored with every queued task: keep it stable.
      jobName: `${LIFECYCLE_EXAMPLE_SCOPE}/effect`,
      sweepName: 'triggers',
      sweepEveryMs: TRIGGER_SWEEP_MS,
      // After the triggers: renew the subscriptions whose period ended,
      // deliver again the sandbox's webhooks that were answered with an
      // error, and prune succeeded and cancelled runs older than a week.
      onSweep: async () => {
        await this.durableFlows().renewDue();
        await this.durableFlows().outbox.redeliverDue();
        await this.lifecycleRuntime().prune({
          olderThan: new Date(Date.now() - RUN_RETENTION_MS),
        });
      },
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    return this.jobs;
  }
}
