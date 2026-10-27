import { workflowParameterGroup } from '../configuration/workflow-parameter-store.js';
import { subscriptionLifecycle } from '../lifecycles/subscription.js';
import { exportLifecycle } from '../lifecycles/export.js';
import { invoiceLifecycle } from '../lifecycles/invoice.js';
import { orderLifecycle } from '../lifecycles/order.js';
import { workflowParameterStore } from '../configuration/store.js';
import type {
  ParameterGroupView,
  ParameterHistoryView,
  ReviewerReference,
  ReviewerReferencePage,
  ReviewerReferenceType,
} from '../../shared/parameter-configuration.js';
import type { DatabaseManager } from '@nocobase/db';
import {
  normalizeParameterValues,
  ParameterConfigurationError,
  type JsonObject,
  type LifecycleRuntime,
  type LifecycleParameterStore,
  type ParameterGroup,
  type ParameterVersion,
  type ReviewerSelection,
} from '@nocobase/lifecycle';
import { person } from '../../shared/people.js';
import {
  expenseParameterGroup,
  expenseTimingGroup,
  ticketTimingGroup,
  orderTimingGroup,
  invoiceTimingGroup,
  exportTimingGroup,
  subscriptionTimingGroup,
  ticketParameterGroup,
  notificationParameterGroup,
  reviewerParameterGroup,
} from '../configuration/definitions.js';
import { reviewerServices } from '../configuration/reviewers.js';
import { expenseLifecycle } from '../lifecycles/expense.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
import { ExampleError } from './lifecycle-example.js';

