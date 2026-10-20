import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610120002_ag_add_queue_entered_at',
  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.datetimeTz('queueEnteredAt').nullable();
    });
    // QueryAdapter has no column-assignment expression. Bounded batches preserve
    // connection naming and temporal encoding on every supported database.
    let cursor: string | null = null;
    for (;;) {
      let batch = query
        .selectFrom('agRuns')
        .select(['id', 'createdAt', 'availableAt'])
        .where('status', '=', 'queued')
        .orderBy('id')
        .limit(500);
      if (cursor !== null) batch = batch.where('id', '>', cursor);
      const rows = await batch.execute();
      if (rows.length === 0) break;
      const groups = new Map<string, string[]>();
      for (const row of rows) {
        const at = new Date(
          Math.max(
            new Date(String(row.createdAt)).getTime(),
            typeof row.availableAt === 'string' ||
              row.availableAt instanceof Date
              ? new Date(row.availableAt).getTime()
              : 0,
          ),
        ).toISOString();
        const ids = groups.get(at) ?? [];
        ids.push(String(row.id));
        groups.set(at, ids);
      }
      for (const [queueEnteredAt, ids] of groups)
        await query
          .updateTable('agRuns')
          .set({ queueEnteredAt })
          .where('id', 'in', ids)
          .execute();
      cursor = String(rows.at(-1)!.id);
    }
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('queueEnteredAt');
    });
  },
});
export default migration;
