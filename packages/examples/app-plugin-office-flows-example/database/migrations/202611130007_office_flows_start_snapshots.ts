import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const contracts = [
  ['incoming', 'officeFlowsIncoming', 'submit'],
  ['dataRequests', 'officeFlowsDataRequests', 'submit'],
  ['clerkTasks', 'officeFlowsClerkTasks', '$create'],
  ['teamTasks', 'officeFlowsTeamTasks', '$create'],
] as const;
function timestamp(value: unknown): number {
  return value instanceof Date
    ? value.getTime()
    : typeof value === 'string'
      ? Date.parse(value)
      : Number.NaN;
}
const migration: MigrationDefinition = defineMigration({
  name: '202611130007_office_flows_start_snapshots',
  async up(context) {
    const { builder } = context;
    const repository = context.repository.bind(context);
    const scan = async (apply: boolean): Promise<void> => {
      const conflicts: object[] = [];
      // Previous office versions persisted no historical parameter values. Never invent them.
      for (const [definition, collection, startTransition] of contracts) {
        let cursor = 0;
        for (;;) {
          const records = await repository(collection).findMany({
            filter: (f) => f.number('id').gt(cursor),
            sort: (s) => s.field('id').asc(),
            limit: 500,
          });
          for (const record of records) {
            cursor = Number(record.id);
            const logs = await repository('officeFlowsTransitions').findMany({
              filter: {
                lifecycle: definition,
                recordId: String(Number(record.id)),
              },
              sort: (s) => s.field('version').asc(),
            });
            const start = logs.find(
              (log) => log.transition === startTransition,
            );
            const creation = logs[0];
            if (
              startTransition !== '$create' &&
              !start &&
              Number(record.lifecycleVersion) === 1 &&
              record.status === 'draft' &&
              logs.length === 1 &&
              creation.transition === '$create' &&
              Number(creation.version) === 1 &&
              creation.from === null &&
              creation.to === record.status &&
              typeof creation.actorId === 'string' &&
              Number.isFinite(timestamp(creation.at))
            ) {
              if (apply) {
                const recordId = String(Number(record.id));
                const id = createHash('sha256')
                  .update(
                    JSON.stringify([
                      '$parameter-start-v1',
                      'office',
                      definition,
                      recordId,
                      'proof',
                    ]),
                  )
                  .digest('hex');
                const requests = repository('officeFlowsCreationRequests');
                if (!(await requests.findOne({ filter: { id } })))
                  await requests.createOne({
                    values: {
                      id,
                      status: 'unstarted',
                      revision: 0,
                      actorId: creation.actorId,
                      fingerprint: '$parameter-start-v1',
                      recordId,
                      entryId: null,
                      at: creation.at,
                    },
                  });
              }
              continue;
            }
            conflicts.push({
              definition,
              recordId: String(Number(record.id)),
              status: record.status,
              startId: start ? String(Number(start.id)) : null,
              reason: start
                ? 'START_PARAMETERS_UNRECOVERABLE'
                : startTransition !== '$create' &&
                    record.status === 'draft' &&
                    Number(record.lifecycleVersion) > 1
                  ? 'DRAFT_EDIT_HISTORY_UNPROVEN'
                  : 'START_HISTORY_UNKNOWN',
            });
          }
          if (records.length < 500) break;
        }
      }
      if (conflicts.length)
        throw new Error(
          `Office parameter snapshot migration requires historical evidence: ${JSON.stringify(conflicts)}`,
        );
    };
    await scan(false);
    await builder.createCollection('officeFlowsParameterSnapshots', (table) => {
      table.string('id', { length: 64 }).primary().notNull();
      table.json('payload').notNull();
    });
    await builder.createCollection('officeFlowsCreationRequests', (table) => {
      table.string('id', { length: 64 }).primary().notNull();
      table.string('status').notNull();
      table.integer('revision').notNull();
      table.string('actorId').notNull();
      table.text('fingerprint').notNull();
      table.string('recordId').nullable();
      table.string('entryId').nullable();
      table.datetimeTz('at').notNull();
    });
    await scan(true);
  },
  async down(context) {
    const { builder } = context;
    const repository = context.repository.bind(context);
    if (
      (await repository('officeFlowsParameterSnapshots').count()) ||
      (await repository('officeFlowsCreationRequests').count())
    )
      throw new Error(
        'Parameter snapshots and receipts are retained. Restore the pre-upgrade backup before running old code.',
      );
    await builder.dropCollection('officeFlowsCreationRequests');
    await builder.dropCollection('officeFlowsParameterSnapshots');
  },
});
export default migration;
