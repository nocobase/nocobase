import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

interface MessageHeaders {
  id: string;
  internetMessageId: string | null;
  inReplyTo: string | null;
  references: string;
}

const migration: MigrationDefinition = defineMigration({
  name: '202609200001_backfill_mail_conversations',
  async up({ query }) {
    let after: string | undefined;
    while (true) {
      let page = query
        .selectFrom('mailMessages')
        .select(['id', 'internetMessageId', 'inReplyTo', 'references'])
        .where('providerConversationId', 'is', null)
        .orderBy('id', 'asc')
        .limit(100);
      if (after) page = page.where('id', '>', after);
      const rows = await page.execute<MessageHeaders>();
      if (rows.length === 0) break;
      for (const row of rows) {
        const references = JSON.parse(row.references) as string[];
        const root =
          references.find((reference) => reference.trim())?.trim() ||
          row.inReplyTo?.trim() ||
          row.internetMessageId?.trim();
        if (!root) continue;
        await query
          .updateTable('mailMessages')
          .set({
            providerConversationId: `rfc:${createHash('sha256').update(root).digest('hex')}`,
          })
          .where('id', '=', row.id)
          .execute();
      }
      after = rows.at(-1)?.id;
    }
  },
  // Conversation IDs are derived metadata; retaining them is safe on rollback.
  async down() {},
});

export default migration;