const groups: readonly ParameterGroup[] = [
  expenseParameterGroup,
  expenseTimingGroup,
  ticketTimingGroup,
  orderTimingGroup,
  invoiceTimingGroup,
  exportTimingGroup,
  subscriptionTimingGroup,
  ticketParameterGroup,
  notificationParameterGroup,
];
const lifecycles = [
  orderLifecycle,
  invoiceLifecycle,
  exportLifecycle,
  subscriptionLifecycle,
  expenseLifecycle,
  ticketLifecycle,
];
export class ParameterConfigurationService {
  public constructor(
    private readonly database: DatabaseManager,
    public readonly runtime: LifecycleRuntime,
    public readonly store: LifecycleParameterStore,
  ) {}
  public authorize(
    actor: string,
    operation: 'read' | 'write' | 'candidates',
    group?: string,
  ): void {
    const role = person(actor)?.role;
    const allowed =
      operation === 'write'
        ? role === 'finance'
        : operation === 'candidates'
          ? ['finance', 'director', 'manager'].includes(role ?? '')
          : [
              'finance',
              'director',
              'manager',
              'applicant',
              'agent',
              'customer',
            ].includes(role ?? '') &&
            (!['agent', 'customer'].includes(role ?? '') ||
              group === undefined ||
              ['ticketPolicy', 'notificationCopy', 'ticketTiming'].includes(
                group,
              ));
    if (!allowed)
      throw new ExampleError(
        'FORBIDDEN',
        'PARAMETER_ACCESS_DENIED',
        'This example persona may not perform this configuration operation.',
      );
  }
  private group(key: string): ParameterGroup {
    const group = groups.find((item) => item.key === key);
    if (!group)
      throw new ExampleError(
        'NOT_FOUND',
        'PARAMETER_GROUP_NOT_FOUND',
        'The configuration group does not exist.',
      );
    return group;
  }
  public async read(
    key: string,
    actor: string,
    workflow?: string,
    configuration?: ParameterVersion,
  ): Promise<ParameterGroupView> {
    this.authorize(actor, 'read', key);
    const group = this.group(key);
    const owners = lifecycles.filter(
      (lifecycle) =>
        (!workflow || lifecycle.name === workflow) &&
        lifecycle.parameterConfiguration?.groups.some(
          (candidate) => candidate.key === key,
        ),
    );
    if (owners.length !== 1)
      throw new ExampleError(
        'NOT_FOUND',
        'PARAMETER_WORKFLOW_REQUIRED',
        'Choose a workflow that declares this parameter group.',
      );
    const owner = owners[0];
    const version =
      configuration ??
      (await workflowParameterStore(this.store, owner.name).read('demo', key));
    if (version && version.schemaVersion !== group.schemaVersion)
      throw new ParameterConfigurationError(
        'CONFIGURATION_INCOMPATIBLE',
        'The current configuration needs an explicit schema migration.',
      );
    const defaults = Object.fromEntries(
      Object.keys(group.fields).map((field) => [
        field,
        (owner.parameters as unknown as JsonObject)[field]!,
      ]),
    ) as JsonObject;
    return {
      key,
      title: group.title,
      revision: version?.revision ?? 0,
      origin: version && version.revision > 0 ? 'configuration' : 'default',
      schemaVersion: group.schemaVersion,
      values: normalizeParameterValues(group, version?.values ?? defaults),
      canUpdate: person(actor)?.role === 'finance',
      fields: Object.fromEntries(
        Object.entries(group.fields).map(
          ([key, { parse: _parse, ...field }]) => [key, field],
        ),
      ),
      uses: [owner].flatMap((lifecycle) =>
        Object.entries(group.fields)
          .filter(() =>
            lifecycle.parameterConfiguration?.groups.some(
              (item) => item.key === key,
            ),
          )
          .map(([field, declaration]) => ({
            lifecycle: lifecycle.name,
            field,
            readMode:
              declaration.readMode ??
              lifecycle.parameterConfiguration?.readMode ??
              'live',
            bindings: declaration.bindings ?? [],
          })),
      ),
    };
  }
  public async list(
    actor: string,
    workflow: string,
  ): Promise<readonly ParameterGroupView[]> {
    this.authorize(actor, 'read');
    const visible = groups.filter((group) => {
      if (
        !lifecycles.some(
          (item) =>
            item.name === workflow &&
            item.parameterConfiguration?.groups.some(
              (candidate) => candidate.key === group.key,
            ),
        )
      )
        return false;
      try {
        this.authorize(actor, 'read', group.key);
        return true;
      } catch {
        return false;
      }
    });
    const version = await this.store.read('demo', `lifecycle.${workflow}`);
    return Promise.all(
      visible.map((group) =>
        this.read(
          group.key,
          actor,
          workflow,
          version
            ? {
                ...version,
                schemaVersion: group.schemaVersion,
                values: Object.fromEntries(
                  Object.keys(group.fields).map((field) => [
                    field,
                    version.values[field],
                  ]),
                ),
              }
            : undefined,
        ),
      ),
    );
  }
  public async readWorkflow(
    actor: string,
    workflow: string,
  ): Promise<{
    kind: 'lifecycle';
    revision: number;
    values: JsonObject;
    groups: readonly ParameterGroupView[];
  }> {
    const groups = await this.list(actor, workflow);
    return {
      kind: 'lifecycle' as const,
      revision: groups[0]?.revision ?? 0,
      values: Object.fromEntries(
        groups.flatMap((group) => Object.entries(group.values)),
      ),
      groups,
    };
  }
  public async save(
    key: string,
    values: JsonObject,
    expectedRevision: number,
    requestId: string,
    actor: string,
    workflow?: string,
  ): Promise<ParameterGroupView> {
    this.authorize(actor, 'write', key);
    const current = await this.read(key, actor, workflow);
    const owner = current.uses[0].lifecycle;
    await this.saveWorkflow(
      normalizeParameterValues(this.group(key), values),
      expectedRevision,
      requestId,
      actor,
      owner,
    );
    return this.read(key, actor, owner);
  }
  public async saveWorkflow(
    values: JsonObject,
    expectedRevision: number,
    requestId: string,
    actor: string,
    workflow: string,
  ): Promise<{
    kind: 'lifecycle';
    revision: number;
    values: JsonObject;
    groups: readonly ParameterGroupView[];
  }> {
    this.authorize(actor, 'write');
    const group = workflowParameterGroup(workflow);
    const current = await this.readWorkflow(actor, workflow);
    const normalized = normalizeParameterValues(group, {
      ...current.values,
      ...values,
    });
    const saved = await this.database
      .connection()
      .transaction(async (connection) => {
        for (const [field, definition] of Object.entries(group.fields))
          if (definition.type === 'reviewers') {
            for (const selection of normalized[
              field
            ] as unknown as ReviewerSelection[]) {
              const collections: Record<string, string> = {
                department: 'lifecycleExampleDepartments',
                role: 'lifecycleExampleRoles',
                user: 'lifecycleExamplePeople',
              };
              const collection = collections[selection.type];
              if (
                !collection ||
                !(await connection.repository(collection).findOne({
                  filter: { id: selection.referenceId, scope: 'demo' },
                }))
              )
                throw new ParameterConfigurationError(
                  'CONFIGURATION_INVALID',
                  'A reviewer reference is unavailable in this scope.',
                );
            }
          }
        return this.store.save(
          {
            scope: 'demo',
            group,
            values: normalized,
            expectedRevision,
            requestId,
            actorId: actor,
            at: new Date().toISOString(),
          },
          connection,
        );
      });
    return {
      kind: 'lifecycle',
      revision: saved.revision,
      values: saved.values,
      groups: current.groups.map((group) => ({
        ...group,
        revision: saved.revision,
        origin: 'configuration',
        values: Object.fromEntries(
          Object.keys(group.fields).map((field) => [
            field,
            saved.values[field],
          ]),
        ),
      })),
    };
  }
  private referenceRepository(type: ReviewerReferenceType) {
    const names = {
      department: 'lifecycleExampleDepartments',
      role: 'lifecycleExampleRoles',
      user: 'lifecycleExamplePeople',
    };
    return this.database.repository<{
      id: string;
      name: string;
      scope: string;
      active?: boolean;
    }>(names[type]);
  }
  public async references(
    actor: string,
    type: ReviewerReferenceType,
    q: string,
    page = 1,
    pageSize = 10,
  ): Promise<ReviewerReferencePage> {
    this.authorize(actor, 'candidates');
    const size = Math.max(1, Math.min(10, Math.trunc(pageSize)));
    const currentPage = Math.max(1, Math.trunc(page));
    const query = q.trim();
    if (!query)
      return {
        data: [],
        meta: { page: currentPage, pageSize: size, total: 0 },
      };
    const repository = this.referenceRepository(type);
    const filter: NonNullable<
      Parameters<typeof repository.count>[0]
    >['filter'] = (f) =>
      f.and([
        f.string('scope').eq('demo'),
        f.string('name').includes(query),
        ...(type === 'user' ? [f.boolean('active').isTrue()] : []),
      ]);
    const data = await repository.findMany({
      filter,
      sort: (s) => [s.field('name').asc(), s.field('id').asc()],
      limit: size,
      offset: (currentPage - 1) * size,
    });
    return {
      data: data.map((row) => ({ id: String(row.id), name: String(row.name) })),
      meta: {
        page: currentPage,
        pageSize: size,
        total: await repository.count({ filter }),
      },
    };
  }
  public async reference(
    actor: string,
    type: ReviewerReferenceType,
    id: string,
  ): Promise<ReviewerReference | null> {
    this.authorize(actor, 'candidates');
    const row = await this.referenceRepository(type).findOne({
      filter: { scope: 'demo', id },
    });
    return row
      ? {
          id: String(row.id),
          name: String(row.name),
          ...(row.active === undefined ? {} : { active: Boolean(row.active) }),
        }
      : null;
  }
  public async candidates(
    values: JsonObject,
    applicantId: string,
    actor: string,
  ): Promise<readonly string[]> {
    this.authorize(actor, 'candidates');
    const normalized = normalizeParameterValues(reviewerParameterGroup, values);
    return reviewerServices(this.database, undefined).reviewers(
      normalized.reviewerRule as unknown as ReviewerSelection[],
      applicantId,
    );
  }
  public async history(
    name: string,
    id: string,
    actor: string,
  ): Promise<ParameterHistoryView> {
    this.authorize(actor, 'read');
    const lifecycle = lifecycles.find((item) => item.name === name);
    if (!lifecycle)
      throw new ExampleError(
        'NOT_FOUND',
        'PARAMETER_LIFECYCLE_NOT_FOUND',
        'The lifecycle does not expose parameters.',
      );
    for (const group of lifecycle.parameterConfiguration?.groups ?? [])
      this.authorize(actor, 'read', group.key);
    const record = await this.database
      .repository(lifecycle.collection)
      .findOne({ filter: { id: Number(id) } });
    if (!record)
      throw new ExampleError(
        'NOT_FOUND',
        'RECORD_NOT_FOUND',
        'The record does not exist.',
      );
    if (
      !['finance', 'director', 'manager', 'agent'].includes(
        person(actor)?.role ?? '',
      ) &&
      record.applicantId !== actor &&
      record.requesterId !== actor
    )
      throw new ExampleError(
        'FORBIDDEN',
        'PARAMETER_ACCESS_DENIED',
        'Only the record owner or a reviewer may inspect this history.',
      );
    const [snapshot, usages, current] = await Promise.all([
      this.store.snapshot('demo', name, id),
      this.store.listUsage('demo', name, id),
      this.runtime.resolveParameters(name, {
        record: { ...record, id },
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ]);
    return {
      snapshot: snapshot ?? null,
      usages,
      current,
      recorded: usages.length > 0,
    };
  }
}
