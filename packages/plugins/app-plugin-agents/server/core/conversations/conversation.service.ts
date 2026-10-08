/**
 * Conversations over this plugin's own tables. Everything people and other plugins do with conversations goes through
 * `ConversationService` (`ports.ts`); a later move to a shared platform conversation layer, or to the AI employee's
 * storage, replaces this implementation and keeps the interface.
 *
 * - Only the owner reads or changes a conversation: everyone else gets 404, as if it did not exist.
 * - A message the owner sends is saved first. When the bound agent may be woken it is handed to the agent as run input
 *   (`comment`, payload `{ trigger: 'message', conversationId, messageId }`) on the key (agent, conversation, thread):
 *   a new run, the run waiting for a runner, or the run working now. Otherwise it waits, unanswered, until the
 *   conversation switches to an agent that can answer.
 * - The agent's text events become assistant messages (`syncRun`): as the runner reports them (a listener on
 *   `run.events`), when the run ends (inside its transaction), and when the owner reads messages of a run still open.
 * - Switching to the system default and back moves the queued work and the unanswered messages to the other agent,
 *   and bumps `thread`, so every switch starts a new session. A conversation keeps its mode (the type of the agent it
 *   started with): it switches only to an agent of the same type.
 * - An online agent's reply is drafted as it is written (`streamDraft`, from the server executor): one assistant message
 *   per run without a run event, rewritten in place, which the run's next text event makes final (`syncIn`). A draft
 *   left when the run ends is kept as what it had written, marked interrupted.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  onlineEntriesOrDefault,
  sameEntry,
  type Agent,
  type OnlineModelEntry,
} from '../../../shared/agents.js';
import type { ModelRef } from '../../../shared/models.js';
import {
  CONVERSATION_HISTORY_IN_PROMPT,
  CONVERSATION_PAGE_DEFAULT,
  CONVERSATION_PAGE_MAX,
  CONVERSATION_SOURCE_PATTERN,
  CONVERSATION_SUBJECT,
  CONVERSATION_TITLE_AGENT_MAX,
  CONVERSATION_TITLE_AUTO_CHARS,
  CONVERSATION_TITLE_MAX,
  MESSAGE_CONTENT_MAX,
  MESSAGE_PAGE_DEFAULT,
  MESSAGE_PAGE_MAX,
  chatModelChoices,
  type ChatAgent,
  type ConversationAgent,
  type ConversationConflict,
  type ConversationDetail,
  type ConversationNotice,
  type ConversationPage,
  type ConversationRun,
  type ConversationSummary,
  type MessageMetadata,
  type MessagePage,
  type SendMessageRequest,
  type SendMessageResult,
} from '../../../shared/conversations.js';
import type { Runner } from '../../../shared/runners.js';
import { CONSULT_MAX_DEPTH, type Run } from '../../../shared/runs.js';
import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import { sampleValue } from '../../../shared/briefs.js';
import type { Clock } from '../../kernel/clock.js';
import {
  forbidden,
  invalid,
  notFound,
  ProtocolError,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import { asJson } from '../../kernel/values.js';
import type { People } from '../../kernel/people.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { AgentService } from '../agents/index.js';
import { findAgent } from '../agents/index.js';
import type { RunnerService } from '../../runners/index.js';
import type { ModelGateway } from '../../online/gateway.js';
import {
  eventsAfter,
  hasSession,
  lastSummary,
  onlineEntryOf,
  openRunsOnEach,
  queuedRun,
  type ClaimContext,
  type RunService,
  type SubjectAssembly,
  type SubjectBinding,
} from '../runs/index.js';
import { findRunRecord, toRun } from '../runs/run.store.js';
import {
  readAttachmentIds,
  storedAttachments,
  type ChatAttachmentLinks,
} from './attachments.js';
import { availabilityOf, wakeable } from './availability.js';
import type { ChatSettingsService } from './chat-settings.js';
import {
  appendMessage,
  conversationsRepo,
  findConversation,
  findDraft,
  metadataOf,
  rewriteMessage,
  lockConversation,
  messagesRepo,
  toMessage,
  updateMessageRun,
  type ConversationRecord,
  type MessageRecord,
  type NewMessage,
} from './conversation.store.js';
import {
  hasContent,
  renderPageContext,
  type PageContextKinds,
} from './page-context.js';
import type {
  ConversationRef,
  ConversationRules,
  ConversationService,
  ConversationSourceKind,
  ConversationSources,
} from './ports.js';
import {
  attachmentLines,
  conversationContext,
  conversationKey,
  conversationSystemLayer,
  conversationTask,
  conversationTurn,
  conversationUrl,
  type HistoryLine,
} from './prompt.js';
import { autoTitle, cleanTitle } from './titles.js';

/** Events read per page while turning a run's events into messages. */
const SYNC_PAGE = 500;

export interface ConversationServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly agents: Pick<AgentService, 'mayInvoke' | 'create' | 'get' | 'list'>;
  readonly runners: Pick<RunnerService, 'list'>;
  readonly runs: Pick<
    RunService,
    'enqueue' | 'cancel' | 'withdrawQueued' | 'get' | 'detail'
  >;
  readonly people: People;
  readonly settings: ChatSettingsService;
  readonly contextKinds: PageContextKinds;
  /** The models online agents use, for whether one can answer. */
  readonly models: Pick<ModelGateway, 'catalog'>;
  /** The files people send with messages; without them a message that names files is refused. */
  readonly attachments?: ChatAttachmentLinks;
  /** The application's public base path (`/app`, or empty), for the files' URLs. */
  readonly basePath?: () => string;
}

function conversationConflict(
  reason: ConversationConflict,
  message: string,
): Error {
  return new ProtocolError('CONVERSATION_CONFLICT', message, { reason });
}

function threadScopeOf(record: Pick<ConversationRecord, 'thread'>): string {
  return `t${Number(record.thread)}`;
}

function subjectOf(id: string): { kind: string; id: string } {
  return { kind: CONVERSATION_SUBJECT, id };
}

