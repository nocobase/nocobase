import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';
import { z } from 'zod';

// Frozen historical validators; do not import live configuration or roster definitions.
const knownPeople = new Set([
  'zhangwei',
  'lina',
  'wangqiang',
  'zhaomin',
  'chenjing',
  'liuyang',
  'sunli',
  'zhoujie',
  'wuhua',
  'zhengkai',
  'huangtao',
  'xulei',
  'gaoyan',
  'linfeng',
  'heming',
  'mahui',
  'luoxin',
  'songyu',
  'tangjun',
  'fanqing',
  'guoning',
  'denghui',
  'yeqing',
  'caobin',
  'jiangli',
]);
const isPerson = (value: unknown): boolean =>
  typeof value === 'string' && knownPeople.has(value);
const people = z
  .array(z.string().refine(isPerson, 'Unknown example person.'))
  .max(100);
const DepartmentParameter = z.strictObject({
  name: z.string().trim().min(1).max(100),
  clerks: people.min(1),
  heads: people,
  leaders: people,
});
const ManagementParameter = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  members: people.min(1),
});
const HolidayParameter = z.strictObject({
  date: z.iso.date(),
  kind: z.enum(['holiday', 'workday']),
  name: z.string().max(100),
});
const OfficeDispatchRules = z.strictObject({
  departmentNames: z.array(z.string().trim().min(1).max(100)).max(100),
  ownDepartmentOnly: z.boolean(),
  assigneeRole: z.enum(['clerks', 'heads', 'leaders']),
  ccHeads: z.boolean(),
  ccLeaders: z.boolean(),
});
const OfficeWorkflowValues = z
  .strictObject({
    dispatchRules: OfficeDispatchRules.optional(),
    departments: z.array(DepartmentParameter).max(100).optional(),
    managementGroups: z.array(ManagementParameter).max(100).optional(),
    holidays: z.array(HolidayParameter).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    for (const [key, ids] of [
      ['departments', value.departments?.map((row) => row.name)],
      ['dispatchRules', value.dispatchRules?.departmentNames],
      ['managementGroups', value.managementGroups?.map((row) => row.id)],
      ['holidays', value.holidays?.map((row) => row.date)],
    ] as const) {
      if (ids && new Set<string | number>(ids).size !== ids.length)
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Entries must have unique identifiers.',
        });
    }
  });

