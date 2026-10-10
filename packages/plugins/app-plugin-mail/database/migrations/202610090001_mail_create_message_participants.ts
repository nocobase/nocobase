import {
  defineMigration,
  type MigrationDefinition,
  type Row,
} from '@nocobase/db';

interface MessageAddresses {
  readonly id: string;
  readonly accountId: string;
  readonly sender: unknown;
  readonly recipients: unknown;
}

interface ParticipantRow extends Row {
  readonly messageId: string;
  readonly accountId: string;
  readonly role: 'from' | 'to' | 'cc';
  readonly address: string;
  readonly domain: string;
}

// These rules belong to this historical migration, not the live address parser.
function normalizeAddress(
  value: unknown,
): { address: string; domain: string } | undefined {
  if (typeof value !== 'string') return undefined;
  if (/[^\u0021-\u007e]/.test(value.trim())) return undefined;
  const address = value.trim().toLowerCase();
  if (address.length > 320) return undefined;
  const at = address.indexOf('@');
  if (at <= 0 || at !== address.lastIndexOf('@')) return undefined;
  const local = address.slice(0, at);
  if (
    local.length > 64 ||
    !/^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/.test(
      local,
    )
  )
    return undefined;
  const domain = address.slice(at + 1);
  if (domain.length > 253 || !domain.includes('.')) return undefined;
  if (
    domain
      .split('.')
      .some(
        (label) =>
          label.length === 0 ||
          label.length > 63 ||
          !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
      )
  )
    return undefined;
  return { address, domain };
}

const migration: MigrationDefinition = defineMigration({
  name: '202610090001_mail_create_message_participants',
  async up({ builder, query }) {
    await builder.createCollection('mailMessageParticipants', (collection) => {
      collection.uuid('messageId', { nullable: false });
      collection.uuid('accountId', { nullable: false });
      collection.string('role', { length: 4, nullable: false });
      collection.string('address', { length: 320, nullable: false });
      collection.string('domain', { length: 253, nullable: false });
      collection.primary(['messageId', 'role', 'address'], {
        name: 'mail_participants_pk',
      });
      collection.index(['accountId', 'address', 'messageId'], {
        name: 'mail_participants_address_idx',
      });
      collection.index(['accountId', 'domain', 'messageId'], {
        name: 'mail_participants_domain_idx',
      });
      // One cascade path only: the owning message already belongs to an account.
      collection.foreignKey('messageId', {
        references: { collection: 'mailMessages', fields: ['id'] },
        onDelete: 'cascade',
      });
    });
    let skippedAddresses = 0;
    let malformedValues = 0;
    const object = (value: unknown): Record<string, unknown> | undefined => {
      if (value == null) return undefined;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value) as unknown;
        } catch {
          malformedValues += 1;
          return undefined;
        }
      }
      if (value === null) return undefined;
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        malformedValues += 1;
        return undefined;
      }
      return value as Record<string, unknown>;
    };
    try {
      let after: string | undefined;
      while (true) {
        let page = query
          .selectFrom('mailMessages')
          .select(['id', 'accountId', 'sender', 'recipients'])
          .orderBy('id', 'asc')
          .limit(100);
        if (after) page = page.where('id', '>', after);
        const messages = await page.execute<MessageAddresses>();
        if (messages.length === 0) break;
        let batch: ParticipantRow[] = [];
        for (const message of messages) {
          const sender = object(message.sender);
          const recipients = object(message.recipients);
          const seen = new Set<string>();
          const candidates: [ParticipantRow['role'], unknown][] = [];
          if (sender) candidates.push(['from', sender]);
          for (const role of ['to', 'cc'] as const) {
            const list = recipients?.[role];
            if (list === undefined) continue;
            if (!Array.isArray(list)) {
              malformedValues += 1;
              continue;
            }
            for (const value of list) candidates.push([role, value]);
          }
          for (const [role, candidate] of candidates) {
            const value =
              candidate !== null &&
              typeof candidate === 'object' &&
              !Array.isArray(candidate)
                ? (candidate as Record<string, unknown>)
                : undefined;
            const normalized = normalizeAddress(value?.address);
            if (!normalized) {
              skippedAddresses += 1;
              continue;
            }
            const key = `${role}:${normalized.address}`;
            if (seen.has(key)) continue;
            seen.add(key);
            batch.push({
              messageId: message.id,
              accountId: message.accountId,
              role,
              ...normalized,
            });
            // Five bindings per row; a large To/Cc list must not exceed parameter limits.
            if (batch.length === 100) {
              await query
                .insertInto<ParticipantRow>('mailMessageParticipants')
                .values(batch)
                .execute();
              batch = [];
            }
          }
        }
        if (batch.length > 0)
          await query
            .insertInto<ParticipantRow>('mailMessageParticipants')
            .values(batch)
            .execute();
        after = messages.at(-1)?.id;
      }
    } catch (error) {
      // MySQL and other non-transactional DDL dialects need explicit failed-backfill cleanup.
      // No source message was changed, so the migration can be retried from its original JSON.
      try {
        await builder.dropCollection('mailMessageParticipants');
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Mail participant backfill and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
    if (skippedAddresses > 0 || malformedValues > 0) {
      process.emitWarning(
        `Mail participant backfill skipped ${skippedAddresses} invalid addresses and ${malformedValues} malformed values.`,
        { code: 'MAIL_PARTICIPANT_BACKFILL_SKIPPED' },
      );
    }
  },
  async down({ builder }) {
    await builder.dropCollection('mailMessageParticipants');
  },
});

export default migration;
