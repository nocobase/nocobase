import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const identity = (...parts: (string | number)[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
type Values = Record<string, unknown>;
interface Contract {
  collection: string;
  start?: string;
  defaults: Values;
  groups: Record<string, readonly string[]>;
  due: Record<string, readonly [string, number]>;
}
// Frozen contracts: never import running lifecycle definitions into migration history.
const contracts: Record<string, Contract> = {
  expenses: {
    collection: 'lifecycleExampleExpenses',
    start: 'submit',
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
    start: 'submit',
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
    start: 'checkout',
    defaults: { paymentWindowMinutes: 3 },
    groups: { orderTiming: ['paymentWindowMinutes'] },
    due: {
      awaitingPayment: ['paymentWindowMinutes', 60000],
      paymentFailed: ['paymentWindowMinutes', 60000],
    },
  },
  invoices: {
    collection: 'lifecycleExampleInvoices',
    start: 'submit',
    defaults: { querySeconds: 30 },
    groups: { invoiceTiming: ['querySeconds'] },
    due: { awaitingIssue: ['querySeconds', 1000] },
  },
  exports: {
    collection: 'lifecycleExampleExports',
    start: 'submit',
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
const migration: MigrationDefinition = defineMigration({
  name: '202611130001_lifecycle_example_start_snapshots',
  irreversible: true,
  async up(context) {
    const { builder } = context;
    const repository = context.repository.bind(context);
    const conflicts: object[] = [];
    const report: Record<
      string,
      {
        preserved: number;
        recovered: number;
        differingInstances: number;
        differingFields: string[];
        configuredDefaultDifferences: string[];
      }
    > = {};
    const currentValues: Record<string, Values> = {};
    for (const [name, contract] of Object.entries(contracts)) {
      report[name] = {
        preserved: 0,
        recovered: 0,
        differingInstances: 0,
        differingFields: [],
        configuredDefaultDifferences: [],
      };
      currentValues[name] = contract.defaults;
    }

    for (const [name, contract] of Object.entries(contracts)) {
      const config = await repository(
        'lifecycleExampleWorkflowParameters',
      ).findOne({ filter: { id: `lifecycle.${name}` } });
      if (config) {
        const values = {
          ...contract.defaults,
          ...(Number(config.revision) > 0 ? (config.values as Values) : {}),
        };
        currentValues[name] = values;
        report[name].configuredDefaultDifferences = Object.keys(
          contract.defaults,
        ).filter(
          (key) =>
            JSON.stringify(values[key]) !==
            JSON.stringify(contract.defaults[key]),
        );
        const fields = validate(contract, values);
        if (fields.length)
          conflicts.push({ definition: name, configuration: true, fields });
        else if (JSON.stringify(config.values) !== JSON.stringify(values))
          await repository('lifecycleExampleWorkflowParameters').updateMany({
            filter: { id: `lifecycle.${name}` },
            values: { values },
          });
      }
    }
    for (const collection of new Set(
      Object.values(contracts).map((contract) => contract.collection),
    )) {
      await builder.alterCollection(collection, (table) => {
        table.datetimeTz('lifecycleDueAt').nullable();
        table.index(['status', 'lifecycleDueAt']);
      });
    }
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
    for (const [name, contract] of Object.entries(contracts)) {
      let cursor = 0;
      for (;;) {
        const records = await repository(contract.collection).findMany({
          filter: (f) =>
            f.and([
              f.string('lifecycleDefinition').eq(name),
              f.number('id').gt(cursor),
            ]),
          sort: (s) => s.field('id').asc(),
          limit: 500,
        });
        if (!records.length) break;
        for (const record of records) {
          cursor = Number(record.id);
          const recordId = String(Number(record.id));
          const logs = await repository('lifecycleExampleTransitions').findMany(
            {
              filter: { lifecycle: name, recordId },
              sort: (s) => s.field('version').asc(),
            },
          );
          const start = logs.find(
            (log) => log.transition === (contract.start ?? '$create'),
          );
          const id = identity('demo', name, recordId);
          const existing = await repository(
            'lifecycleExampleParameterSnapshots',
          ).findOne({ filter: { id } });
          const snapshot = existing?.payload as Values | undefined;
          const oldValues = snapshot?.values as Values | undefined;
          const complete =
            oldValues && validate(contract, oldValues).length === 0;
          // A missing start entry cannot prove an old record was never started.
          // Only complete snapshots or the actual startup usage evidence are recoverable.
          if (!complete && !start) {
            conflicts.push({
              definition: name,
              recordId,
              status: record.status,
              fields: Object.keys(contract.defaults),
              reason: 'START_HISTORY_UNKNOWN',
            });
            continue;
          }
          const usage = start
            ? await repository('lifecycleExampleParameterUsages').findOne({
                filter: {
                  id: identity(
                    name,
                    'transition',
                    String(Number(start?.id)),
                    0,
                  ),
                },
              })
            : undefined;
          const fact = usage?.payload as Values | undefined;
          const evidence = fact?.values as Values | undefined;
          if (!complete && (!evidence || validate(contract, evidence).length)) {
            conflicts.push({
              definition: name,
              recordId,
              status: record.status,
              startId: String(Number(start?.id)),
              fields: Object.keys(contract.defaults).filter(
                (key) => !oldValues || !(key in oldValues),
              ),
              reason: 'START_PARAMETERS_UNRECOVERABLE',
            });
            continue;
          }
          const disagreement =
            !complete && oldValues
              ? Object.keys(oldValues).filter(
                  (key) =>
                    JSON.stringify(oldValues[key]) !==
                    JSON.stringify(evidence![key]),
                )
              : [];
          if (disagreement.length) {
            conflicts.push({
              definition: name,
              recordId,
              status: record.status,
              startId: String(Number(start?.id)),
              fields: disagreement,
              reason: 'SNAPSHOT_EVIDENCE_CONFLICT',
            });
            continue;
          }
          const values = complete ? oldValues : { ...evidence, ...oldValues };
          const sources: Values = { ...((snapshot?.sources as Values) ?? {}) };
          for (const [group, fields] of Object.entries(contract.groups))
            for (const field of fields)
              if (!(field in sources))
                sources[field] = {
                  group,
                  schemaVersion: 1,
                  revision: Number(
                    (
                      fact?.sources as
                        Record<string, { revision?: number }> | undefined
                    )?.[field]?.revision ??
                      fact?.revision ??
                      0,
                  ),
                  origin: 'recovered',
                };
          const groupRevisions = Object.fromEntries(
            Object.entries(sources).map(([field, source]) => [
              field,
              Number((source as { revision?: number }).revision ?? 0),
            ]),
          );
          const revisions = [...new Set(Object.values(groupRevisions))];
          report[name][complete ? 'preserved' : 'recovered'] += 1;
          const different = Object.keys(contract.defaults).filter(
            (key) =>
              JSON.stringify(values[key]) !==
              JSON.stringify(currentValues[name][key]),
          );
          if (different.length) {
            report[name].differingInstances += 1;
            report[name].differingFields = [
              ...new Set([...report[name].differingFields, ...different]),
            ];
          }
          const payload = {
            ...snapshot,
            scope: 'demo',
            lifecycle: name,
            recordId,
            revision: Number(
              snapshot?.revision ??
                fact?.revision ??
                (revisions.length === 1 ? revisions[0] : 0),
            ),
            at: snapshot?.at ?? start?.at,
            values,
            sources,
            ...(!complete
              ? {
                  recoveredFrom: {
                    transitionId: String(Number(start?.id)),
                    usageId: String(Number(usage!.id)),
                    groupRevisions,
                  },
                }
              : {}),
          };
          if (existing)
            await repository('lifecycleExampleParameterSnapshots').updateMany({
              filter: { id },
              values: { payload },
            });
          else
            await repository('lifecycleExampleParameterSnapshots').createOne({
              values: { id, payload },
            });
          const due =
            contract.due[
              typeof record.status === 'string' ? record.status : ''
            ];
          if (due)
            await repository(contract.collection).updateMany({
              filter: { id: Number(record.id) },
              values: {
                lifecycleDueAt: new Date(
                  new Date(String(record.statusChangedAt as string)).getTime() +
                    Number(values[due[0]]) * due[1],
                ).toISOString(),
              },
            });
        }
        if (records.length < 500) break;
      }
    }
    console.info(
      `Parameter snapshot migration summary: ${JSON.stringify({ definitions: report, conflictCount: conflicts.length })}`,
    );
    if (conflicts.length)
      throw new Error(
        `Parameter snapshot migration requires reliable historical evidence: ${JSON.stringify(conflicts)}`,
      );
  },
  // Snapshot evidence and creation receipts must survive rollback. Restore the pre-upgrade backup to run old code.
});
export default migration;
