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
/** Positive historical evidence, never an inference from absent submit entries. */
function provesFirstStart(logs: readonly Values[], candidate: Values): boolean {
  const version = Number(candidate.version);
  if (
    !Number.isSafeInteger(version) ||
    version < 1 ||
    logs.some(
      (entry) =>
        !Number.isSafeInteger(Number(entry.version)) ||
        Number(entry.version) < 1,
    )
  )
    return false;
  const prefix = logs.filter((entry) => Number(entry.version) <= version);
  // Every transition consumes a business version. A gap can hide an earlier
  // submit/withdraw, or merely an ordinary edit: either way, it proves nothing.
  // This checks a positive prefix for recovery, not draft identity at runtime.
  return (
    prefix.length === version &&
    prefix.every(
      (entry, index) =>
        Number(entry.version) === index + 1 &&
        typeof entry.to === 'string' &&
        entry.to.length > 0 &&
        (index === 0
          ? entry.transition === '$create' && entry.from === null
          : entry.transition !== '$create' &&
            entry.from === prefix[index - 1].to),
    )
  );
}

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
const migration: MigrationDefinition = defineMigration({
  name: '202611130006_lifecycle_example_start_snapshots',
  irreversible: true,
  async up(context) {
    const { builder } = context;
    const repository = context.repository.bind(context);
    const scan = async (apply: boolean): Promise<void> => {
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
      }
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
            const logs = await repository(
              'lifecycleExampleTransitions',
            ).findMany({
              filter: { lifecycle: name, recordId },
              sort: (s) => s.field('version').asc(),
            });
            const candidate = logs.find(
              (log) => log.transition === (contract.start ?? '$create'),
            );
            const start =
              candidate && provesFirstStart(logs, candidate)
                ? candidate
                : undefined;
            const id = identity('demo', name, recordId);
            const existing = await repository(
              'lifecycleExampleParameterSnapshots',
            ).findOne({ filter: { id } });
            const snapshot = existing?.payload as Values | undefined;
            const oldValues = snapshot?.values as Values | undefined;
            const complete =
              oldValues && validate(contract, oldValues).length === 0;
            // The counter is created at one and never reset: exactly one matching
            // creation entry plus an unchanged counter proves no transition or edit occurred.
            const creation = logs[0];
            const pristineDraft =
              contract.start &&
              !existing &&
              !candidate &&
              Number(record.lifecycleVersion) === 1 &&
              record.status === 'draft' &&
              logs.length === 1 &&
              creation.transition === '$create' &&
              Number(creation.version) === 1 &&
              creation.from === null &&
              creation.to === record.status &&
              typeof creation.actorId === 'string' &&
              Number.isFinite(timestamp(creation.at));
            if (pristineDraft) {
              if (apply) {
                const proofId = identity(
                  '$parameter-start-v1',
                  'demo',
                  name,
                  recordId,
                  'proof',
                );
                const requests = repository('lifecycleExampleCreationRequests');
                if (!(await requests.findOne({ filter: { id: proofId } })))
                  await requests.createOne({
                    values: {
                      id: proofId,
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
            if (!complete && !start) {
              conflicts.push({
                definition: name,
                recordId,
                status: record.status,
                fields: Object.keys(contract.defaults),
                candidateStartId: candidate
                  ? String(Number(candidate.id))
                  : null,
                candidateVersion: candidate ? Number(candidate.version) : null,
                reason: candidate
                  ? 'FIRST_START_UNPROVEN'
                  : contract.start &&
                      record.status === 'draft' &&
                      Number(record.lifecycleVersion) > 1
                    ? 'DRAFT_EDIT_HISTORY_UNPROVEN'
                    : 'START_HISTORY_UNKNOWN',
              });
              continue;
            }
            const usage =
              !complete && start
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
            const matchesStart =
              fact &&
              fact.scope === 'demo' &&
              fact.lifecycle === name &&
              fact.recordId === recordId &&
              fact.kind === 'transition' &&
              fact.associationId === String(Number(start?.id)) &&
              (fact.attempt ?? 0) === 0;
            if (
              !complete &&
              (!matchesStart ||
                !evidence ||
                validate(contract, evidence).length)
            ) {
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
            const sources: Values = {
              ...((snapshot?.sources as Values) ?? {}),
            };
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
                      usageId: identity(
                        name,
                        'transition',
                        String(Number(start!.id)),
                        0,
                      ),
                      groupRevisions,
                    },
                  }
                : {}),
            };
            const due =
              contract.due[
                typeof record.status === 'string' ? record.status : ''
              ];
            const dueMs = due
              ? timestamp(record.statusChangedAt) +
                Number(values[due[0]]) * due[1]
              : undefined;
            if (
              dueMs !== undefined &&
              (!Number.isFinite(dueMs) || Math.abs(dueMs) > 8640000000000000)
            ) {
              conflicts.push({
                definition: name,
                recordId,
                fields: ['statusChangedAt'],
                reason: 'DEADLINE_HISTORY_INVALID',
              });
              continue;
            }
            if (!apply) continue;
            if (existing)
              await repository('lifecycleExampleParameterSnapshots').updateMany(
                { filter: { id }, values: { payload } },
              );
            else
              await repository('lifecycleExampleParameterSnapshots').createOne({
                values: { id, payload },
              });
            if (dueMs !== undefined)
              await repository(contract.collection).updateMany({
                filter: { id: Number(record.id) },
                values: { lifecycleDueAt: new Date(dueMs).toISOString() },
              });
          }
          if (records.length < 500) break;
        }
      }
      console.info(
        `Parameter snapshot migration summary: ${JSON.stringify({ phase: apply ? 'apply' : 'preflight', definitions: report, conflictCount: conflicts.length })}`,
      );
      if (conflicts.length)
        throw new Error(
          `Parameter snapshot migration requires reliable historical evidence: ${JSON.stringify(conflicts)}`,
        );
    };
    // Writers and schedulers must be stopped. MySQL DDL commits implicitly,
    // so no configuration, schema or instance write precedes this full read-only pass.
    await scan(false);
    await scan(true);
  },
  // Snapshot evidence and creation receipts must survive rollback. Restore the pre-upgrade backup to run old code.
});
export default migration;
