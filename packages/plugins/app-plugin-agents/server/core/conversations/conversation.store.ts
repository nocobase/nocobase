/**
 * The conversation collections: `agConversations`, `agConversationMessages`, `agChatPreferences` and `agSettings`. Only
 * the conversations domain reads or writes them.
 *
 * Every change to a conversation first writes its row (`lockConversation`): on databases with row locks, concurrent
 * changes to the same conversation wait there, so the message `seq` and the sync cursor read next are current.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type {
  ConversationCategory,
  ConversationMessage,
  ConversationMode,
  ConversationSource,
  MessageContent,
  MessageMetadata,
  MessageRole,
  ResolvedPageContext,
  TitleSource,
} from '../../../shared/conversations.js';
import type { IdSource } from '../../kernel/ids.js';
import { asJson, jsonObject, type JsonColumn } from '../../kernel/values.js';
import {
  attachmentView,
  storedAttachments,
  type StoredAttachment,
} from './attachments.js';

export interface ConversationRecord {
  readonly id: string;
  readonly userId: string;
  readonly agentId: string;
  readonly mode: ConversationMode;
  readonly fallbackFromAgentId: string | null;
  readonly modelService?: string | null;
  readonly model?: string | null;
  readonly title: string | null;
  readonly titleSource: TitleSource;
  readonly category: ConversationCategory;
  readonly source: ConversationSource;
  readonly read: boolean;
  readonly thread: number;
  readonly lastSeq: number;
  readonly syncRunId: string | null;
  readonly syncSeq: number;
  readonly lastMessageAt: string;
  readonly archivedAt: string | null;
  readonly lockedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MessageRecord {
  readonly id: string;
  readonly conversationId: string;
  readonly seq: number;
  readonly role: MessageRole;
  readonly content: JsonColumn;
  readonly searchText: string;
  readonly toolCalls: JsonColumn;
  readonly attachments: JsonColumn;
  readonly workContext: JsonColumn;
  readonly metadata: JsonColumn;
  readonly runId: string | null;
  readonly runEventSeq: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PreferencesRecord {
  readonly userId: string;
  readonly defaultAgentId: string | null;
  readonly updatedAt: string;
}

export interface SettingRecord {
  readonly key: string;
  readonly value: JsonColumn;
  readonly updatedById: string | null;
  readonly updatedAt: string;
}

export function conversationsRepo(
  conn: DatabaseConnection,
): Repository<ConversationRecord> {
  return conn.repository<ConversationRecord>('agConversations');
}

export function messagesRepo(
  conn: DatabaseConnection,
): Repository<MessageRecord> {
  return conn.repository<MessageRecord>('agConversationMessages');
}

export function preferencesRepo(
  conn: DatabaseConnection,
): Repository<PreferencesRecord> {
  return conn.repository<PreferencesRecord>('agChatPreferences');
}

export function settingsRepo(
  conn: DatabaseConnection,
): Repository<SettingRecord> {
  return conn.repository<SettingRecord>('agSettings');
}

export async function findConversation(
  conn: DatabaseConnection,
  id: string,
): Promise<ConversationRecord | null> {
  return (await conversationsRepo(conn).findOne({ filter: { id } })) ?? null;
}

/** Writes the conversation's row first, so concurrent changes to it wait; the row as it is now, or null. */
export async function lockConversation(
  conn: DatabaseConnection,
  id: string,
  now: string,
): Promise<ConversationRecord | null> {
  const result = await conversationsRepo(conn).updateMany({
    filter: { id },
    values: { lockedAt: now },
  });
  if (result.updatedCount !== 1) return null;
  return findConversation(conn, id);
}

export interface NewMessage {
  readonly role: MessageRole;
  readonly text: string;
  readonly workContext?: ResolvedPageContext | null;
  /** The files a user message was sent with. */
  readonly attachments?: readonly StoredAttachment[];
  readonly metadata?: MessageMetadata;
  readonly runId?: string | null;
  readonly runEventSeq?: number | null;
  /** When it happened; now by default. */
  readonly at?: string;
}

/**
 * Appends a message to a conversation the caller locked, as its next `seq`, and moves the conversation to the top of
 * its owner's list. An assistant or system message marks it unread.
 */
