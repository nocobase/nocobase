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
const text = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : '';
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
      !['default', 'configuration', 'upgrade'].includes(source.origin)
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
    const upgradeAt = new Date().toISOString();
    const hasSnapshots = await builder.hasCollection(
      'officeFlowsParameterSnapshots',
    );
    const configurations = new Map<
      string,
      { values: Record<string, unknown>; revision: number }
    >();
    const conflicts: object[] = [];
    // Frozen counterpart of the released OfficeWorkflowParameterService.read contract.
    for (const [definition, , fields] of contracts) {
      const saved = await repository('officeFlowsWorkflowParameters').findOne({
        filter: { id: `office.${definition}` },
      });
      try {
        const stored = saved ? OfficeWorkflowValues.parse(saved.values) : {};
        const revision = saved?.revision ?? 0;
        if (!Number.isSafeInteger(revision) || Number(revision) < 0)
          throw new Error('Invalid revision.');
        const values: Record<string, unknown> = {};
        for (const field of fields) {
          if (field === 'dispatchRules') {
            values[field] = stored.dispatchRules ?? {
              departmentNames: stored.departments?.map((row) => row.name) ?? [],
              ownDepartmentOnly: definition === 'teamTasks',
              assigneeRole: 'clerks',
              ccHeads: false,
              ccLeaders: false,
            };
          } else if (stored[field]) values[field] = stored[field];
          else {
            // Point-in-time parameter lists require JSON codecs; each reference table is read once per definition.
            const rows = await repository(
              field === 'holidays'
                ? 'officeFlowsHolidays'
                : 'officeFlowsManagementGroups',
            ).findMany({});
            values[field] =
              field === 'holidays'
                ? rows.map((row) => ({
                    date: text(row.date),
                    kind: row.kind,
                    name: text(row.name),
                  }))
                : rows.map((row) => ({
                    id: Number(row.id),
                    name: text(row.name),
                    members: row.members,
                  }));
          }
        }
        configurations.set(definition, {
          revision: Number(revision),
          values: OfficeWorkflowValues.parse(values),
        });
      } catch (error) {
        conflicts.push({
          definition,
          reason: 'CONFIGURATION_INVALID',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const scan = async (apply: boolean) => {
      const supplemented: Record<string, number> = {};
      for (const [definition, collection, fields] of contracts) {
        let cursor = 0;
        for (;;) {
          const rows = await query
            .selectFrom(collection)
            .select(['id', 'status', 'lifecycleDefinition'])
            .where('id', '>', cursor)
            .orderBy('id', 'asc')
            .limit(500)
            .execute();
          for (const row of rows) {
            cursor = Number(row.id);
            if (row.lifecycleDefinition === null) continue;
            if (row.lifecycleDefinition !== definition) {
              conflicts.push({
                definition,
                recordId: String(cursor),
                reason: 'DEFINITION_BINDING_UNKNOWN',
              });
              continue;
            }
            const recordId = String(cursor);
            const state =
              typeof row.status === 'string' ? row.status : '<invalid>';
            const id = createHash('sha256')
              .update(JSON.stringify(['office', definition, recordId]))
              .digest('hex');
            // JSON decoding differs by dialect, so use a point Repository read only for this payload.
            const existing = hasSnapshots
              ? await repository('officeFlowsParameterSnapshots').findOne({
                  filter: { id },
                })
              : undefined;
            let payload = existing?.payload;
            if (!existing) {
              const current = configurations.get(definition);
              if (!current) continue;
              payload = {
                scope: 'office',
                lifecycle: definition,
                recordId,
                at: upgradeAt,
                revision: current.revision,
                values: current.values,
                sources: Object.fromEntries(
                  fields.map((field) => [
                    field,
                    {
                      group: definition,
                      schemaVersion: 1,
                      revision: current.revision,
                      origin: 'upgrade',
                    },
                  ]),
                ),
              };
              supplemented[`${definition}:${state}`] =
                (supplemented[`${definition}:${state}`] ?? 0) + 1;
            }
            const invalid = errors(payload, definition, recordId, fields);
            if (invalid.length) {
              conflicts.push({
                definition,
                recordId,
                reason: 'PARAMETER_SNAPSHOT_INVALID',
                fields: invalid,
              });
              continue;
            }
            if (apply && !existing)
              await repository('officeFlowsParameterSnapshots').createOne({
                values: { id, payload },
              });
          }
          if (rows.length < 500) break;
        }
      }
      console.info(
        `Office parameter snapshot inventory: ${JSON.stringify({ phase: apply ? 'apply' : 'preflight', supplemented, conflicts: conflicts.length })}`,
      );
    };
    await scan(false);
    if (conflicts.length)
      throw new Error(
        `Office parameter snapshot migration conflicts: ${JSON.stringify(conflicts)}`,
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
    await scan(true);
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
