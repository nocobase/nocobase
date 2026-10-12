import type { QueryAdapter, Row } from '@nocobase/db';
import { normalizeMailParticipantAddress } from '../../shared/participant.js';
import { chunks } from './serialization.js';

export interface MailParticipantSource {
  readonly id: string;
  readonly accountId: string;
  readonly sender?: unknown;
  readonly recipients: unknown;
}

export interface MailMessageParticipantRow extends Row {
  messageId: string;
  accountId: string;
  role: 'from' | 'to' | 'cc';
  address: string;
  domain: string;
}

export interface MailParticipantCollection {
  readonly rows: readonly MailMessageParticipantRow[];
  readonly malformedValues: number;
  readonly invalidAddresses: number;
}

/** Persisted address JSON is the source of truth; search text and Bcc are not. */
export function collectMessageParticipants(
  message: MailParticipantSource,
): MailParticipantCollection {
  const rows: MailMessageParticipantRow[] = [];
  let malformedValues = 0;
  let invalidAddresses = 0;
  const parseObject = (value: unknown): Record<string, unknown> | undefined => {
    if (value === null || value === undefined) return undefined;
    let parsed: unknown = value;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed) as unknown;
      } catch {
        malformedValues++;
        return undefined;
      }
    }
    if (parsed === null) return undefined;
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      malformedValues++;
      return undefined;
    }
    return parsed as Record<string, unknown>;
  };
  const add = (
    role: MailMessageParticipantRow['role'],
    candidates: readonly unknown[],
  ): void => {
    const seen = new Set<string>();
    for (const candidate of candidates) {
      const address =
        candidate !== null && typeof candidate === 'object'
          ? normalizeMailParticipantAddress(
              (candidate as Record<string, unknown>).address,
            )
          : undefined;
      if (!address) {
        invalidAddresses++;
        continue;
      }
      if (seen.has(address.address)) continue;
      seen.add(address.address);
      rows.push({
        messageId: message.id,
        accountId: message.accountId,
        role,
        ...address,
      });
    }
  };
  const sender = parseObject(message.sender);
  if (sender) add('from', [sender]);
  const recipients = parseObject(message.recipients);
  for (const role of ['to', 'cc'] as const) {
    const candidates = recipients?.[role];
    if (candidates === undefined) continue;
    if (!Array.isArray(candidates)) {
      malformedValues++;
      continue;
    }
    add(role, candidates);
  }
  return { rows, malformedValues, invalidAddresses };
}

/** Use the caller's message-write transaction, never an independent connection. */
export async function replaceMessageParticipants(
  query: QueryAdapter,
  messages: readonly MailParticipantSource[],
): Promise<void> {
  await deleteMessageParticipants(
    query,
    messages.map((message) => message.id),
  );
  let malformedValues = 0;
  let invalidAddresses = 0;
  let batch: MailMessageParticipantRow[] = [];
  const flush = async (): Promise<void> => {
    if (batch.length === 0) return;
    await query
      .insertInto<MailMessageParticipantRow>('mailMessageParticipants')
      .values(batch)
      .execute();
    batch = [];
  };
  for (const message of messages) {
    const collected = collectMessageParticipants(message);
    malformedValues += collected.malformedValues;
    invalidAddresses += collected.invalidAddresses;
    // Share batches across messages without flattening the entire mailbox.
    // Five bindings per row: even one mass-recipient message must be bounded.
    for (const row of collected.rows) {
      batch.push(row);
      if (batch.length === 100) await flush();
    }
  }
  await flush();
  if (malformedValues || invalidAddresses) {
    // Aggregate counts only: never disclose account/message IDs or addresses.
    process.emitWarning(
      `Mail participant indexing skipped values: malformedValues=${malformedValues}, invalidAddresses=${invalidAddresses}.`,
      { code: 'MAIL_PARTICIPANT_INDEX_SKIPPED' },
    );
  }
}

export async function deleteMessageParticipants(
  query: QueryAdapter,
  messageIds: readonly string[],
  accountId?: string,
): Promise<void> {
  for (const ids of chunks(messageIds, 100)) {
    let deletion = query
      .deleteFrom('mailMessageParticipants')
      .where('messageId', 'in', ids);
    if (accountId !== undefined)
      deletion = deletion.where('accountId', '=', accountId);
    await deletion.execute();
  }
}
