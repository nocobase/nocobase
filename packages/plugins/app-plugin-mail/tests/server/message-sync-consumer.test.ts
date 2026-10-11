import { testId } from '../helpers/test-id.js';
import { readFileSync } from 'node:fs';
import type { DatabaseManager } from '@nocobase/db';
import { ServiceContainer, ServiceProvider } from '@nocobase/service-provider';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mailServiceToken,
  type MailMessagesSyncedEvent,
  type MailMessagesSyncedListener,
  type MailOperationContext,
  type MailService,
} from '../../server/index.js';
import {
  MAIL_MESSAGE_SYNC_QUEUE,
  MailMessageSyncNotifier,
} from '../../server/message-sync-notifier.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore } from '../../server/contracts/persistence.js';
import type { NormalizedMailMessage } from '../../server/contracts/provider.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import {
  createMailTestQueue,
  mailQueueBackends,
  type MailTestQueue,
} from '../helpers/queue.js';

interface MailSyncEventSink {
  recordActivity(accountId: string, messageId: string): Promise<void>;
  deferContent(accountId: string, messageId: string): Promise<void>;
}
type ProcessMailSyncEvent = (
  mail: MailService,
  context: MailOperationContext,
  event: MailMessagesSyncedEvent,
  signal: AbortSignal,
  sink: MailSyncEventSink,
) => Promise<void>;

// Execute the published business-processing example behind a real queue subscription.
const documentation = readFileSync(
  new URL(
    '../../skills/nocobase-app-plugin-mail/references/message-sync-events.md',
    import.meta.url,
  ),
  'utf8',
);
const snippet = [...documentation.matchAll(/```ts\n([\s\S]*?)\n```/g)]
  .map((match) => match[1])
  .find((code) => code.includes('export async function processMailSyncEvent'));
