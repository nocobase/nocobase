import { testId } from '../helpers/test-id.js';
import { readFileSync } from 'node:fs';
import type { DatabaseManager } from '@nocobase/db';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MailMessagesSyncedEvent,
  MailOperationContext,
  MailService,
} from '../../server/index.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore } from '../../server/contracts/persistence.js';
import type { NormalizedMailMessage } from '../../server/contracts/provider.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

interface SyncEventSink {
  enqueue(event: MailMessagesSyncedEvent): Promise<void>;
  saveCheckpoint(accountId: string, checkpoint: string): Promise<void>;
}

type ConsumeMailIncrement = (
  mail: MailService,
  context: MailOperationContext,
  accountId: string,
  after: string | undefined,
  sink: SyncEventSink,
) => Promise<void>;

// Execute the published consumption example, not a parallel copy of its logic.
const documentation = readFileSync(
  new URL(
    '../../skills/nocobase-app-plugin-mail/references/message-sync-events.md',
    import.meta.url,
  ),
  'utf8',
);
const snippet = [...documentation.matchAll(/```ts\n([\s\S]*?)\n```/g)]
  .map((match) => match[1])
  .find((code) => code.includes('export async function consumeMailIncrement'));
if (!snippet) throw new Error('Mail consumption example is missing.');
const compiled = ts.transpileModule(snippet, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const exampleExports: { consumeMailIncrement?: ConsumeMailIncrement } = {};
const evaluate = new Function('exports', compiled) as (
  exports: typeof exampleExports,
) => void;
evaluate(exampleExports);
const consumeMailIncrement = exampleExports.consumeMailIncrement;
if (!consumeMailIncrement)
  throw new Error('Mail consumption example did not export.');

const context: MailOperationContext = {
  actorId: 'trusted-system',
  signal: new AbortController().signal,
};

describe('Documented Mail increment consumer with real committed records', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let service: MailService;
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
    service = new DefaultMailService({
      store,
      outbox: { kick: () => undefined },
      adapters: {
        resolve: async () => {
          throw new Error('No live Provider access.');
        },
      },
    });
  });

  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  async function commit(
    messages: readonly NormalizedMailMessage[],
    phase: 'history' | 'incremental' = 'incremental',
  ): Promise<readonly MailMessagesSyncedEvent[]> {
    const created = await store.createSyncRun({
      id: testId(`run-${++counter}`),
      accountId: testId('account'),
      requestedBy: 'owner',
      mode: phase === 'history' ? 'initial' : 'incremental',
      policy: { batchSize: 100 },
    });
    const prepared = await store.claimSyncRun(
      created.id,
      0,
      'preparing',
      'lease',
      new Date(Date.now() + 60_000).toISOString(),
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
      'lease',
      new Date(Date.now() + 60_000).toISOString(),
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

  it('never saves an incomplete round and replays idempotently across pages and concurrent inserts', async () => {
    // No notifier exists: this also proves restart/notification-loss compensation.
    for (let index = 0; index < 51; index++)
      await commit([message(`old-${index}`)]);
    const tasks = new Set<string>();
    const saveCheckpoint = vi.fn<SyncEventSink['saveCheckpoint']>();
    let delivered = 0;
    const sink: SyncEventSink = {
      async enqueue(event) {
        for (const id of event.messageIds)
          tasks.add(`activity:${event.accountId}:${id}`);
        if (++delivered === 50) await commit([message('concurrent')]);
        if (delivered === 51)
          throw new Error('Durable Job submission unavailable.');
      },
      saveCheckpoint,
    };
    await expect(
      consumeMailIncrement!(
        service,
        context,
        testId('account'),
        undefined,
        sink,
      ),
    ).rejects.toThrow('Durable Job');
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(tasks.size).toBe(51);
    await consumeMailIncrement!(
      service,
      context,
      testId('account'),
      undefined,
      {
        async enqueue(event) {
          for (const id of event.messageIds)
            tasks.add(`activity:${event.accountId}:${id}`);
        },
        saveCheckpoint,
      },
    );
    expect(tasks.size).toBe(52);
    expect(saveCheckpoint).toHaveBeenCalledTimes(1);
    const checkpoint = saveCheckpoint.mock.calls[0][1];
    const enqueue = vi.fn<SyncEventSink['enqueue']>();
    await consumeMailIncrement!(
      service,
      context,
      testId('account'),
      checkpoint,
      {
        enqueue,
        saveCheckpoint,
      },
    );
    expect(enqueue).not.toHaveBeenCalled();
    expect(saveCheckpoint).toHaveBeenCalledTimes(2);
  });

  it('joins explicit legacy backfill to the new log without synthetic events or duplicate activities', async () => {
    await store.commitSyncBatch({
      accountId: testId('account'),
      folders: [],
      messages: [message('legacy')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'legacy' },
    });
    const start = await service.listManagedMessageSyncEvents(context, {
      accountId: testId('account'),
    });
    expect(start.items).toEqual([]);
    expect(start.checkpoint).toBeDefined();
    await commit([message('arrived-during-backfill')]);
    const activities = new Set(
      (
        await service.listManagedMessages(context, {
          accountId: testId('account'),
        })
      ).items.map((item) => item.id),
    );
    expect(activities.size).toBe(2);
    await consumeMailIncrement!(
      service,
      context,
      testId('account'),
      start.checkpoint,
      {
        async enqueue(event) {
          event.messageIds.forEach((id) => activities.add(id));
        },
        async saveCheckpoint() {},
      },
    );
    expect(activities.size).toBe(2);
  });

  it('allows deliberate history/deletion skips but keeps incomplete bodies in durable recovery work', async () => {
    await commit([message('historic')], 'history');
    const events = await commit([
      { ...message('deferred'), contentStatus: 'deferred', text: undefined },
      { ...message('failed'), contentStatus: 'failed', text: undefined },
      message('deleted-before-read'),
    ]);
    expect(events[0].messageIds).toHaveLength(3);
    const deleted = (
      await service.listManagedMessages(context, {
        accountId: testId('account'),
      })
    ).items.find((item) => item.subject === 'deleted-before-read');
    if (!deleted) throw new Error('Missing deletion fixture.');
    await store.commitSyncBatch({
      accountId: testId('account'),
      folders: [],
      messages: [],
      deletedProviderMessageIds: ['deleted-before-read'],
      nextCursor: { value: 'deleted' },
    });
    const recoveryTasks = new Set<string>();
    const activities = new Set<string>();
    const saveCheckpoint = vi.fn<SyncEventSink['saveCheckpoint']>();
    await consumeMailIncrement!(
      service,
      context,
      testId('account'),
      undefined,
      {
        async enqueue(event) {
          if (event.phase === 'history') return; // Explicit historical-activity policy.
          for (const id of event.messageIds) {
            const detail = await service.getManagedMessage(
              context,
              event.accountId,
              id,
            );
            if (!detail) continue; // Explicit missing-message skip policy.
            if (
              detail.contentStatus === 'deferred' ||
              detail.contentStatus === 'failed'
            ) {
              recoveryTasks.add(id); // Models reliable application-owned recovery Job submission.
              continue;
            }
            activities.add(id);
          }
        },
        saveCheckpoint,
      },
    );
    expect(activities.size).toBe(0);
    expect(recoveryTasks.size).toBe(2);
    expect(saveCheckpoint).toHaveBeenCalledOnce();
    expect(
      (
        await service.listManagedMessageSyncEvents(context, {
          accountId: testId('account'),
        })
      ).items[1].messageIds,
    ).toContain(deleted.id);
  });
});

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
