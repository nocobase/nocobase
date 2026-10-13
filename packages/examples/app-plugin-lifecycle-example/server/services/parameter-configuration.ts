import type {
  ParameterGroupView,
  ParameterHistoryView,
  ReviewerOptions,
} from '../../shared/parameter-configuration.js';
import type { DatabaseManager } from '@nocobase/db';
import {
  normalizeParameterValues,
  ParameterConfigurationError,
  type JsonObject,
  type LifecycleRuntime,
  type LifecycleParameterStore,
  type ParameterGroup,
  type ReviewerSelection,
} from '@nocobase/lifecycle';
import { person } from '../../shared/people.js';
import {
  expenseParameterGroup,
  ticketParameterGroup,
  notificationParameterGroup,
  reviewerParameterGroup,
} from '../configuration/definitions.js';
import { reviewerServices } from '../configuration/reviewers.js';
import { expenseLifecycle } from '../lifecycles/expense.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
import {
  reviewerDemoLifecycle,
  reviewerLiveDemoLifecycle,
} from '../lifecycles/reviewer-demo.js';
import { ExampleError } from './lifecycle-example.js';

const groups: readonly ParameterGroup[] = [
  expenseParameterGroup,
  ticketParameterGroup,
  notificationParameterGroup,
  reviewerParameterGroup,
];
const lifecycles = [
  expenseLifecycle,
  ticketLifecycle,
  reviewerDemoLifecycle,
  reviewerLiveDemoLifecycle,
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
              ['ticketPolicy', 'notificationCopy'].includes(group));
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
  public async read(key: string, actor: string): Promise<ParameterGroupView> {
    this.authorize(actor, 'read', key);
    const group = this.group(key);
    const owner = lifecycles.find((lifecycle) =>
      lifecycle.parameterConfiguration?.groups.some(
        (candidate) => candidate.key === key,
      ),
    )!;
    const version = await this.store.read('demo', key);
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
      origin: version ? 'configuration' : 'default',
      schemaVersion: group.schemaVersion,
      values: normalizeParameterValues(group, version?.values ?? defaults),
      canUpdate: person(actor)?.role === 'finance',
      fields: Object.fromEntries(
        Object.entries(group.fields).map(
          ([key, { parse: _parse, ...field }]) => [key, field],
        ),
      ),
      uses: lifecycles.flatMap((lifecycle) =>
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
  public async list(actor: string): Promise<readonly ParameterGroupView[]> {
    this.authorize(actor, 'read');
    const visible = groups.filter((group) => {
      try {
        this.authorize(actor, 'read', group.key);
        return true;
      } catch {
        return false;
      }
    });
    return Promise.all(visible.map((group) => this.read(group.key, actor)));
  }
  public async save(
    key: string,
    values: JsonObject,
    expectedRevision: number,
    requestId: string,
    actor: string,
  ): Promise<ParameterGroupView> {
    this.authorize(actor, 'write', key);
    const group = this.group(key);
    const normalized = normalizeParameterValues(group, values);
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
      ...(await this.read(key, actor)),
      revision: saved.revision,
      values: saved.values,
      origin: 'configuration',
    };
  }
  public async options(actor: string): Promise<ReviewerOptions> {
    this.authorize(actor, 'candidates');
    const names = [
      'lifecycleExampleDepartments',
      'lifecycleExampleRoles',
      'lifecycleExamplePeople',
    ];
    const [departments, roles, people] = await Promise.all(
      names.map((name) =>
        this.database.repository(name).findMany({ filter: { scope: 'demo' } }),
      ),
    );
    const plain = (rows: readonly Record<string, unknown>[] | undefined) =>
      (rows ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        ...(row.active === undefined ? {} : { active: Boolean(row.active) }),
      }));
    return {
      departments: plain(departments),
      roles: plain(roles),
      people: plain(people),
    };
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
  public async createReview(
    name: 'reviewerDemo' | 'reviewerLiveDemo',
    actor: string,
  ): Promise<Readonly<Record<string, unknown>> & { readonly id: string }> {
    this.authorize(actor, 'read', 'financeReviewers');
    const result = await this.runtime.create(
      name,
      {
        applicantId: actor,
        candidates: [],
        createdAt: new Date().toISOString(),
      },
      { actor: { id: actor } },
    );
    return { ...result.record, id: String(result.record.id) };
  }
}