export async function appendMessage(
  conn: DatabaseConnection,
  ids: IdSource,
  conversationId: string,
  message: NewMessage,
  now: string,
): Promise<MessageRecord> {
  const current = await findConversation(conn, conversationId);
  if (!current) throw new Error(`Conversation ${conversationId} is missing.`);
  const seq = Number(current.lastSeq) + 1;
  const id = ids.next();
  const content: MessageContent = { type: 'text', content: message.text };
  await messagesRepo(conn).createOne({
    values: {
      id,
      conversationId,
      seq,
      role: message.role,
      content: asJson(content),
      searchText: message.text,
      toolCalls: null,
      attachments:
        message.attachments && message.attachments.length > 0
          ? asJson(message.attachments)
          : null,
      workContext: asJson(message.workContext ?? null),
      metadata: asJson(message.metadata ?? {}),
      runId: message.runId ?? null,
      runEventSeq: message.runEventSeq ?? null,
      createdAt: message.at ?? now,
      updatedAt: now,
    },
  });
  await conversationsRepo(conn).updateMany({
    filter: { id: conversationId },
    values: {
      lastSeq: seq,
      lastMessageAt: now,
      updatedAt: now,
      ...(message.role === 'user' ? {} : { read: false }),
    },
  });
  return (await messagesRepo(conn).findOne({ filter: { id } }))!;
}

/**
 * The draft of an online agent's reply in a run: its assistant message not yet tied to a run event (every final assistant
 * message is), or null.
 */
export async function findDraft(
  conn: DatabaseConnection,
  conversationId: string,
  runId: string,
): Promise<MessageRecord | null> {
  return (
    (await messagesRepo(conn).findOne({
      filter: (f) =>
        f.and([
          f.string('conversationId').eq(conversationId),
          f.string('runId').eq(runId),
          f.string('role').eq('assistant'),
          f.number('runEventSeq').empty(),
        ]),
      sort: (sort) => sort.field('seq').desc(),
    })) ?? null
  );
}

/** Rewrites a message's text and metadata in place (a draft growing, or becoming final). */
export async function rewriteMessage(
  conn: DatabaseConnection,
  message: MessageRecord,
  values: {
    readonly text: string;
    readonly metadata: MessageMetadata;
    readonly runEventSeq?: number | null;
    readonly at?: string;
  },
  now: string,
): Promise<void> {
  const content: MessageContent = { type: 'text', content: values.text };
  await messagesRepo(conn).updateMany({
    filter: { id: message.id },
    values: {
      content: asJson(content),
      searchText: values.text,
      metadata: asJson(values.metadata),
      ...(values.runEventSeq === undefined
        ? {}
        : { runEventSeq: values.runEventSeq }),
      ...(values.at === undefined ? {} : { createdAt: values.at }),
      updatedAt: now,
    },
  });
}

/** Changes a message's metadata and run, keeping what it had. */
export async function updateMessageRun(
  conn: DatabaseConnection,
  message: MessageRecord,
  runId: string,
  metadata: MessageMetadata,
  now: string,
): Promise<void> {
  await messagesRepo(conn).updateMany({
    filter: { id: message.id },
    values: {
      runId,
      metadata: asJson({ ...metadataOf(message), ...metadata }),
      updatedAt: now,
    },
  });
}

export function metadataOf(record: MessageRecord): MessageMetadata {
  return jsonObject(record.metadata);
}

function contentOf(value: unknown): MessageContent {
  const object = jsonObject(value);
  return {
    type: 'text',
    content: typeof object.content === 'string' ? object.content : '',
  };
}

function listOrNull(value: unknown): readonly unknown[] | null {
  if (typeof value === 'string') {
    try {
      return listOrNull(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  return Array.isArray(value) ? value : null;
}

function contextOf(value: unknown): ResolvedPageContext | null {
  const object = jsonObject(value);
  return typeof object.route === 'string'
    ? (object as unknown as ResolvedPageContext)
    : null;
}

/** A message as the API answers it; `basePath` is the application's public base path, for its files' URLs. */
export function toMessage(
  record: MessageRecord,
  basePath: string = '',
): ConversationMessage {
  const files = storedAttachments(record.attachments);
  return {
    id: record.id,
    conversationId: record.conversationId,
    seq: Number(record.seq),
    role: record.role,
    content: contentOf(record.content),
    toolCalls: listOrNull(record.toolCalls),
    attachments:
      files.length > 0
        ? files.map((file) => attachmentView(basePath, file))
        : null,
    workContext: contextOf(record.workContext),
    metadata: metadataOf(record),
    runId: record.runId,
    createdAt: record.createdAt,
  };
}
