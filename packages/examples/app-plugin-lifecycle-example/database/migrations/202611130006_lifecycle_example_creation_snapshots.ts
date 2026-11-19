import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const identity = (...parts: (string | number)[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
type Values = Record<string, unknown>;
interface Contract {
  collection: string;
  defaults: Values;
  groups: Record<string, readonly string[]>;
  due: Record<string, readonly [string, number]>;
}
// Frozen contracts: never import running lifecycle definitions into migration history.
const contracts: Record<string, Contract> = {
  expenses: {
    collection: 'lifecycleExampleExpenses',
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
    defaults: { paymentWindowMinutes: 3 },
    groups: { orderTiming: ['paymentWindowMinutes'] },
    due: {
      awaitingPayment: ['paymentWindowMinutes', 60000],
      paymentFailed: ['paymentWindowMinutes', 60000],
    },
  },
  invoices: {
    collection: 'lifecycleExampleInvoices',
    defaults: { querySeconds: 30 },
    groups: { invoiceTiming: ['querySeconds'] },
    due: { awaitingIssue: ['querySeconds', 1000] },
  },
  exports: {
    collection: 'lifecycleExampleExports',
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
          !['default', 'configuration', 'upgrade'].includes(source.origin)
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
/** The released format recorded revisions on sources, not on the resolution. */
function publishedResolution(
  contract: Contract,
  payload: unknown,
  name: string,
  recordId: string,
): { payload: Values; groupRevisions: Record<string, number> } | undefined {
  const data = object(payload);
  const sources = object(data?.sources);
  if (
    !data ||
    Object.hasOwn(data, 'revision') ||
    data.recoveredFrom !== undefined ||
    !sources
  )
    return undefined;
  const normalized: Values = {};
  const groupRevisions: Record<string, number> = {};
  for (const [field, value] of Object.entries(sources)) {
    const source = object(value);
    if (
      !source ||
      source.readMode !==
        (name === 'expenses' && source.group === 'expenseThresholds'
          ? 'snapshot'
          : 'live') ||
      !['default', 'configuration'].includes(String(source.origin)) ||
      typeof source.group !== 'string' ||
      !Number.isSafeInteger(source.revision) ||
      Number(source.revision) < 0
    )
      return undefined;
    const previous = groupRevisions[source.group];
    if (previous !== undefined && previous !== source.revision)
      return undefined;
    groupRevisions[source.group] = Number(source.revision);
    const { readMode: _readMode, ...retained } = source;
    normalized[field] = retained;
  }
  const result = {
    ...data,
    // Match the already-merged 202610160005 configuration consolidation rule.
    revision: Math.max(0, ...Object.values(groupRevisions)),
    sources: normalized,
  };
  if (snapshotErrors(contract, result, name, recordId).length) return undefined;
  return { payload: result, groupRevisions };
}
// Released expense snapshots contained only snapshot-mode fields, never the live timing field.
const publishedExpenseSnapshot: Contract = {
  collection: 'lifecycleExampleExpenses',
  defaults: { autoApproveLimit: 5000, financeLimit: 50000 },
  groups: { expenseThresholds: ['autoApproveLimit', 'financeLimit'] },
  due: {},
};
const migration: MigrationDefinition = defineMigration({
  name: '202611130006_lifecycle_example_creation_snapshots',
  irreversible: true,
  async up(context) {
    const { builder, query } = context;
    const repository = context.repository.bind(context);
    // Repository is limited to point reads/writes requiring cross-dialect JSON or datetime codecs.
    // Business rows are scanned with query keyset pages, never an unbounded repository walk.
    const upgradeAt = new Date().toISOString();
    const scan = async (apply: boolean): Promise<void> => {
      const conflicts: object[] = [];
      const inventory = {
        completeSnapshots: 0,
        creationUsages: 0,
        recovered: 0,
      };
      const configurations = new Map<
        string,
        { values: Values; revision: number }
      >();
      const supplemented: Record<string, number> = {};
      if (!apply) {
        for (const collection of new Set(
          Object.values(contracts).map((item) => item.collection),
        )) {
          const names = Object.entries(contracts)
            .filter(([, item]) => item.collection === collection)
            .map(([name]) => name);
          let cursor = 0;
          for (;;) {
            const rows = await query
              .selectFrom(collection)
              .select(['id', 'lifecycleDefinition'])
              .where('id', '>', cursor)
              .orderBy('id', 'asc')
              .limit(500)
              .execute();
            for (const row of rows) {
              cursor = Number(row.id);
              if (
                row.lifecycleDefinition !== null &&
                (typeof row.lifecycleDefinition !== 'string' ||
                  !names.includes(row.lifecycleDefinition))
              )
                conflicts.push({
                  collection,
                  recordId: String(cursor),
                  reason: 'DEFINITION_BINDING_UNKNOWN',
                });
            }
            if (rows.length < 500) break;
          }
        }
      }
      for (const [name, contract] of Object.entries(contracts)) {
        const config = await repository(
          'lifecycleExampleWorkflowParameters',
        ).findOne({ filter: { id: `lifecycle.${name}` } });
        if (!config)
          configurations.set(name, { values: contract.defaults, revision: 0 });
        if (config) {
          const values = {
            ...contract.defaults,
            ...object(config.values),
          };
          const errors = validate(contract, values);
          if (!object(config.values)) errors.push('values');
          if (config.scope !== 'demo') errors.push('scope');
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
          else {
            configurations.set(name, {
              values,
              revision: Number(config.revision),
            });
          }
          if (
            !errors.length &&
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
            .select([
              'id',
              'status',
              'statusChangedAt',
              'lifecycleVersion',
              ...(contract.collection === 'lifecycleExampleExpenses'
                ? ['parameterContract']
                : []),
            ])
            .where('lifecycleDefinition', '=', name)
            .where('id', '>', cursor)
            .orderBy('id', 'asc')
            .limit(500)
            .execute();
          for (const record of records) {
            cursor = Number(record.id);
            const recordId = String(cursor);
            const state =
              typeof record.status === 'string' ? record.status : '<invalid>';
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
            const rawFact = object(usage?.payload);
            const publishedFact =
              name === 'expenses-v2'
                ? undefined
                : publishedResolution(contract, rawFact, name, recordId);
            const fact = publishedFact?.payload ?? rawFact;
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
            let payload: Values | undefined;
            let writeSnapshot = !stored;
            // Released early expenses bypassed saved configuration through legacyRecord.
            const current =
              !creationValid &&
              name === 'expenses' &&
              Number(record.parameterContract) !== 1
                ? { values: contract.defaults, revision: 0 }
                : configurations.get(name);
            const supplement = (base?: Values): Values | undefined => {
              if (!current) return undefined;
              const values = { ...object(base?.values) };
              const sources = { ...object(base?.sources) };
              let revision = Number(base?.revision ?? 0);
              for (const [group, fields] of Object.entries(contract.groups))
                for (const field of fields)
                  if (!Object.hasOwn(values, field)) {
                    if (creationValid) {
                      values[field] = object(fact.values)?.[field];
                      sources[field] = object(fact.sources)?.[field];
                      revision = Math.max(
                        revision,
                        Number(object(sources[field])?.revision),
                      );
                    } else {
                      values[field] = current.values[field];
                      sources[field] = {
                        group,
                        schemaVersion: 1,
                        revision: current.revision,
                        origin: 'upgrade',
                      };
                      revision = Math.max(revision, current.revision);
                    }
                  }
              return {
                scope: 'demo',
                lifecycle: name,
                recordId,
                revision,
                values,
                sources,
                at: base?.at ?? upgradeAt,
                ...(creationValid
                  ? {
                      recoveredFrom: {
                        transitionId: entryId,
                        usageId,
                        ...(publishedFact
                          ? { groupRevisions: publishedFact.groupRevisions }
                          : {}),
                      },
                    }
                  : base?.recoveredFrom
                    ? { recoveredFrom: base.recoveredFrom }
                    : {}),
              };
            };
            if (stored) {
              const publishedSnapshot =
                name === 'expenses'
                  ? publishedResolution(
                      publishedExpenseSnapshot,
                      existing,
                      name,
                      recordId,
                    )
                  : undefined;
              if (publishedSnapshot) {
                // Preserve the actual submitted thresholds and timestamp; only the old live timing is added.
                payload = supplement(publishedSnapshot.payload);
                if (payload) {
                  writeSnapshot = true;
                  supplemented[`${name}:${state}`] =
                    (supplemented[`${name}:${state}`] ?? 0) + 1;
                }
              } else {
                const fields = snapshotErrors(
                  contract,
                  existing,
                  name,
                  recordId,
                );
                if (fields.length) {
                  conflicts.push({
                    definition: name,
                    recordId,
                    reason: 'PARAMETER_SNAPSHOT_INVALID',
                    fields,
                  });
                  continue;
                }
                payload = existing as Values;
                const provenance = object(payload.recoveredFrom);
                const snapshotValues = object(payload.values);
                if (
                  creationValid &&
                  (timestamp(payload.at) === timestamp(entry.at) ||
                    (provenance?.transitionId === entryId &&
                      timestamp(payload.at) === timestamp(fact.at))) &&
                  Object.keys(contract.defaults).some(
                    (field) =>
                      JSON.stringify(snapshotValues?.[field]) !==
                      JSON.stringify(object(fact.values)?.[field]),
                  )
                ) {
                  conflicts.push({
                    definition: name,
                    recordId,
                    reason: 'SNAPSHOT_CREATION_CONFLICT',
                  });
                  continue;
                }
                inventory.completeSnapshots++;
              }
            } else {
              if (name === 'expenses-v2' && !creationValid) {
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'PARAMETER_SNAPSHOT_MISSING',
                });
                continue;
              }
              // Published contract-one expenses must retain the thresholds fixed on submit.
              // Version one drafts cannot have executed a submit; the concurrency counter never resets.
              if (
                name === 'expenses' &&
                Number(record.parameterContract) === 1
              ) {
                let unsubmitted = record.status === 'draft';
                const history = await query
                  .selectFrom('lifecycleExampleTransitions')
                  .select(['version', 'transition'])
                  .where('lifecycle', '=', name)
                  .where('recordId', '=', recordId)
                  .orderBy('version', 'asc')
                  .execute();
                if (
                  history.some(
                    (item) =>
                      item.transition === 'submit' ||
                      item.transition === 'resubmit',
                  )
                )
                  unsubmitted = false;
                if (
                  Number(record.lifecycleVersion) !== 1 &&
                  (history.length !== Number(record.lifecycleVersion) ||
                    history.some(
                      (item, index) => Number(item.version) !== index + 1,
                    ))
                )
                  unsubmitted = false;
                if (!unsubmitted) {
                  conflicts.push({
                    definition: name,
                    recordId,
                    reason: 'PARAMETER_SNAPSHOT_MISSING',
                    fields: ['expenseThresholds'],
                  });
                  continue;
                }
              }
              if (rawFact && !creationValid) {
                conflicts.push({
                  definition: name,
                  recordId,
                  reason: 'CREATION_EVIDENCE_INVALID',
                });
                continue;
              }
              if (creationValid) {
                payload = {
                  scope: 'demo',
                  lifecycle: name,
                  recordId,
                  revision: fact.revision,
                  values: fact.values,
                  sources: fact.sources,
                  at: fact.at,
                  recoveredFrom: {
                    transitionId: entryId,
                    usageId,
                    ...(publishedFact
                      ? { groupRevisions: publishedFact.groupRevisions }
                      : {}),
                  },
                };
                inventory.recovered++;
              } else {
                payload = supplement();
                supplemented[`${name}:${state}`] =
                  (supplemented[`${name}:${state}`] ?? 0) + 1;
              }
            }
            if (!payload) continue; // Configuration errors are already in the preflight conflict list.
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
            if (writeSnapshot) {
              if (stored)
                await repository(
                  'lifecycleExampleParameterSnapshots',
                ).updateMany({ filter: { id }, values: { payload } });
              else
                await repository(
                  'lifecycleExampleParameterSnapshots',
                ).createOne({ values: { id, payload } });
            }
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
        `Parameter creation snapshot inventory: ${JSON.stringify({ phase: apply ? 'apply' : 'preflight', ...inventory, supplemented, conflicts: conflicts.length })}`,
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
