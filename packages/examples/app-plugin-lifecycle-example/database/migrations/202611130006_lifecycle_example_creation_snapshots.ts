import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const identity = (...parts: (string | number)[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
type Values = Record<string, unknown>;
interface Contract {
  collection: string;
  legacySubmit?: string;
  defaults: Values;
  groups: Record<string, readonly string[]>;
  due: Record<string, readonly [string, number]>;
}
// Frozen contracts: never import running lifecycle definitions into migration history.
const contracts: Record<string, Contract> = {
  expenses: {
    collection: 'lifecycleExampleExpenses',
    legacySubmit: 'submit',
    defaults: {
      autoApproveLimit: 5000,
      financeLimit: 50000,
      escalateAfterMinutes: 3,
    },
    groups: {
      expenseThresholds: ['autoApproveLimit', 'financeLimit'],
      expenseTiming: ['escalateAfterMinutes'],
    },
    due: { awaitingManager: ['escalateAfterMinutes', 60000] },
  },
  'expenses-v2': {
    collection: 'lifecycleExampleExpenses',
    legacySubmit: 'submit',
    defaults: {
      autoApproveLimit: 5000,
      financeLimit: 50000,
      escalateAfterMinutes: 3,
      auditLimit: 20000,
    },
    groups: {
      expenseThresholds: ['autoApproveLimit', 'financeLimit'],
      expenseTiming: ['escalateAfterMinutes'],
      expenseAudit: ['auditLimit'],
    },
    due: { awaitingManager: ['escalateAfterMinutes', 60000] },
  },
  tickets: {
    collection: 'lifecycleExampleTickets',
    defaults: { notificationPrefix: '', waitMinutes: 2, reopenDays: 7 },
    groups: {
      ticketPolicy: ['reopenDays'],
      notificationCopy: ['notificationPrefix'],
      ticketTiming: ['waitMinutes'],
    },
    due: { awaitingCustomer: ['waitMinutes', 60000] },
  },
  orders: {
    collection: 'lifecycleExampleOrders',
    legacySubmit: 'checkout',
    defaults: { paymentWindowMinutes: 3 },
    groups: { orderTiming: ['paymentWindowMinutes'] },
    due: {
      awaitingPayment: ['paymentWindowMinutes', 60000],
      paymentFailed: ['paymentWindowMinutes', 60000],
    },
  },
  invoices: {
    collection: 'lifecycleExampleInvoices',
    legacySubmit: 'submit',
    defaults: { querySeconds: 30 },
    groups: { invoiceTiming: ['querySeconds'] },
    due: { awaitingIssue: ['querySeconds', 1000] },
  },
  exports: {
    collection: 'lifecycleExampleExports',
    legacySubmit: 'submit',
    defaults: { pollSeconds: 15, maxMinutes: 3 },
    groups: { exportTiming: ['pollSeconds', 'maxMinutes'] },
    due: { processing: ['pollSeconds', 1000] },
  },
  subscriptions: {
    collection: 'lifecycleExampleSubscriptions',
    defaults: { periodMinutes: 3, dunningMinutes: 1, maxDunning: 3 },
    groups: {
      subscriptionTiming: ['periodMinutes', 'dunningMinutes', 'maxDunning'],
    },
    due: { pastDue: ['dunningMinutes', 60000] },
  },
};
function validate(contract: Contract, values: Values): string[] {
  const errors = Object.keys(values).filter(
    (key) => !(key in contract.defaults),
  );
  for (const key of Object.keys(contract.defaults)) {
    const value = values[key];
    if (key === 'notificationPrefix') {
      if (typeof value !== 'string' || value.length > 200) errors.push(key);
    } else if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      (![
        'autoApproveLimit',
        'financeLimit',
        'auditLimit',
        'reopenDays',
      ].includes(key) &&
        (!Number.isInteger(value) || value < 1 || value > 525600)) ||
      (key === 'reopenDays' && value > 365)
    )
      errors.push(key);
  }
  if (Number(values.autoApproveLimit) > Number(values.financeLimit))
    errors.push('autoApproveLimit');
  return [...new Set(errors)];
}
function timestamp(value: unknown): number {
  return value instanceof Date
    ? value.getTime()
    : typeof value === 'string'
      ? Date.parse(value)
      : Number.NaN;
}

function object(value: unknown): Values | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Values)
    : undefined;
}
/** Frozen counterpart of the runtime's complete snapshot validator. */
function snapshotErrors(
  contract: Contract,
  payload: unknown,
  name: string,
  recordId: string,
): string[] {
  const data = object(payload);
  if (!data) return ['payload'];
  const errors: string[] = [];
  if (
    data.scope !== 'demo' ||
    data.lifecycle !== name ||
    data.recordId !== recordId
  )
    errors.push('identity');
  if (!Number.isSafeInteger(data.revision) || Number(data.revision) < 0)
    errors.push('revision');
  if (!validSnapshotTime(data.at)) errors.push('at');
  const values = object(data.values);
  const sources = object(data.sources);
  if (!values) errors.push('values');
  else
    errors.push(
      ...validate(contract, values).map((field) => `values.${field}`),
    );
  if (!sources) errors.push('sources');
  else {
    const fields = new Set(Object.values(contract.groups).flat());
    for (const field of Object.keys(sources))
      if (!fields.has(field)) errors.push(`sources.${field}`);
    for (const [group, fields] of Object.entries(contract.groups))
      for (const field of fields) {
        const source = object(sources[field]);
        if (
          !source ||
          source.group !== group ||
          source.schemaVersion !== 1 ||
          !Number.isSafeInteger(source.revision) ||
          Number(source.revision) < 0 ||
          typeof source.origin !== 'string' ||
          !['default', 'configuration', 'recovered'].includes(source.origin)
        )
          errors.push(`sources.${field}`);
      }
  }
  if (data.recoveredFrom !== undefined) {
    const provenance = object(data.recoveredFrom);
    const revisions = provenance?.groupRevisions;
    if (
      !provenance ||
      typeof provenance.transitionId !== 'string' ||
      !provenance.transitionId ||
      (provenance.usageId !== undefined &&
        (typeof provenance.usageId !== 'string' || !provenance.usageId)) ||
      (revisions !== undefined &&
        (!object(revisions) ||
          Object.values(revisions as Values).some(
            (revision) =>
              !Number.isSafeInteger(revision) || Number(revision) < 0,
          )))
    )
      errors.push('recoveredFrom');
  }
  return errors;
}
const migration: MigrationDefinition = defineMigration({
  name: '202611130006_lifecycle_example_creation_snapshots',
  irreversible: true,
  async up(context) {
    const { builder, query } = context;
    const repository = context.repository.bind(context);
    // Repository is limited to point reads/writes requiring cross-dialect JSON or datetime codecs.
    // Business rows are scanned with query keyset pages, never an unbounded repository walk.
    const scan = async (apply: boolean): Promise<void> => {
      const conflicts: object[] = [];
      const inventory = {
        completeSnapshots: 0,
        creationUsages: 0,
        missingCreationEvidence: 0,
        legacySubmissionSnapshots: 0,
        recovered: 0,
      };
      for (const [name, contract] of Object.entries(contracts)) {
        const config = await repository(
          'lifecycleExampleWorkflowParameters',
        ).findOne({ filter: { id: `lifecycle.${name}` } });
        if (config) {
          const values = {
            ...contract.defaults,
            ...(Number(config.revision) > 0 ? object(config.values) : {}),
          };
          const errors = validate(contract, values);
          if (!object(config.values)) errors.push('values');
          if (
            !Number.isSafeInteger(config.revision) ||
            Number(config.revision) < 0
          )
            errors.push('revision');
          if (errors.length)
            conflicts.push({
              definition: name,
              configuration: true,
              fields: errors,
            });
          else if (
            apply &&
            JSON.stringify(config.values) !== JSON.stringify(values)
          )
            await repository('lifecycleExampleWorkflowParameters').updateMany({
              filter: { id: `lifecycle.${name}` },
              values: { values },
            });
        }
      }
      if (apply) {
        for (const collection of new Set(
          Object.values(contracts).map((contract) => contract.collection),
        ))
          await builder.alterCollection(collection, (table) => {
            table.datetimeTz('lifecycleDueAt').nullable();
            table.index(['status', 'lifecycleDueAt']);
          });
        await builder.createCollection(
          'lifecycleExampleCreationRequests',
          (table) => {
            table.string('id', { length: 64 }).primary().notNull();
            table.string('status').notNull();
            table.integer('revision').notNull();
            table.string('actorId').notNull();
            table.text('fingerprint').notNull();
            table.string('recordId').nullable();
            table.string('entryId').nullable();
            table.datetimeTz('at').notNull();
          },
        );
      }
      for (const [name, contract] of Object.entries(contracts)) {
        let cursor = 0;
        for (;;) {
          const records = await query
            .selectFrom(contract.collection)
            .select(['id', 'status', 'statusChangedAt'])
            .where('lifecycleDefinition', '=', name)
            .where('id', '>', cursor)
            .orderBy('id', 'asc')
            .limit(500)
            .execute();
          for (const record of records) {
            cursor = Number(record.id);
            const recordId = String(cursor);
            const id = identity('demo', name, recordId);
            const stored = await repository(
              'lifecycleExampleParameterSnapshots',
            ).findOne({ filter: { id } });
            const existing = stored?.payload;
            const creation = await query
              .selectFrom('lifecycleExampleTransitions')
              .selectAll()
              .where('lifecycle', '=', name)
              .where('recordId', '=', recordId)
              .where('transition', '=', '$create')
              .execute();
            const entry =
              creation.length === 1 &&
              Number(creation[0].version) === 1 &&
              creation[0].from === null &&
              typeof creation[0].to === 'string' &&
              Number.isFinite(timestamp(creation[0].at))
                ? creation[0]
                : undefined;
            const entryId = entry ? String(Number(entry.id)) : undefined;
            const usageId = entryId
              ? identity(name, 'transition', entryId, 0)
              : undefined;
            const usage = usageId
              ? await repository('lifecycleExampleParameterUsages').findOne({
                  filter: { id: usageId },
                })
              : undefined;
            const fact = object(usage?.payload);
            const creationValid =
              !!fact &&
              !!entry &&
              usage?.recordKey === id &&
              fact.kind === 'transition' &&
              fact.associationId === entryId &&
              (fact.attempt ?? 0) === 0 &&
              // Usage is written after its creation entry in the same transaction.
              timestamp(fact.at) >= timestamp(entry.at) &&
              snapshotErrors(contract, fact, name, recordId).length === 0;
            if (creationValid) inventory.creationUsages++;
            let payload: Values;
            if (stored) {
              const fields = snapshotErrors(contract, existing, name, recordId);
              if (fields.length) {
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'PARAMETER_SNAPSHOT_INVALID',
                  fields,
                  options: [
                    'restoreVerifiedSnapshotBackup',
                    'reviewCreationEvidence',
                  ],
                });
                continue;
              }
              payload = existing as Values;
              inventory.completeSnapshots++;
              if (contract.legacySubmit && !creationValid) {
                inventory.legacySubmissionSnapshots++;
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'LEGACY_SUBMISSION_SNAPSHOT',
                  snapshotAt: payload.at,
                  options: [
                    'approvePreservingOriginalHistoricalSnapshot',
                    'recreateRecordWithNewCreationParameters',
                  ],
                });
                continue;
              }
              if (
                creationValid &&
                Object.keys(contract.defaults).some(
                  (field) =>
                    JSON.stringify((payload.values as Values)[field]) !==
                    JSON.stringify((fact.values as Values)[field]),
                )
              ) {
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'SNAPSHOT_CREATION_CONFLICT',
                  creationUsageId: usageId,
                  options: [
                    'approvePreservingOriginalHistoricalSnapshot',
                    'recreateRecordFromVerifiedCreationEvidence',
                  ],
                });
                continue;
              }
              if (contract.legacySubmit && creationValid) {
                const provenance = object(payload.recoveredFrom);
                const creationTime =
                  timestamp(payload.at) === timestamp(entry.at) ||
                  (provenance &&
                    provenance.transitionId === entryId &&
                    provenance.usageId === usageId &&
                    timestamp(payload.at) === timestamp(fact.at));
                const sourceFields = [
                  'group',
                  'schemaVersion',
                  'revision',
                  'origin',
                ];
                const sameSources = Object.keys(contract.defaults).every(
                  (field) =>
                    sourceFields.every(
                      (key) =>
                        object((payload.sources as Values)[field])?.[key] ===
                        object((fact.sources as Values)[field])?.[key],
                    ),
                );
                if (
                  !creationTime ||
                  payload.revision !== fact.revision ||
                  !sameSources
                ) {
                  inventory.legacySubmissionSnapshots++;
                  conflicts.push({
                    definition: name,
                    recordId,
                    reason: 'LEGACY_SUBMISSION_SNAPSHOT',
                    snapshotAt: payload.at,
                    creationUsageId: usageId,
                    options: [
                      'approvePreservingOriginalHistoricalSnapshot',
                      'recreateRecordFromVerifiedCreationEvidence',
                    ],
                  });
                  continue;
                }
              }
              // Preserve the exact valid payload and its real historical freeze time.
            } else {
              if (!creationValid) {
                inventory.missingCreationEvidence++;
                conflicts.push({
                  definition: name,
                  recordId,
                  status: record.status,
                  reason: 'CREATION_PARAMETERS_UNRECOVERABLE',
                  creationEntryId: entryId ?? null,
                  options: [
                    'restoreCreationUsageBackup',
                    'recreateRecordWithNewCreationParameters',
                  ],
                });
                continue;
              }
              payload = {
                scope: 'demo',
                lifecycle: name,
                recordId,
                revision: fact.revision,
                values: fact.values,
                sources: fact.sources,
                at: fact.at,
                recoveredFrom: { transitionId: entryId, usageId },
              };
              const fields = snapshotErrors(contract, payload, name, recordId);
              if (fields.length) {
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'PARAMETER_SNAPSHOT_INVALID',
                  fields,
                });
                continue;
              }
              inventory.recovered++;
            }
            const due =
              contract.due[
                typeof record.status === 'string' ? record.status : ''
              ];
            const dueMs = due
              ? timestamp(record.statusChangedAt) +
                Number((payload.values as Values)[due[0]]) * due[1]
              : undefined;
            if (
              dueMs !== undefined &&
              (!Number.isFinite(dueMs) || Math.abs(dueMs) > 8640000000000000)
            ) {
              conflicts.push({
                definition: name,
                recordId,
                reason: 'DEADLINE_HISTORY_INVALID',
                fields: ['statusChangedAt'],
              });
              continue;
            }
            if (!apply) continue;
            if (!stored)
              await repository('lifecycleExampleParameterSnapshots').createOne({
                values: { id, payload },
              });
            if (dueMs !== undefined)
              await repository(contract.collection).updateMany({
                filter: { id: cursor },
                values: { lifecycleDueAt: new Date(dueMs).toISOString() },
              });
          }
          if (records.length < 500) break;
        }
      }
      console.info(
        `Parameter creation snapshot inventory: ${JSON.stringify({ phase: apply ? 'apply' : 'preflight', ...inventory, conflicts: conflicts.length })}`,
      );
      if (conflicts.length)
        throw new Error(
          `Parameter creation snapshot migration conflicts: ${JSON.stringify(conflicts)}`,
        );
    };
    // Stop all writers/workers/schedulers through both passes. MySQL DDL is not transactional.
    await scan(false);
    await scan(true);
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
