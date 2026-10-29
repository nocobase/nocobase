import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '@nocobase/app-plugin-authorization/server';
import { ApiError } from '@nocobase/app-server/router';
import {
  RepositoryError,
  type DatabaseConnection,
  type RepositoryPolicy,
} from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';
import {
  CUSTOMERS,
  CONTACTS,
  REPS,
  type Customer,
  type Contact,
  type SalesRep,
} from './customer-contacts-authorization.js';
import { customerContactsData } from './customer-contacts-data.js';

export interface CustomerQuery {
  search?: string;
  status?: string;
  ownerId?: string;
  page: number;
  pageSize: number;
}
export type CustomerValues = Partial<
  Pick<Customer, 'name' | 'notes' | 'status' | 'ownerId'>
>;
export type BatchItem =
  | { id: string; outcome: 'updated' }
  | { id: string; outcome: 'failed'; reason: 'FORBIDDEN' | 'STATE_CONFLICT' };
export function crmForbidden(): ApiError {
  return new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'FORBIDDEN',
    domain: 'customerContacts',
    message: 'This record or operation is unavailable.',
  });
}
function closed(): ApiError {
  return new ApiError({
    status: 'ABORTED',
    reason: 'STATE_CONFLICT',
    domain: 'customerContacts',
    message: 'Closed customers cannot be changed.',
  });
}

