import type {
  DatabaseManager,
  FilterBuilder,
  RepositoryRecord,
} from '@nocobase/db';
import type { LifecycleRuntime } from '@nocobase/lifecycle';

import {
  parseItems,
  totalCents,
  type ExpenseItem,
} from '../../shared/expense.js';
import { person } from '../../shared/people.js';
import { expenseLifecycle } from '../lifecycles/expense.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
import type { ExampleLifecycleName, Plain } from '../tokens.js';

/**
 * A refusal the service makes before any lifecycle is involved. `reason` is
 * stable, so a page can translate it; `message` says the same in English.
 */
export class ExampleError extends Error {
  public constructor(
    public readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'LOCKED' | 'CONFLICT',
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = 'ExampleError';
  }
}

/**
 * How often an edit reads the report again after a concurrent change wrote
 * first, before it answers `EXPENSE_CHANGED`.
 */
const EDIT_ATTEMPTS = 3;

function plain(row: Record<string, unknown>): Plain {
  const values: Plain = {};
  for (const [field, value] of Object.entries(row))
    values[field] = value instanceof Date ? value.toISOString() : value;
  return values;
}

export interface Paging {
  /** From 1. */
  readonly page: number;
  readonly pageSize: number;
}

export interface PlainPage {
  readonly records: readonly Plain[];
  readonly total: number;
}

export interface NewTicket {
  readonly subject: string;
  readonly category: string;
  readonly priority: string;
  readonly description: string;
  readonly failNotifications: number;
}

export interface ExpenseDraft {
  readonly title: string;
  readonly purpose: string;
  readonly items: readonly ExpenseItem[];
  readonly failPayments: number;
}

/** An edit: the fields it names change, the others keep their values. */
export type ExpenseChanges = Partial<ExpenseDraft>;

/**
 * The example's own operations around the runtime: creating and editing
 * records the way a form would, and reading what a page shows. Every state
 * change goes through `runtime.fire()`; nothing here writes the status.
 */
export class LifecycleExampleService {
  public constructor(
    private readonly database: DatabaseManager,
    /** The routes mount the library's record routes on it. */
    public readonly runtime: LifecycleRuntime,
    private readonly clock: () => Date = (): Date => new Date(),
  ) {}

  /** Agents see the whole queue; a customer sees their own tickets. Newest first. */
  public async listTickets(actor: string, page: Paging): Promise<PlainPage> {
    const own = person(actor)?.role !== 'agent';
    const repository = this.database.repository(ticketLifecycle.collection);
    const filter = own ? { filter: { requesterId: actor } } : {};
    const rows = await repository.findMany({
      ...filter,
      sort: (sort) => sort.field('id').desc(),
      limit: page.pageSize,
      offset: (page.page - 1) * page.pageSize,
    });
    return { records: rows.map(plain), total: await repository.count(filter) };
  }

  /** An applicant sees their own reports; an approver, those waiting for them. Newest first. */
  public async listExpenses(
    actor: string,
    view: 'mine' | 'approvals',
    page: Paging,
  ): Promise<PlainPage> {
    const repository = this.database.repository(expenseLifecycle.collection);
    const filter = {
      filter:
        view === 'mine'
          ? { applicantId: actor }
          : // Only what is waiting for a decision; a report sent back is with its applicant.
            (filter: FilterBuilder) =>
              filter.and([
                filter.string('approverId').eq(actor),
                filter.or([
                  filter.string('status').eq('awaitingManager'),
                  filter.string('status').eq('awaitingFinance'),
                ]),
              ]),
    };
    const rows = await repository.findMany({
      ...filter,
      sort: (sort) => sort.field('id').desc(),
      limit: page.pageSize,
      offset: (page.page - 1) * page.pageSize,
    });
    return { records: rows.map(plain), total: await repository.count(filter) };
  }

  /** The lifecycle's `create` decides who may file one and what it must hold. */
  public createTicket(values: NewTicket, actor: string): Promise<Plain> {
    return this.create(
      'tickets',
      {
        ...values,
        requesterId: actor,
        assigneeId: null,
      },
      actor,
    );
  }