function encodeCursor(at: string, id: string): string {
  return Buffer.from(JSON.stringify([at, id]), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): { at: string; id: string } {
  try {
    const value = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as unknown;
    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      typeof value[1] === 'string'
    )
      return { at: value[0], id: value[1] };
  } catch {
    // Falls through to the error below.
  }
  throw invalid('pageToken is not one this API gave.', { field: 'pageToken' });
}

function limitOf(value: number | undefined, fallback: number, max: number) {
  if (value === undefined) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

/** The places conversations are started from besides the panel, as the application registers them. */
function createSources(): ConversationSources {
  const sources = new Map<string, ConversationSourceKind>();
  return {
    register(source) {
      if (
        source.key === 'panel' ||
        !CONVERSATION_SOURCE_PATTERN.test(source.key)
      )
        throw new Error(`Not a conversation source: ${source.key}`);
      if (sources.has(source.key))
        throw new Error(
          `Conversation source already registered: ${source.key}`,
        );
      sources.set(source.key, source);
      return () => {
        if (sources.get(source.key) === source) sources.delete(source.key);
      };
    },
    has: (key) => sources.has(key),
    list: () => [...sources.values()],
  };
}

/** The conversation subject's names for its triggers in the run panel. */
const CONVERSATION_TRIGGERS = {
  message: { key: 'runs.trigger.message', ns: ACCESS_NAMESPACE },
} as const;

/** The English text of a notice; the panel shows its own translation of `notice.code`. */
function noticeText(
  notice: ConversationNotice,
  names: ReadonlyMap<string, string>,
): string {
  const name = (id: string) => names.get(id) ?? 'another agent';
  switch (notice.code) {
    case 'switchedToDefault':
      return `This conversation now uses ${name(notice.agentId)}, the default agent, until you switch back to ${name(notice.fromAgentId)}.`;
    case 'switchedBack':
      return `This conversation is back with ${name(notice.agentId)}.`;
    case 'runFailed':
      return `The agent stopped before answering${notice.reason ? ` (${notice.reason})` : ''}.`;
    case 'runCancelled':
      return 'You stopped the agent.';
    case 'news':
      return notice.title;
    case 'consultation':
      return `Consulted ${notice.agentName}: ${notice.question}`;
  }
}

function refOf(record: ConversationRecord): ConversationRef {
  return {
    id: record.id,
    userId: record.userId,
    agentId: record.agentId,
    title: record.title,
    source: record.source,
  };
}

export function createConversationService(
  deps: ConversationServiceDeps,
): ConversationService {
  const { tx, ids, clock } = deps;
  const now = () => clock.now().toISOString();
  /** A message as the API answers it, its files' URLs under the application's base path. */
  const viewOf = (record: MessageRecord) =>
    toMessage(record, deps.basePath?.() ?? '');
  const rules: ConversationRules[] = [];
  const sources = createSources();

  // -------------------------------------------------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------------------------------------------------

  /** The conversation if `userId` owns it; 404 otherwise. */
  async function owned(
    conn: DatabaseConnection,
    userId: string,
    id: string,
  ): Promise<ConversationRecord> {
    const record = await findConversation(conn, id);
    if (!record || record.userId !== userId) throw notFound('Conversation');
    return record;
  }

  /** Locks the conversation if `userId` owns it; 404 otherwise. */
  async function lockOwned(
    unit: Tx,
    userId: string,
    id: string,
  ): Promise<ConversationRecord> {
    await owned(unit.conn, userId, id);
    return (await lockConversation(unit.conn, id, now()))!;
  }

  function agentRef(id: string, agent: Agent | null): ConversationAgent {
    return {
      id,
      name: agent?.name ?? null,
      nameText: agent?.nameText ?? null,
      avatar: agent?.avatar ?? null,
      archived: Boolean(agent?.archivedAt),
    };
  }

  function runRef(runs: readonly Run[]): ConversationRun | null {
    const run = runs[runs.length - 1];
    return run
      ? { id: run.id, status: run.status, acceptsInput: run.acceptsInput }
      : null;
  }

  /** The entry the owner chose for the conversation, if any. */
  function chosenModel(
    record: ConversationRecord,
  ): OnlineModelEntry | undefined {
    return record.modelService && record.model
      ? { modelService: record.modelService, model: record.model }
      : undefined;
  }

  /**
   * The entry an online conversation answers with now (the system default chat model, `defaultModel`, for an agent
   * that lists none); null for a runner one or a missing agent.
   */
  function modelOf(
    record: ConversationRecord,
    agent: Agent | null,
    defaultModel: ModelRef | null,
  ): OnlineModelEntry | null {
    if (record.mode !== 'online' || !agent) return null;
    return onlineEntryOf(agent, chosenModel(record), defaultModel);
  }

  async function summaries(
    conn: DatabaseConnection,
    records: readonly ConversationRecord[],
    /** The system default chat model, when the caller has read it; read here when an online one needs it. */
    known?: ModelRef | null,
  ): Promise<ConversationSummary[]> {
    const defaultModel =
      known !== undefined
        ? known
        : records.some((record) => record.mode === 'online')
          ? ((await deps.models.catalog()).defaultModel ?? null)
          : null;
    const agents = new Map<string, Agent | null>();
    for (const record of records)
      for (const id of [record.agentId, record.fallbackFromAgentId])
        if (id && !agents.has(id)) agents.set(id, await findAgent(conn, id));
    const open = await openRunsOnEach(
      conn,
      CONVERSATION_SUBJECT,
      records.map((record) => record.id),
    );
    return records.map((record) => ({
      id: record.id,
      title: record.title,
      titleSource: record.titleSource,
      category: record.category,
      source: record.source,
      mode: record.mode,
      agent: agentRef(record.agentId, agents.get(record.agentId) ?? null),
      fallbackFrom: record.fallbackFromAgentId
        ? agentRef(
            record.fallbackFromAgentId,
            agents.get(record.fallbackFromAgentId) ?? null,
          )
        : null,
      model: modelOf(record, agents.get(record.agentId) ?? null, defaultModel),
      read: Boolean(record.read),
      lastMessageAt: record.lastMessageAt,
      archivedAt: record.archivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      run: runRef(open.filter((run) => run.subject.id === record.id)),
    }));
  }

  async function systemDefault(
    conn: DatabaseConnection,
    userId: string,
  ): Promise<Agent | null> {
    const { defaultAgentId } = await deps.settings.settings(conn);
    if (!defaultAgentId) return null;
    const agent = await findAgent(conn, defaultAgentId);
    return wakeable(agent, userId, deps.agents.mayInvoke) ? agent : null;
  }

  async function detailOf(
    conn: DatabaseConnection,
    record: ConversationRecord,
    runners?: readonly Runner[],
  ): Promise<ConversationDetail> {
    const catalog = await deps.models.catalog();
    const [summary] = await summaries(conn, [record], catalog.defaultModel);
    const agent = await findAgent(conn, record.agentId);
    const fallbackFrom = record.fallbackFromAgentId
      ? await findAgent(conn, record.fallbackFromAgentId)
      : null;
    const system = await systemDefault(conn, record.userId);
    return {
      ...summary,
      availability: availabilityOf(
        agent,
        record.userId,
        deps.agents.mayInvoke,
        runners ?? (await deps.runners.list()),
        catalog,
        chosenModel(record),
      ),
      models:
        record.mode === 'online' && agent
          ? chatModelChoices(
              onlineEntriesOrDefault(agent, catalog.defaultModel ?? null),
              catalog,
            )
          : [],
      canFallback: Boolean(
        system &&
        !record.fallbackFromAgentId &&
        system.id !== record.agentId &&
        system.type === record.mode,
      ),
      canRestore: wakeable(fallbackFrom, record.userId, deps.agents.mayInvoke),
    };
  }

  async function detail(userId: string, id: string) {
    const conn = tx.read();
    return detailOf(conn, await owned(conn, userId, id));
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Writing
  // -------------------------------------------------------------------------------------------------------------------

  function changed(unit: Tx, record: ConversationRecord, lastSeq?: number) {
    unit.emit({
      type: 'conversation.changed',
      conversationId: record.id,
      userId: record.userId,
      ...(lastSeq === undefined ? {} : { lastSeq }),
    });
  }

  async function append(
    unit: Tx,
    record: ConversationRecord,
    message: NewMessage,
  ): Promise<MessageRecord> {
    const appended = await appendMessage(
      unit.conn,
      ids,
      record.id,
      message,
      now(),
    );
    changed(unit, record, Number(appended.seq));
    return appended;
  }

  async function notice(
    unit: Tx,
    record: ConversationRecord,
    value: ConversationNotice,
    runId: string | null = null,
  ): Promise<void> {
    const agentIds =
      value.code === 'switchedToDefault' || value.code === 'switchedBack'
        ? [value.agentId, value.fromAgentId]
        : [];
    const names = new Map<string, string>();
    for (const id of agentIds) {
      const agent = await findAgent(unit.conn, id);
      if (agent) names.set(id, agent.name);
    }
    await append(unit, record, {
      role: 'system',
      text: noticeText(value, names),
      metadata: { notice: value },
      runId,
    });
  }

  async function nameOf(conn: DatabaseConnection, userId: string) {
    return (await deps.people.names(conn, [userId])).get(userId) ?? userId;
  }

  /** The run input a user message becomes: its text, its files, and its page context marked as data. */
  function inputText(message: MessageRecord): string {
    const view = toMessage(message);
    const context = view.workContext;
    return [
      view.content.content.trim(),
      attachmentLines(storedAttachments(message.attachments)),
      hasContent(context) ? renderPageContext(context!) : '',
    ]
      .filter((part) => part !== '')
      .join('\n\n');
  }

  /** Hands user messages to the conversation's agent, oldest first. */
  async function wake(
    unit: Tx,
    record: ConversationRecord,
    messages: readonly MessageRecord[],
  ): Promise<SendMessageResult['run']> {
    const agent = await findAgent(unit.conn, record.agentId);
    if (!wakeable(agent, record.userId, deps.agents.mayInvoke)) return null;
    const name = await nameOf(unit.conn, record.userId);
    let result: SendMessageResult['run'] = null;
    for (const message of messages) {
      const files = storedAttachments(message.attachments);
      const enqueued = queuedRun(
        await deps.runs.enqueue(
          {
            agentId: agent.id,
            subject: subjectOf(record.id),
            threadScope: threadScopeOf(record),
            actorUserId: record.userId,
            ownerUserId: record.userId,
            input: {
              type: 'comment',
              actor: { kind: 'user', id: record.userId, name },
              text: inputText(message),
              payload: {
                trigger: 'message',
                conversationId: record.id,
                messageId: message.id,
                seq: Number(message.seq),
                // An online agent's executor shows the images among them to its model.
                ...(files.length > 0
                  ? { attachmentIds: files.map((file) => file.id) }
                  : {}),
              },
            },
          },
          unit,
        ),
      );
      await updateMessageRun(
        unit.conn,
        message,
        enqueued.runId,
        { inputId: enqueued.inputId },
        now(),
      );
      result = { id: enqueued.runId, outcome: enqueued.outcome };
    }
    return result;
  }

  /**
   * Moves the conversation to `agentId`: its queued work is withdrawn, the thread moves on (a new session), and the
   * messages nobody answered go to the new agent.
   */
  async function rebind(
    unit: Tx,
    record: ConversationRecord,
    agentId: string,
    fallbackFromAgentId: string | null,
    value: ConversationNotice,
  ): Promise<void> {
    const withdrawn = await deps.runs.withdrawQueued(
      { subject: subjectOf(record.id), byUserId: record.userId },
      unit,
    );
    await conversationsRepo(unit.conn).updateMany({
      filter: { id: record.id },
      values: {
        agentId,
        fallbackFromAgentId,
        thread: Number(record.thread) + 1,
        updatedAt: now(),
      },
    });
    const moved = (await findConversation(unit.conn, record.id))!;
    const runIds = withdrawn.map((run) => run.id);
    const unanswered = await messagesRepo(unit.conn).findMany({
      filter: (f) =>
        f.and([
          f.string('conversationId').eq(record.id),
          f.string('role').eq('user'),
          f.or([
            f.string('runId').empty(),
            ...runIds.map((id) => f.string('runId').eq(id)),
          ]),
        ]),
      sort: (sort) => sort.field('seq').asc(),
    });
    await notice(unit, moved, value);
    await wake(unit, moved, unanswered);
  }

  // -------------------------------------------------------------------------------------------------------------------
  // Turning run events into messages
  // -------------------------------------------------------------------------------------------------------------------

  /** Appends the run's new text events as assistant messages, in the caller's transaction. */
  async function syncIn(unit: Tx, run: Run): Promise<void> {
    if (run.subject.kind !== CONVERSATION_SUBJECT) return;
    const record = await lockConversation(unit.conn, run.subject.id, now());
    if (!record || record.userId !== run.actorUserId) return;
    let after: number;
    if (record.syncRunId === run.id) after = Number(record.syncSeq);
    else {
      const last = await messagesRepo(unit.conn).findOne({
        filter: (f) =>
          f.and([
            f.string('runId').eq(run.id),
            f.number('runEventSeq').notEmpty(),
          ]),
        sort: (sort) => sort.field('runEventSeq').desc(),
      });
      after = last ? Number(last.runEventSeq) : 0;
    }
    const start = after;
    for (;;) {
      const events = await eventsAfter(unit.conn, run.id, after, SYNC_PAGE);
      for (const event of events) {
        after = Number(event.seq);
        const text = event.type === 'text' ? (event.content ?? '') : '';
        if (text.trim() === '') continue;
        const metadata = {
          agentId: run.agentId,
          runEventSeq: Number(event.seq),
        };
        // An online agent's draft of this text becomes the final message, where the person watched it grow.
        const draft = await findDraft(unit.conn, record.id, run.id);
        if (draft) {
          await rewriteMessage(
            unit.conn,
            draft,
            { text, metadata, runEventSeq: Number(event.seq) },
            now(),
          );
          changed(unit, record, Number(draft.seq));
          continue;
        }
        await append(unit, record, {
          role: 'assistant',
          text,
          runId: run.id,
          runEventSeq: Number(event.seq),
          metadata,
          at: event.at,
        });
      }
      if (events.length < SYNC_PAGE) break;
    }
    if (after !== start || record.syncRunId !== run.id)
      await conversationsRepo(unit.conn).updateMany({
        filter: { id: record.id },
        values: { syncRunId: run.id, syncSeq: after },
      });
  }

  // -------------------------------------------------------------------------------------------------------------------
  // The run subject
  // -------------------------------------------------------------------------------------------------------------------

  /** A run's assembly in `conversation`, as its owner (`ownerName`) left it: `history` the messages before its inputs. */
  async function conversationAssembly(
    conn: DatabaseConnection,
    claim: ClaimContext,
    conversation: ConversationRef & { readonly createdAt: string },
    ownerName: string,
    history: readonly HistoryLine[],
    previousSummary: string | null,
    chosen: OnlineModelEntry | null,
  ): Promise<SubjectAssembly> {
    const key = conversationKey(conversation.id);
    const added = await Promise.all(
      rules.map((source) =>
        source(conn, {
          conversation: {
            id: conversation.id,
            userId: conversation.userId,
            agentId: conversation.agentId,
            title: conversation.title,
            source: conversation.source,
          },
          agent: claim.agent,
          ownerName,
          cli: claim.cli,
          dialect: claim.dialect,
        }),
      ),
    );
    return {
      subject: {
        key,
        ...(conversation.title ? { title: conversation.title } : {}),
        url: conversationUrl(conversation.id),
        noun: 'conversation',
      },
      system: conversationSystemLayer({
        agentName: claim.agent.name,
        ownerName,
        key,
        cli: claim.cli,
        appName: claim.appName,
        dialect: claim.dialect,
        rules: added.flatMap((lines) => lines.rules ?? []),
        sections: added.flatMap((lines) => lines.sections ?? []),
      }),
      task: conversationTask({
        key,
        title: conversation.title,
        ownerName,
      }),
      context: conversationContext({
        title: conversation.title,
        startedAt: conversation.createdAt,
        history,
      }),
      turn: {
        prompt: conversationTurn(claim.inputs.length),
        ...(previousSummary ? { previousSummary } : {}),
      },
      data: {
        kind: CONVERSATION_SUBJECT,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          ownerUserId: conversation.userId,
          source: conversation.source,
        },
      },
      dirs: [],
      scopes: [],
      ...(chosen ? { model: chosen } : {}),
    };
  }

  const binding: SubjectBinding = {
    kind: CONVERSATION_SUBJECT,
    private: true,
    // A conversation needs no working directory: online agents answer in it as well as runner agents.
    agentTypes: ['online', 'runner'],
    title: { key: 'subjects.conversation', ns: ACCESS_NAMESPACE },
    triggers: CONVERSATION_TRIGGERS,
    // "Preview full prompt": a new conversation of the previewer's, with one message, both made up.
    preview: {
      inputs: (user, at) => [
        {
          id: 'preview',
          type: 'comment',
          at,
          actor: { kind: 'user', id: user.id, name: user.name },
          text: sampleValue('What is waiting for me this week?'),
          payload: { trigger: 'message' },
        },
      ],
      async assemble(conn, claim) {
        return conversationAssembly(
          conn,
          claim,
          {
            id: claim.run.subject.id,
            userId: claim.run.actorUserId ?? '',
            agentId: claim.agent.id,
            title: sampleValue('This week'),
            source: 'panel',
            createdAt: claim.run.createdAt,
          },
          await nameOf(conn, claim.run.actorUserId ?? ''),
          [],
          null,
          null,
        );
      },
    },
    context: {
      async assemble(conn, claim) {
        const record = await findConversation(conn, claim.run.subject.id);
        // Only the owner's runs see a conversation (a preview by anyone else, too, finds nothing).
        if (!record || record.userId !== claim.run.actorUserId)
          throw new Error('The conversation is gone.');
        const ownerName = await nameOf(conn, record.userId);
        const fresh =
          !claim.runner ||
          !(await hasSession(conn, {
            agentId: claim.agent.id,
            runnerId: claim.runner.id,
            subjectKind: CONVERSATION_SUBJECT,
            subjectId: record.id,
            threadScope: claim.run.threadScope,
          }));
        const pending = new Set(
          claim.inputs.flatMap((input) => {
            const payload = input.payload as
              { messageId?: unknown } | undefined;
            return typeof payload?.messageId === 'string'
              ? [payload.messageId]
              : [];
          }),
        );
        let history: HistoryLine[] = [];
        if (fresh) {
          const recent = await messagesRepo(conn).findMany({
            filter: { conversationId: record.id },
            sort: (sort) => sort.field('seq').desc(),
            limit: CONVERSATION_HISTORY_IN_PROMPT + pending.size,
          });
          history = recent
            .filter((message) => !pending.has(message.id))
            .slice(0, CONVERSATION_HISTORY_IN_PROMPT)
            .reverse()
            .map((message) => {
              const view = toMessage(message);
              return {
                role: view.role,
                author:
                  view.role === 'user'
                    ? ownerName
                    : view.role === 'assistant'
                      ? claim.agent.name
                      : claim.appName,
                at: view.createdAt,
                text: [
                  view.content.content,
                  attachmentLines(storedAttachments(message.attachments)),
                ]
                  .filter((part) => part.trim() !== '')
                  .join('\n\n'),
              };
            });
        }
        const previousSummary = fresh
          ? await lastSummary(
              conn,
              {
                agentId: claim.agent.id,
                subjectKind: CONVERSATION_SUBJECT,
                subjectId: record.id,
              },
              claim.run.id,
            )
          : null;
        return conversationAssembly(
          conn,
          claim,
          { ...refOf(record), createdAt: record.createdAt },
          ownerName,
          history,
          previousSummary,
          chosenModel(record) ?? null,
        );
      },
    },
    sink: {
      async onRunFinished(unit, run) {
        await syncIn(unit, run);
        const record = await findConversation(unit.conn, run.subject.id);
        if (!record || record.userId !== run.actorUserId) return;
        // A consultation card the run never closed (the instance stopped) ends as failed.
        for (const message of await messagesRepo(unit.conn).findMany({
          filter: { conversationId: record.id, runId: run.id, role: 'system' },
        })) {
          const { streaming, ...kept } = metadataOf(message);
          if (!streaming || kept.notice?.code !== 'consultation') continue;
          await rewriteMessage(
            unit.conn,
            message,
            {
              text: toMessage(message).content.content,
              metadata: {
                ...kept,
                notice: {
                  ...kept.notice,
                  state: 'failed',
                  error: 'The consultation ended with the run that asked it.',
                },
              },
            },
            now(),
          );
          changed(unit, record, Number(message.seq));
        }
        // A draft the run never made final keeps what it had written.
        const draft = await findDraft(unit.conn, record.id, run.id);
        if (draft) {
          const { streaming: _streaming, ...kept } = metadataOf(draft);
          await rewriteMessage(
            unit.conn,
            draft,
            {
              text: toMessage(draft).content.content,
              metadata: { ...kept, interrupted: true },
            },
            now(),
          );
          changed(unit, record, Number(draft.seq));
        }
        if (run.status !== 'failed') return;
        await notice(
          unit,
          record,
          { code: 'runFailed', runId: run.id, reason: run.failureReason },
          run.id,
        );
      },
    },
  };

  // -------------------------------------------------------------------------------------------------------------------
  // The service
  // -------------------------------------------------------------------------------------------------------------------

  async function pickAgent(
    conn: DatabaseConnection,
    userId: string,
    requested: string | undefined,
  ): Promise<Agent> {
    if (requested) {
      const agent = await findAgent(conn, requested);
      if (!agent)
        throw invalid('agentId names no agent.', { field: 'agentId' });
      if (!wakeable(agent, userId, deps.agents.mayInvoke))
        throw forbidden('You may not chat with this agent.');
      return agent;
    }
    const { defaultAgentId } = await deps.settings.preferences(userId, conn);
    if (defaultAgentId) {
      const mine = await findAgent(conn, defaultAgentId);
      if (wakeable(mine, userId, deps.agents.mayInvoke)) return mine;
    }
    const system = await systemDefault(conn, userId);
    if (system) return system;
    throw conversationConflict(
      'noChatAgent',
      'There is no agent to chat with: pick one, or ask an administrator to set the default chat agent.',
    );
  }

  function titleFor(value: string, max: number): string {
    const { text, length } = cleanTitle(value);
    if (length === 0 || length > max)
      throw invalid(`title must be 1 to ${max} characters.`);
    return text;
  }

  async function sendMessage(
    userId: string,
    id: string,
    request: SendMessageRequest,
  ): Promise<SendMessageResult> {
    const content = request.content;
    const attachmentIds = readAttachmentIds(request.attachmentIds);
    if (
      typeof content !== 'string' ||
      (content.trim() === '' && attachmentIds.length === 0) ||
      [...content].length > MESSAGE_CONTENT_MAX
    )
      throw invalid(
        `content must be 1 to ${MESSAGE_CONTENT_MAX} characters, or empty with files.`,
      );
    const links = deps.attachments;
    if (attachmentIds.length > 0 && !links)
      throw invalid('This application takes no files in chat.', {
        field: 'attachmentIds',
      });
    await owned(tx.read(), userId, id);
    // Resolved before the transaction: resolvers read through the services of the plugins that own the kinds.
    const context = request.context
      ? await deps.contextKinds.resolve(tx.read(), userId, request.context)
      : null;
    const sent = await tx.run(async (unit) => {
      const record = await lockOwned(unit, userId, id);
      const at = now();
      if (record.archivedAt || (record.titleSource === 'auto' && !record.title))
        await conversationsRepo(unit.conn).updateMany({
          filter: { id },
          values: {
            archivedAt: null,
            ...(record.titleSource === 'auto' && !record.title
              ? {
                  title:
                    autoTitle(content, CONVERSATION_TITLE_AUTO_CHARS) || null,
                }
              : {}),
            updatedAt: at,
          },
        });
      let message = await append(unit, record, {
        role: 'user',
        text: content,
        workContext: context,
        metadata: request.clientId ? { clientId: request.clientId } : {},
      });
      if (links && attachmentIds.length > 0) {
        const files = await links.attach(
          unit.conn,
          userId,
          { conversationId: id, messageId: message.id },
          attachmentIds,
        );
        await messagesRepo(unit.conn).updateMany({
          filter: { id: message.id },
          values: { attachments: asJson(files) },
        });
        message = (await messagesRepo(unit.conn).findOne({
          filter: { id: message.id },
        }))!;
      }
      const run = await wake(unit, record, [message]);
      await conversationsRepo(unit.conn).updateMany({
        filter: { id },
        values: { read: true },
      });
      return {
        run,
        message: (await messagesRepo(unit.conn).findOne({
          filter: { id: message.id },
        }))!,
      };
    });
    return {
      message: viewOf(sent.message),
      run: sent.run,
      conversation: await detail(userId, id),
    } satisfies SendMessageResult;
  }

  const service: ConversationService = {
    binding,
    contextKinds: deps.contextKinds,
    sources,

    async list(userId, query) {
      const conn = tx.read();
      const limit = limitOf(
        query.pageSize,
        CONVERSATION_PAGE_DEFAULT,
        CONVERSATION_PAGE_MAX,
      );
      const cursor = query.pageToken ? decodeCursor(query.pageToken) : null;
      const q = query.q?.trim();
      const rows = await conversationsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('userId').eq(userId),
            ...(query.archived === 'all'
              ? []
              : [
                  query.archived
                    ? f.date('archivedAt').notEmpty()
                    : f.date('archivedAt').empty(),
                ]),
            ...(query.agentId ? [f.string('agentId').eq(query.agentId)] : []),
            ...(query.source ? [f.string('source').eq(query.source)] : []),
            ...(q
              ? [
                  f.or([
                    f.string('title').includes(q, { mode: 'insensitive' }),
                    f
                      .relation('messages')
                      .some((message) =>
                        message
                          .text('searchText')
                          .includes(q, { mode: 'insensitive' }),
                      ),
                  ]),
                ]
              : []),
            ...(cursor ? [f.date('lastMessageAt').notAfter(cursor.at)] : []),
          ]),
        sort: (sort) => [
          sort.field('lastMessageAt').desc(),
          sort.field('id').desc(),
        ],
        // Rows tied with the cursor's time that the previous page showed are skipped below.
        limit: limit + 1 + (cursor ? 50 : 0),
      });
      const after = cursor
        ? rows.filter(
            (row) =>
              Date.parse(row.lastMessageAt) < Date.parse(cursor.at) ||
              (Date.parse(row.lastMessageAt) === Date.parse(cursor.at) &&
                row.id < cursor.id),
          )
        : rows;
      const page = after.slice(0, limit);
      const last = page[page.length - 1];
      return {
        items: await summaries(conn, page),
        nextCursor:
          after.length > limit && last
            ? encodeCursor(last.lastMessageAt, last.id)
            : null,
      } satisfies ConversationPage;
    },

    async create(userId, request) {
      const wanted = request.model ?? null;
      // Read before the transaction, which a read on another connection would wait for.
      const fallback = wanted
        ? ((await deps.models.catalog()).defaultModel ?? null)
        : null;
      const id = await tx.run(async (unit) => {
        const agent = await pickAgent(unit.conn, userId, request.agentId);
        if (
          wanted &&
          (agent.type !== 'online' ||
            !onlineEntriesOrDefault(agent, fallback).some((entry) =>
              sameEntry(entry, wanted),
            ))
        )
          throw invalid(
            `The agent does not list the model ${wanted.modelService} · ${wanted.model}.`,
            { reason: 'MODEL_NOT_LISTED' },
          );
        const title =
          request.title === undefined
            ? null
            : titleFor(request.title, CONVERSATION_TITLE_MAX);
        const at = now();
        const source = request.source ?? 'panel';
        if (source !== 'panel' && !sources.has(source))
          throw invalid(`${source} is not a source conversations start from.`);
        const conversationId = ids.next();
        await conversationsRepo(unit.conn).createOne({
          values: {
            id: conversationId,
            userId,
            agentId: agent.id,
            mode: agent.type,
            fallbackFromAgentId: null,
            modelService: wanted?.modelService ?? null,
            model: wanted?.model ?? null,
            title,
            titleSource: title ? 'user' : 'auto',
            category: 'chat',
            source,
            read: true,
            thread: 0,
            lastSeq: 0,
            syncRunId: null,
            syncSeq: 0,
            lastMessageAt: at,
            archivedAt: null,
            lockedAt: null,
            createdAt: at,
            updatedAt: at,
          },
        });
        changed(unit, (await findConversation(unit.conn, conversationId))!);
        return conversationId;
      });
      return detail(userId, id);
    },

    get: detail,

    async update(userId, id, patch) {
      // Read before the transaction, which a read on another connection would wait for.
      const fallback =
        patch.model !== undefined && patch.model !== null
          ? ((await deps.models.catalog()).defaultModel ?? null)
          : null;
      await tx.run(async (unit) => {
        const record = await lockOwned(unit, userId, id);
        const values: Record<string, unknown> = {};
        if (patch.title !== undefined) {
          values.title = titleFor(patch.title, CONVERSATION_TITLE_MAX);
          values.titleSource = 'user';
        }
        if (patch.archived !== undefined)
          values.archivedAt = patch.archived
            ? (record.archivedAt ?? now())
            : null;
        if (patch.model !== undefined) {
          const wanted = patch.model;
          if (wanted !== null) {
            const agent = await findAgent(unit.conn, record.agentId);
            if (
              record.mode !== 'online' ||
              !agent ||
              !onlineEntriesOrDefault(agent, fallback).some((entry) =>
                sameEntry(entry, wanted),
              )
            )
              throw invalid(
                `The agent does not list the model ${wanted.modelService} · ${wanted.model}.`,
                { reason: 'MODEL_NOT_LISTED' },
              );
          }
          values.modelService = wanted?.modelService ?? null;
          values.model = wanted?.model ?? null;
        }
        if (Object.keys(values).length === 0) return;
        await conversationsRepo(unit.conn).updateMany({
          filter: { id },
          values: { ...values, updatedAt: now() },
        });
        changed(unit, record);
      });
      return detail(userId, id);
    },

    async messages(userId, id, query) {
      const conn = tx.read();
      const record = await owned(conn, userId, id);
      const limit = limitOf(
        query.limit,
        MESSAGE_PAGE_DEFAULT,
        MESSAGE_PAGE_MAX,
      );
      const current = (await findConversation(conn, id)) ?? record;
      let rows: MessageRecord[];
      let hasMore: boolean;
      if (query.after !== undefined) {
        rows = await messagesRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.string('conversationId').eq(id),
              f.number('seq').gt(query.after!),
            ]),
          sort: (sort) => sort.field('seq').asc(),
          limit,
        });
        const first = rows[0];
        hasMore = first ? Number(first.seq) > 1 : Number(current.lastSeq) > 0;
      } else {
        const newest = await messagesRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.string('conversationId').eq(id),
              ...(query.before !== undefined
                ? [f.number('seq').lt(query.before)]
                : []),
            ]),
          sort: (sort) => sort.field('seq').desc(),
          limit: limit + 1,
        });
        hasMore = newest.length > limit;
        rows = newest.slice(0, limit).reverse();
      }
      return {
        items: rows.map((row) => viewOf(row)),
        hasMore,
        lastSeq: Number(current.lastSeq),
      } satisfies MessagePage;
    },

    send: (userId, id, request) => sendMessage(userId, id, request),

    async start(userId, request) {
      if (!sources.has(request.source))
        throw invalid(
          `source must be one of ${
            sources
              .list()
              .map((source) => source.key)
              .join(', ') || '(none registered)'
          }.`,
        );
      if (typeof request.text !== 'string' || request.text.trim() === '')
        throw invalid('text is required.');
      if ([...request.text].length > MESSAGE_CONTENT_MAX)
        throw invalid(
          `The text is longer than a message may be (${MESSAGE_CONTENT_MAX} characters).`,
        );
      const conversation = await service.create(userId, {
        ...(request.agentId ? { agentId: request.agentId } : {}),
        ...(request.title ? { title: request.title } : {}),
        source: request.source,
      });
      return sendMessage(userId, conversation.id, {
        content: request.text,
        ...(request.context ? { context: request.context } : {}),
        ...(request.clientId ? { clientId: request.clientId } : {}),
      });
    },

    async markRead(userId, id) {
      await tx.run(async (unit) => {
        const record = await lockOwned(unit, userId, id);
        if (record.read) return;
        await conversationsRepo(unit.conn).updateMany({
          filter: { id },
          values: { read: true },
        });
        changed(unit, record);
      });
      return detail(userId, id);
    },

    async stop(userId, id) {
      await tx.run(async (unit) => {
        const record = await lockOwned(unit, userId, id);
        const open = await openRunsOnEach(unit.conn, CONVERSATION_SUBJECT, [
          id,
        ]);
        for (const run of open) {
          await deps.runs.cancel(run.id, userId, unit);
          await notice(
            unit,
            record,
            { code: 'runCancelled', runId: run.id },
            run.id,
          );
        }
      });
      return detail(userId, id);
    },

    async fallback(userId, id) {
      await tx.run(async (unit) => {
        const record = await lockOwned(unit, userId, id);
        const system = await systemDefault(unit.conn, userId);
        if (
          !system ||
          record.fallbackFromAgentId ||
          system.id === record.agentId ||
          system.type !== record.mode
        )
          throw conversationConflict(
            'noFallback',
            'This conversation cannot switch to the default agent.',
          );
        await rebind(unit, record, system.id, record.agentId, {
          code: 'switchedToDefault',
          agentId: system.id,
          fromAgentId: record.agentId,
        });
      });
      return detail(userId, id);
    },

    async restore(userId, id) {
      await tx.run(async (unit) => {
        const record = await lockOwned(unit, userId, id);
        const own = record.fallbackFromAgentId
          ? await findAgent(unit.conn, record.fallbackFromAgentId)
          : null;
        if (!own || !wakeable(own, userId, deps.agents.mayInvoke))
          throw conversationConflict(
            'noRestore',
            'This conversation cannot switch back to its own agent now.',
          );
        await rebind(unit, record, own.id, null, {
          code: 'switchedBack',
          agentId: own.id,
          fromAgentId: record.agentId,
        });
      });
      return detail(userId, id);
    },

    async setTitleFromRun(run, title) {
      const conversation = await tx.run(async (unit) => {
        if (run.subject.kind !== CONVERSATION_SUBJECT)
          throw notFound('Conversation');
        const record = await lockConversation(unit.conn, run.subject.id, now());
        if (!record || record.userId !== run.actorUserId)
          throw notFound('Conversation');
        if (record.titleSource === 'user')
          throw conversationConflict(
            'titleLocked',
            'The person renamed this conversation; keep their title.',
          );
        await conversationsRepo(unit.conn).updateMany({
          filter: { id: record.id },
          values: {
            title: titleFor(title, CONVERSATION_TITLE_AGENT_MAX),
            titleSource: 'agent',
            updatedAt: now(),
          },
        });
        changed(unit, record);
        return record;
      });
      return detail(conversation.userId, conversation.id);
    },

    async ofRun(conn, run) {
      if (run.subject.kind !== CONVERSATION_SUBJECT) return null;
      const record = await findConversation(conn, run.subject.id);
      if (!record || record.userId !== run.actorUserId) return null;
      return refOf(record);
    },

    async homeOf(conn, run) {
      let current: Pick<Run, 'subject' | 'actorUserId'> & {
        readonly parentRunId?: string | null;
      } = run;
      // A consultation's chain is short (`CONSULT_MAX_DEPTH`); a broken link ends it.
      for (
        let hop = 0;
        current.parentRunId && hop <= CONSULT_MAX_DEPTH;
        hop += 1
      ) {
        const parent = await findRunRecord(conn, current.parentRunId);
        if (!parent || parent.actorUserId !== run.actorUserId) return null;
        current = toRun(parent);
      }
      if (current.parentRunId || current.subject.kind !== CONVERSATION_SUBJECT)
        return null;
      const record = await findConversation(conn, current.subject.id);
      if (!record || record.userId !== run.actorUserId) return null;
      return refOf(record);
    },

    async consultation(run, card) {
      if (run.subject.kind !== CONVERSATION_SUBJECT) return;
      await tx.run(async (unit) => {
        const record = await lockConversation(unit.conn, run.subject.id, now());
        if (!record || record.userId !== run.actorUserId) return;
        const metadata: MessageMetadata = {
          notice: card,
          ...(card.agentId ? { agentId: card.agentId } : {}),
          ...(card.state === 'running' ? { streaming: true } : {}),
        };
        const existing = (
          await messagesRepo(unit.conn).findMany({
            filter: {
              conversationId: record.id,
              runId: run.id,
              role: 'system',
            },
          })
        ).find((message) => {
          const notice = metadataOf(message).notice;
          return (
            notice?.code === 'consultation' && notice.callId === card.callId
          );
        });
        if (existing) {
          await rewriteMessage(
            unit.conn,
            existing,
            { text: noticeText(card, new Map()), metadata },
            now(),
          );
          changed(unit, record, Number(existing.seq));
          return;
        }
        await append(unit, record, {
          role: 'system',
          text: noticeText(card, new Map()),
          metadata,
          runId: run.id,
        });
      });
    },

    async deliver(outer, conversationId, news) {
      const record = await lockConversation(outer.conn, conversationId, now());
      if (!record) return null;
      await notice(outer, record, news.notice);
      if (!news.input) return null;
      const agent = await findAgent(outer.conn, record.agentId);
      if (!wakeable(agent, record.userId, deps.agents.mayInvoke)) return null;
      const enqueued = queuedRun(
        await deps.runs.enqueue(
          {
            agentId: agent.id,
            subject: subjectOf(record.id),
            threadScope: threadScopeOf(record),
            actorUserId: record.userId,
            ownerUserId: record.userId,
            input: news.input,
          },
          outer,
        ),
      );
      return { id: enqueued.runId, outcome: enqueued.outcome };
    },

    lock: async (conn, id) =>
      (await lockConversation(conn, id, now())) !== null,

    rules: {
      provide(source) {
        rules.push(source);
        return () => {
          const at = rules.indexOf(source);
          if (at >= 0) rules.splice(at, 1);
        };
      },
    },

    async syncRun(runId) {
      const run = await deps.runs.get(runId);
      if (run.subject.kind !== CONVERSATION_SUBJECT) return;
      await tx.run((unit) => syncIn(unit, run));
    },

    async streamDraft(run, text) {
      if (run.subject.kind !== CONVERSATION_SUBJECT) return;
      await tx.run(async (unit) => {
        const record = await lockConversation(unit.conn, run.subject.id, now());
        if (!record || record.userId !== run.actorUserId) return;
        const draft = await findDraft(unit.conn, record.id, run.id);
        if (draft) {
          await rewriteMessage(
            unit.conn,
            draft,
            {
              text,
              metadata: { ...metadataOf(draft), streaming: true },
            },
            now(),
          );
          changed(unit, record, Number(draft.seq));
          return;
        }
        if (text.trim() === '') return;
        await append(unit, record, {
          role: 'assistant',
          text,
          runId: run.id,
          metadata: { agentId: run.agentId, streaming: true },
        });
      });
    },

    async chatAgents(userId) {
      const conn = tx.read();
      const [agents, runners, settings, preferences, catalog] =
        await Promise.all([
          deps.agents.list(),
          deps.runners.list(),
          deps.settings.settings(conn),
          deps.settings.preferences(userId, conn),
          deps.models.catalog(),
        ]);
      return agents
        .filter((agent) => deps.agents.mayInvoke(agent, userId))
        .map((agent): ChatAgent => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          nameText: agent.nameText,
          descriptionText: agent.descriptionText,
          avatar: agent.avatar,
          type: agent.type,
          models:
            agent.type === 'online'
              ? chatModelChoices(
                  onlineEntriesOrDefault(agent, catalog.defaultModel ?? null),
                  catalog,
                )
              : [],
          personal:
            agent.ownerUserId === userId && agent.access === 'ownerOnly',
          isSystemDefault: agent.id === settings.defaultAgentId,
          isMyDefault: agent.id === preferences.defaultAgentId,
          availability: availabilityOf(
            agent,
            userId,
            deps.agents.mayInvoke,
            runners,
            catalog,
          ),
        }));
    },

    async copyAgent(userId, agentId, request) {
      const source = await deps.agents.get(agentId);
      if (!deps.agents.mayInvoke(source, userId)) throw notFound('Agent');
      const name = request.name?.trim() || `${source.name} (copy)`;
      if ([...name].length > 200)
        throw invalid('name must be at most 200 characters.');
      const copy = await deps.agents.create(userId, {
        name,
        description: source.description,
        descriptionText: source.descriptionText,
        avatar: source.avatar,
        type: source.type,
        modelEntries: source.modelEntries,
        instructions: source.instructions,
        actions: source.actions,
        confirmChanges: source.confirmChanges,
        access: 'ownerOnly',
        userIds: [],
        ownerUserId: userId,
        runnerIds: source.runnerIds,
        skillIds: source.skillIds,
        maxConcurrentRuns: source.maxConcurrentRuns,
        maxAttempts: source.maxAttempts,
        toolPolicy: source.toolPolicy,
      });
      if (request.makeDefault)
        await deps.settings.updatePreferences(userId, {
          defaultAgentId: copy.id,
        });
      return copy;
    },
  };
  return service;
}