if (!snippet) throw new Error('Mail queue consumption example is missing.');
const compiled = ts.transpileModule(snippet, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const exampleExports: { processMailSyncEvent?: ProcessMailSyncEvent } = {};
const evaluate = new Function('exports', compiled) as (
  exports: typeof exampleExports,
) => void;
evaluate(exampleExports);
const processMailSyncEvent = exampleExports.processMailSyncEvent;
if (!processMailSyncEvent)
  throw new Error('Mail queue consumption example did not export.');
const context: MailOperationContext = { actorId: 'trusted-system' };

declare abstract class _DocumentedConsumer extends ServiceProvider<{
  container: ServiceContainer;
}> {
  protected abstract process(
    event: MailMessagesSyncedEvent,
    signal: AbortSignal,
  ): Promise<void>;
}
const providerSnippet = [...documentation.matchAll(/```ts\n([\s\S]*?)\n```/g)]
  .map((match) => match[1])
  .find((code) =>
    code.includes('export abstract class MailSyncConsumerProvider'),
  );
if (!providerSnippet)
  throw new Error('Mail queue Provider example is missing.');
const providerExports: {
  MailSyncConsumerProvider?: typeof _DocumentedConsumer;
} = {};
const providerCompiled = ts.transpileModule(providerSnippet, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const evaluateProvider = new Function(
  'exports',
  'require',
  providerCompiled,
) as (
  exports: typeof providerExports,
  require: (id: string) => unknown,
) => void;
evaluateProvider(providerExports, (id) => {
  if (id === '@nocobase/service-provider') return { ServiceProvider };
  if (id === '@nocobase/app-plugin-mail/server') return { mailServiceToken };
  throw new Error(`Unexpected documented Provider import: ${id}`);
});
const MailSyncConsumerProvider = providerExports.MailSyncConsumerProvider;
if (!MailSyncConsumerProvider)
  throw new Error('Mail queue Provider example did not export.');

describe.each(mailQueueBackends)(
  'documented Mail queue consumer with committed records (%s)',
  (backend) => {
    let database: DatabaseManager;
    let store: MailStore;
    let service: MailService;
    let queue: MailTestQueue;
    let notifier: MailMessageSyncNotifier;
    let counter = 0;

    beforeEach(async () => {
      database = await createMailTestDatabase();
      store = createDatabaseMailStore(database);
      counter = 0;
      await store.saveAccount({
        id: testId('account'),
        userId: 'owner',
        provider: { type: 'fixture', name: 'fixture' },
        address: 'owner@example.test',
        credentialReference: 'fixture',
        scopes: [],
        status: 'active',
      });
      queue = await createMailTestQueue(backend);
      notifier = new MailMessageSyncNotifier(queue.hostQueue);
      service = new DefaultMailService({
        store,
        outbox: { kick() {} },
        adapters: {
          resolve: async () => {
            throw new Error('No live Provider access.');
          },
        },
        messageSyncNotifier: notifier,
      });
      // The documented Provider subscribes in boot, before the host sets up its queue.
    });
    afterEach(async () => {
      try {
        await notifier.close();
      } finally {
        await queue.close();
        await destroyMailTestDatabase(database);
        vi.restoreAllMocks();
      }
    });

    async function subscribe(
      listener: MailMessagesSyncedListener,
    ): Promise<() => Promise<void>> {
      const container = new ServiceContainer();
      container.instance(mailServiceToken, service);
      class Consumer extends MailSyncConsumerProvider! {
        public readonly name = 'documented-consumer';
        protected override async process(
          event: MailMessagesSyncedEvent,
          signal: AbortSignal,
        ): Promise<void> {
          await listener(event, signal);
        }
      }
      const consumer = new Consumer({ container });
      await consumer.boot();
      await queue.setup();
      return () => consumer.shutdown();
    }

    async function commit(
      messages: readonly NormalizedMailMessage[],
      phase: 'history' | 'catchUp' | 'incremental' = 'incremental',
    ): Promise<readonly MailMessagesSyncedEvent[]> {
      const created = await store.createSyncRun({
        id: testId(`run-${++counter}`),
        accountId: testId('account'),
        requestedBy: 'owner',
        mode: phase === 'incremental' ? 'incremental' : 'initial',
        policy: { batchSize: 100 },
      });
      const prepared = await store.claimSyncRun(
        created.id,
        0,
        'preparing',
        'prepare',
        new Date(Date.now() + 60000).toISOString(),
      );
      if (!prepared) throw new Error('Missing preparation lease.');
      await store.commitSyncStep({
        run: prepared,
        messages: [],
        phase,
        status: 'running',
        createNextTask: false,
      });
      const claimed = await store.claimSyncRun(
        created.id,
        1,
        phase,
        'import',
        new Date(Date.now() + 60000).toISOString(),
      );
      if (!claimed) throw new Error('Missing message lease.');
      const committed = await store.commitSyncStep({
        run: claimed,
        messages,
        phase: 'completed',
        status: 'completed',
        createNextTask: false,
      });
      return committed.messageSyncEvents;
    }

    it('retries stable event snapshots after business failure with idempotent message effects', async () => {
      await queue.hostQueue
        .manager(MAIL_MESSAGE_SYNC_QUEUE)
        .configure({ attempts: 2, backoff: { type: 'fixed', delay: 10 } });
      const activities = new Set<string>();
      const recordActivity = vi.fn(
        async (accountId: string, messageId: string) => {
          const detail = await service.getManagedMessage(
            context,
            accountId,
            messageId,
          );
          expect(detail?.text).toBe('Complete body');
          activities.add(`activity:${accountId}:${messageId}`);
          if (recordActivity.mock.calls.length === 2)
            throw new Error('Business storage unavailable.');
        },
      );
      const sink: MailSyncEventSink = { recordActivity, deferContent: vi.fn() };
      const received: MailMessagesSyncedEvent[] = [];
      const listener = vi.fn(
        async (event: MailMessagesSyncedEvent, signal: AbortSignal) => {
          received.push(event);
          await processMailSyncEvent!(service, context, event, signal, sink);
        },
      );
      const cancel = await subscribe(listener);
      const events = await commit([message('first'), message('second')]);
      await notifier.publish(events);
      await vi.waitFor(() => expect(recordActivity).toHaveBeenCalledTimes(4), {
        timeout: 10000,
      });
      await cancel();
      expect(received).toEqual([events[0], events[0]]);
      expect(activities.size).toBe(2);
      expect(sink.deferContent).not.toHaveBeenCalled();
      expect(await store.getSyncRun(events[0].syncRunId)).toMatchObject({
        status: 'completed',
        processedMessages: 2,
        revision: 2,
      });
    });

    it('applies explicit history and deletion skips and submits incomplete bodies to recovery', async () => {
      const historic = await commit([message('historic')], 'history');
      const events = await commit(
        [
          {
            ...message('deferred'),
            contentStatus: 'deferred',
            text: undefined,
          },
          { ...message('failed'), contentStatus: 'failed', text: undefined },
          message('deleted-before-delivery'),
        ],
        'catchUp',
      );
      expect(events[0].messageIds).toHaveLength(3);
      await store.commitSyncBatch({
        accountId: testId('account'),
        folders: [],
        messages: [],
        deletedProviderMessageIds: ['deleted-before-delivery'],
        nextCursor: { value: 'deleted' },
      });
      const sink: MailSyncEventSink = {
        recordActivity: vi.fn(),
        deferContent: vi.fn(async () => {}),
      };
      const listener = vi.fn(
        (event: MailMessagesSyncedEvent, signal: AbortSignal) =>
          processMailSyncEvent!(service, context, event, signal, sink),
      );
      const cancel = await subscribe(listener);
      await notifier.publish([...historic, ...events]);
      await vi.waitFor(
        () => expect(sink.deferContent).toHaveBeenCalledTimes(2),
        { timeout: 10000 },
      );
      await cancel();
      expect(listener).toHaveBeenCalledTimes(2);
      expect(sink.recordActivity).not.toHaveBeenCalled();
      expect(sink.deferContent).toHaveBeenCalledWith(
        events[0].accountId,
        events[0].messageIds[0],
      );
      expect(sink.deferContent).toHaveBeenCalledWith(
        events[0].accountId,
        events[0].messageIds[1],
      );
    });

    it('forwards queue cancellation to the documented consumer and awaits business cleanup', async () => {
      const cleanup = Promise.withResolvers<void>();
      let signal: AbortSignal | undefined;
      const recordActivity = vi.fn(async () => {
        await cleanup.promise;
      });
      const listener = vi.fn(
        (event: MailMessagesSyncedEvent, cancellation: AbortSignal) => {
          signal = cancellation;
          return processMailSyncEvent!(service, context, event, cancellation, {
            recordActivity,
            deferContent: vi.fn(),
          });
        },
      );
      const cancel = await subscribe(listener);
      await notifier.publish(
        await commit([message('first'), message('second')]),
      );
      await vi.waitFor(() => expect(recordActivity).toHaveBeenCalledOnce());
      let cancelled = false;
      const cancelling = cancel().then(() => {
        cancelled = true;
      });
      try {
        await vi.waitFor(() => expect(signal?.aborted).toBe(true));
        expect(cancelled).toBe(false);
        cleanup.resolve();
        await cancelling;
        expect(recordActivity).toHaveBeenCalledOnce();
        expect(cancelled).toBe(true);
      } finally {
        cleanup.resolve();
        await cancelling;
      }
    });
  },
);

function message(id: string): NormalizedMailMessage {
  return {
    providerMessageId: id,
    providerFolderIds: [],
    subject: id,
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    read: false,
    starred: false,
    draft: false,
    attachments: [],
    text: 'Complete body',
    contentStatus: 'complete',
    receivedAt: '2001-01-01T00:00:00.000Z',
  };
}