const contracts = [
  ['incoming', 'officeFlowsIncoming', ['dispatchRules', 'managementGroups']],
  ['dataRequests', 'officeFlowsDataRequests', ['holidays']],
  ['clerkTasks', 'officeFlowsClerkTasks', ['dispatchRules']],
  ['teamTasks', 'officeFlowsTeamTasks', ['dispatchRules']],
] as const;
function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
function errors(
  payload: unknown,
  definition: string,
  recordId: string,
  fields: readonly string[],
): string[] {
  const value = object(payload);
  if (!value) return ['payload'];
  const result: string[] = [];
  if (
    value.scope !== 'office' ||
    value.lifecycle !== definition ||
    value.recordId !== recordId
  )
    result.push('identity');
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 0)
    result.push('revision');
  if (!validSnapshotTime(value.at)) result.push('at');
  const values = object(value.values);
  if (
    !values ||
    fields.some((field) => !Object.hasOwn(values, field)) ||
    Object.keys(values).some((field) => !fields.includes(field)) ||
    !OfficeWorkflowValues.safeParse(values).success
  )
    result.push('values');
  const sources = object(value.sources);
  if (!sources || Object.keys(sources).some((field) => !fields.includes(field)))
    result.push('sources');
  for (const field of fields) {
    const source = object(sources?.[field]);
    if (
      !source ||
      source.group !== definition ||
      source.schemaVersion !== 1 ||
      !Number.isSafeInteger(source.revision) ||
      Number(source.revision) < 0 ||
      typeof source.origin !== 'string' ||
      !['default', 'configuration', 'recovered'].includes(source.origin)
    )
      result.push(`sources.${field}`);
  }
  if (value.recoveredFrom !== undefined) {
    const provenance = object(value.recoveredFrom);
    const revisions = provenance?.groupRevisions;
    if (
      !provenance ||
      typeof provenance.transitionId !== 'string' ||
      !provenance.transitionId ||
      (provenance.usageId !== undefined &&
        (typeof provenance.usageId !== 'string' || !provenance.usageId)) ||
      (revisions !== undefined &&
        (!object(revisions) ||
          Object.values(revisions as Record<string, unknown>).some(
            (revision) =>
              !Number.isSafeInteger(revision) || Number(revision) < 0,
          )))
    )
      result.push('recoveredFrom');
  }
  return result;
}
const migration: MigrationDefinition = defineMigration({
  name: '202611130007_office_flows_creation_snapshots',
  async up(context) {
    const { builder, query } = context;
    const repository = context.repository.bind(context);
    const hasSnapshots = await builder.hasCollection(
      'officeFlowsParameterSnapshots',
    );
    const conflicts: object[] = [];
    const inventory = {
      completeSnapshots: 0,
      missingCreationEvidence: 0,
      legacySubmissionSnapshots: 0,
    };
    // Old office code persisted neither creation usage nor historical parameter revisions.
    // Never use the current organization/configuration or a start marker as creation evidence.
    for (const [definition, collection, fields] of contracts) {
      let cursor = 0;
      for (;;) {
        const rows = await query
          .selectFrom(collection)
          .select(['id', 'status'])
          .where('id', '>', cursor)
          .orderBy('id', 'asc')
          .limit(500)
          .execute();
        for (const row of rows) {
          cursor = Number(row.id);
          const recordId = String(cursor);
          const id = createHash('sha256')
            .update(JSON.stringify(['office', definition, recordId]))
            .digest('hex');
          // JSON decoding differs by dialect, so use a point Repository read only for this payload.
          const existing = hasSnapshots
            ? await repository('officeFlowsParameterSnapshots').findOne({
                filter: { id },
              })
            : undefined;
          if (!existing) {
            inventory.missingCreationEvidence++;
            conflicts.push({
              definition,
              recordId,
              status: row.status,
              reason: 'CREATION_PARAMETERS_UNRECOVERABLE',
              options: [
                'restoreVerifiedCreationSnapshotBackup',
                'recreateRecordWithNewCreationParameters',
              ],
            });
            continue;
          }
          const invalid = errors(
            existing.payload,
            definition,
            recordId,
            fields,
          );
          if (invalid.length) {
            conflicts.push({
              definition,
              recordId,
              reason: 'PARAMETER_SNAPSHOT_INVALID',
              fields: invalid,
            });
            continue;
          }
          inventory.completeSnapshots++;
          // Existing dispatch-created tasks were already frozen at creation. Draft-capable
          // incoming/data request snapshots from older code were frozen on submit instead.
          if (definition === 'incoming' || definition === 'dataRequests') {
            inventory.legacySubmissionSnapshots++;
            conflicts.push({
              definition,
              recordId,
              reason: 'LEGACY_SUBMISSION_SNAPSHOT',
              options: [
                'approvePreservingOriginalHistoricalSnapshot',
                'recreateRecordWithNewCreationParameters',
              ],
            });
          }
        }
        if (rows.length < 500) break;
      }
    }
    console.info(
      `Office creation snapshot inventory: ${JSON.stringify({ ...inventory, conflicts: conflicts.length })}`,
    );
    if (conflicts.length)
      throw new Error(
        `Office creation snapshot migration conflicts: ${JSON.stringify(conflicts)}`,
      );
    if (!hasSnapshots)
      await builder.createCollection(
        'officeFlowsParameterSnapshots',
        (table) => {
          table.string('id', { length: 64 }).primary().notNull();
          table.json('payload').notNull();
        },
      );
    if (!(await builder.hasCollection('officeFlowsCreationRequests')))
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
  },
  async down({ builder, query }) {
    const snapshots = await query
      .selectFrom('officeFlowsParameterSnapshots')
      .select('id')
      .limit(1)
      .execute();
    const receipts = await query
      .selectFrom('officeFlowsCreationRequests')
      .select('id')
      .limit(1)
      .execute();
    if (snapshots.length || receipts.length)
      throw new Error(
        'Parameter snapshots and receipts are retained. Restore the pre-upgrade backup before running old code.',
      );
    await builder.dropCollection('officeFlowsCreationRequests');
    await builder.dropCollection('officeFlowsParameterSnapshots');
  },
});
export default migration;

function validSnapshotTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetHour = '0',
    offsetMinute = '0',
  ] = parts;
  return (
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    Number(day) >= 1 &&
    Number(day) <=
      new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate() &&
    Number(hour) < 24 &&
    Number(minute) < 60 &&
    Number(second) < 60 &&
    Number(offsetHour) < 24 &&
    Number(offsetMinute) < 60
  );
}