/** Every query is bound to the current request's business action, including related-record lookups. */
export class CustomerContactsService {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly authz: AuthorizationContext,
  ) {}

  private readonly policies = new Map<
    string,
    Readonly<Record<string, RepositoryPolicy>>
  >();
  private resetAllowed = false;
  async prepareWrite(
    kind: 'customer' | 'contact' | 'reset',
    values: CustomerValues = {},
  ) {
    if (kind === 'reset') {
      this.resetAllowed = (await this.authz.snapshot()).unrestricted;
      if (!this.resetAllowed) throw crmForbidden();
      return;
    }
    if (kind === 'customer') {
      await this.customers(
        values.ownerId === undefined ? 'edit' : 'assign',
        Object.keys(values),
      );
      if (values.ownerId !== undefined) await this.reps();
    } else {
      await this.policy('contacts', 'edit', CONTACTS);
      await this.customers();
    }
  }
  withConnection(connection: DatabaseConnection) {
    const service = new CustomerContactsService(connection, this.authz);
    for (const [key, value] of this.policies) service.policies.set(key, value);
    service.resetAllowed = this.resetAllowed;
    return service;
  }
  private async policy(
    resource: string,
    action: string,
    collection: string,
  ): Promise<RepositoryPolicy> {
    const key = `${resource}/${action}`;
    if (!this.policies.has(key)) {
      const decision = await this.authz.authorize({
        resource: { type: 'composite', id: `example.crm.${resource}` },
        action,
      });
      if (decision.effect === 'deny' || !decision.conditions?.database)
        throw crmForbidden();
      this.policies.set(key, decision.conditions.database);
    }
    const policy = this.policies.get(key)?.[collection];
    if (!policy) throw crmForbidden();
    return policy;
  }
  private async customers(action = 'view', fields: string[] = []) {
    const policy = await this.policy('customers', action, CUSTOMERS);
    const repository = this.connection
      .repository<Customer>(CUSTOMERS)
      .withPolicy(policy);
    if (!policy.read) throw crmForbidden();
    if (!fields.length) return repository;
    const write = policy.update;
    if (
      !write ||
      (write !== true &&
        (write.fields === false ||
          (write.fields !== undefined &&
            !fields.every(
              (f) => write.fields !== false && write.fields!.includes(f),
            ))))
    )
      throw crmForbidden();
    return repository.narrow({
      read: write === true ? true : { scope: write.scope },
    });
  }
  async listCustomers(query: CustomerQuery) {
    const repository = await this.customers();
    const filter = buildFilter((f) =>
      f.and([
        ...(query.search
          ? [f.string('name').includes(query.search, { mode: 'insensitive' })]
          : []),
        ...(query.status ? [f.string('status').eq(query.status)] : []),
        ...(query.ownerId ? [f.string('ownerId').eq(query.ownerId)] : []),
      ]),
    );
    const [data, total] = await Promise.all([
      repository.findMany({
        filter,
        sort: (s) => s.field('id').asc(),
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      }),
      repository.count({ filter }),
    ]);
    return {
      data,
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }
  async getCustomer(id: string) {
    const row = await (await this.customers()).findOne({ filter: { id } });
    if (!row) throw crmForbidden();
    return row;
  }
  private async reps() {
    const policy = await this.policy('salesReps', 'view', REPS);
    if (!policy.read) throw crmForbidden();
    return this.connection.repository<SalesRep>(REPS).withPolicy(policy);
  }
  async listReps(query: CustomerQuery) {
    const repository = await this.reps();
    const filter = buildFilter((f) =>
      f.and([
        f.boolean('active').isTrue(),
        ...(query.search
          ? [f.string('name').includes(query.search, { mode: 'insensitive' })]
          : []),
      ]),
    );
    const [data, total] = await Promise.all([
      repository.findMany({
        filter,
        sort: (s) => s.field('id').asc(),
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      }),
      repository.count({ filter }),
    ]);
    return {
      data,
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }
  async getRep(id: string, active = false) {
    const row = await (
      await this.reps()
    ).findOne({ filter: { id, ...(active ? { active: true } : {}) } });
    if (!row) throw crmForbidden();
    return row;
  }
  async updateCustomers(ids: string[], values: CustomerValues) {
    // Validate the entire operation and target before classifying rows or issuing a write.
    const fields = Object.keys(values);
    const action = Object.hasOwn(values, 'ownerId') ? 'assign' : 'edit';
    const repository = await this.customers(action, fields);
    if (values.ownerId !== undefined) await this.getRep(values.ownerId, true);
    const rows = await repository.findMany({
      filter: buildFilter((f) => f.or(ids.map((id) => f.string('id').eq(id)))),
    });
    const visible = new Map(rows.map((row) => [row.id, row]));
    const items: BatchItem[] = ids.map((id) => {
      const row = visible.get(id);
      return !row
        ? { id, outcome: 'failed', reason: 'FORBIDDEN' }
        : row.status === 'closed'
          ? { id, outcome: 'failed', reason: 'STATE_CONFLICT' }
          : { id, outcome: 'updated' };
    });
    const eligible = items
      .filter((item) => item.outcome === 'updated')
      .map((item) => item.id);
    if (eligible.length) {
      // The Policy is still enforced by updateMany; repeat the state predicate at the write boundary.
      const result = await repository.updateMany({
        filter: buildFilter((f) =>
          f.and([
            f.or(eligible.map((id) => f.string('id').eq(id))),
            f.string('status').ne('closed'),
          ]),
        ),
        values,
      });
      // Unexpected changes abort the transaction; no success list escapes with uncommitted rows.
      if (result.updatedCount !== eligible.length) throw closed();
    }
    return {
      items,
      updated: eligible.length,
      failed: ids.length - eligible.length,
    };
  }
  async updateCustomer(id: string, values: CustomerValues) {
    const repository = await this.customers(
      values.ownerId === undefined ? 'edit' : 'assign',
      Object.keys(values),
    );
    const original = await repository.findOne({ filter: { id } });
    if (!original) throw crmForbidden();
    const result = await this.updateCustomers([id], values);
    const item = result.items[0];
    if (item.outcome === 'failed')
      throw item.reason === 'FORBIDDEN' ? crmForbidden() : closed();
    // An assignment can move the row outside the caller's scope. Return only the
    // permitted snapshot and the committed assignment, without an unscoped reread.
    return { ...original, ...values };
  }
  private async contacts(
    action = 'view',
    operation?: 'create' | 'update' | 'delete',
  ) {
    const policy = await this.policy('contacts', action, CONTACTS);
    if (!policy.read || (operation && !policy[operation])) throw crmForbidden();
    const repository = this.connection
      .repository<Contact>(CONTACTS)
      .withPolicy(policy);
    if (operation === 'update' || operation === 'delete') {
      const write = policy[operation];
      return repository.narrow({
        read: write === true ? true : write ? { scope: write.scope } : false,
      });
    }
    return repository;
  }
  async listContacts(id: string, query: CustomerQuery) {
    await this.getCustomer(id);
    const repository = await this.contacts();
    const filter = { customerId: id };
    const [data, total] = await Promise.all([
      repository.findMany({
        filter,
        sort: (s) => s.field('id').asc(),
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      }),
      repository.count({ filter }),
    ]);
    return {
      data,
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }
  async getContact(id: string) {
    const row = await (await this.contacts()).findOne({ filter: { id } });
    if (!row?.customerId) throw crmForbidden();
    await this.getCustomer(row.customerId);
    return row;
  }
  private async writableParent(id: string) {
    const parent = await this.getCustomer(id);
    const policy = await this.policy('contacts', 'edit', CUSTOMERS);
    if (
      !policy.read ||
      !(await this.connection
        .repository<Customer>(CUSTOMERS)
        .withPolicy(policy)
        .findOne({ filter: { id } }))
    )
      throw crmForbidden();
    if (parent.status === 'closed') throw closed();
    return parent;
  }
  async saveContact(values: Omit<Contact, 'id'>, id?: string) {
    const repository = await this.contacts('edit', id ? 'update' : 'create');
    if (id) {
      const current = await repository.findOne({ filter: { id } });
      if (!current?.customerId) throw crmForbidden();
      await this.writableParent(current.customerId);
    }
    await this.writableParent(values.customerId);
    try {
      return id
        ? (await repository.updateOne({ filter: { id }, values })).record
        : (
            await repository.createOne({
              values: { id: randomUUID(), ...values },
            })
          ).record;
    } catch (error) {
      if (
        error instanceof RepositoryError &&
        ['RECORD_NOT_FOUND', 'POLICY_DENIED'].includes(error.code)
      )
        throw crmForbidden();
      throw error;
    }
  }
  async deleteContact(id: string) {
    const repository = await this.contacts('edit', 'delete');
    const current = await repository.findOne({ filter: { id } });
    if (!current?.customerId) throw crmForbidden();
    await this.writableParent(current.customerId);
    await repository.deleteOne({ filter: { id } });
    return { saved: true };
  }
  async reset() {
    if (!this.resetAllowed) throw crmForbidden();
    const users = {} as { manager: string; rep: string; colleague: string };
    for (const key of ['manager', 'rep', 'colleague'] as const) {
      const user = await this.connection.query
        .selectFrom('user')
        .select('id')
        .where('username', '=', `crm_${key}`)
        .executeTakeFirst();
      if (!user || typeof user.id !== 'string')
        throw new ApiError({
          status: 'FAILED_PRECONDITION',
          reason: 'EXAMPLE_ACCOUNTS_MISSING',
          domain: 'customerContacts',
          message: 'Run application seeds before resetting this example.',
        });
      users[key] = user.id;
    }
    const data = customerContactsData(users);
    // Reset only this example's business data, never its roles or other learning datasets.
    for (const name of [CONTACTS, CUSTOMERS, REPS])
      await this.connection.query.deleteFrom(name).allowAllRows().execute();
    for (const values of data.reps)
      await this.connection
        .repository(REPS)
        .createOne({ values: { ...values } });
    for (const values of data.customers)
      await this.connection
        .repository(CUSTOMERS)
        .createOne({ values: { ...values } });
    for (const values of data.contacts)
      await this.connection
        .repository(CONTACTS)
        .createOne({ values: { ...values } });
    return { saved: true };
  }
}