  public createExpense(values: ExpenseDraft, actor: string): Promise<Plain> {
    return this.create(
      'expenses',
      {
        ...this.expenseChanges(values),
        applicantId: actor,
        approverId: null,
      },
      actor,
    );
  }

  /**
   * A report is edited only by its applicant, while it is a draft or sent
   * back. Only the fields in `changes` are written.
   *
   * The edit is checked against the report as read and written only while
   * the report is still at that version, and every edit moves
   * `lifecycleVersion` on. A transition writes on the version it decided on,
   * so a `submit` that read the report before this edit landed — and routed
   * on its old amount, or found its old lines ready — is refused with
   * `CONFLICT` instead of committing over values it never saw. Of two edits
   * read at the same version only one applies at once; the other reads the
   * report again and is applied to what the first left, so neither loses
   * the other's fields. After `EDIT_ATTEMPTS` lost races it gives up with
   * `EXPENSE_CHANGED`.
   */
  public async updateExpense(
    id: string,
    changes: ExpenseChanges,
    actor: string,
  ): Promise<Plain> {
    const repository = this.database.repository(expenseLifecycle.collection);
    for (let attempt = 1; attempt <= EDIT_ATTEMPTS; attempt += 1) {
      const current = await repository.findOne({ filter: { id: Number(id) } });
      if (!current)
        throw new ExampleError(
          'NOT_FOUND',
          'EXPENSE_NOT_FOUND',
          'The expense report does not exist.',
        );
      if (current.applicantId !== actor)
        throw new ExampleError(
          'FORBIDDEN',
          'OWN_EXPENSE_ONLY',
          'Only the applicant can edit this report.',
        );
      if (current.status !== 'draft' && current.status !== 'needsInfo')
        throw new ExampleError(
          'LOCKED',
          'EXPENSE_LOCKED',
          'A report under review cannot be edited; withdraw it first.',
        );
      const values = this.expenseChanges(changes);
      if (!Object.keys(values).length) return plain(current);
      // The state and version as read. The status and its timestamp are
      // never written here, only by fire(); the version is moved on so a
      // transition decided on what this edit replaces does not commit.
      const { updatedCount } = await repository.updateMany({
        filter: {
          id: Number(id),
          status: String(current.status),
          lifecycleVersion: Number(current.lifecycleVersion ?? 0),
        },
        values: {
          ...values,
          lifecycleVersion: { increment: 1 },
        } as RepositoryRecord,
      });
      if (updatedCount > 0) {
        const updated = await repository.findOne({
          filter: { id: Number(id) },
        });
        return plain(updated ?? current);
      }
    }
    throw new ExampleError(
      'CONFLICT',
      'EXPENSE_CHANGED',
      'The report kept changing while it was being edited; reload it and try again.',
    );
  }

  /** The parameters the lifecycle runs with, which pages quote to their users. */
  public parameters(name: ExampleLifecycleName): object {
    return this.runtime.parameters(name);
  }

  /** Sweeps the triggers now instead of waiting for the next scheduled sweep. */
  public runTriggers(): Promise<number> {
    return this.runtime.runTriggers();
  }

  /** The columns a draft or an edit writes; the total moves with the items. */
  private expenseChanges(changes: ExpenseChanges): Plain {
    const values: Plain = {};
    if (changes.title !== undefined) values.title = changes.title;
    if (changes.purpose !== undefined) values.purpose = changes.purpose;
    if (changes.items !== undefined) {
      const items = parseItems(changes.items);
      values.items = items;
      values.amountCents = totalCents(items);
    }
    if (changes.failPayments !== undefined)
      values.failPayments = changes.failPayments;
    return values;
  }

  /** Created through the lifecycle, so a record's history starts at its creation. */
  private async create(
    name: ExampleLifecycleName,
    values: Plain,
    actor: string,
  ): Promise<Plain> {
    const { record } = await this.runtime.create(
      name,
      { ...values, createdAt: this.clock().toISOString() },
      { actor: { id: actor } },
    );
    return { ...record };
  }
}
