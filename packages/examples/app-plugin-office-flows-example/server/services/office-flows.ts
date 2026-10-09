import type {
  DatabaseManager,
  RepositoryFilter,
  RepositoryRecord,
} from '@nocobase/db';
import type {
  AvailableTransition,
  EffectRun,
  JsonObject,
  LifecycleDescription,
  LifecycleRuntime,
  TransitionEntry,
} from '@nocobase/lifecycle';

import {
  isDate,
  normalizeDataRequest,
  type DataRequestForm,
} from '../../shared/data-request.js';
import {
  DATA_REQUEST_ROLES,
  INCOMING_ROLES,
  PEOPLE,
} from '../../shared/people.js';
import { extractionDates, nextWorkday, nominalDates } from '../calendar.js';
import { formOf } from '../lifecycles/data-request.js';
import { COLLECTIONS } from '../scope.js';
import {
  idOf,
  people,
  TASK_COLLECTIONS,
  type OfficeStore,
  type Plain,
  type TaskKind,
} from './store.js';
import {
  EXTRACTION_FIELDS,
  INCOMING_FIELDS,
  TASK_FIELDS,
} from '../../shared/fields.js';
import { text } from '../../shared/text.js';

export type LifecycleName =
  | 'dataRequests'
  | 'extractions'
  | 'incoming'
  | 'clerkTasks'
  | 'teamTasks'
  | 'executorTasks';

const TASK_LIFECYCLES: Readonly<Record<TaskKind, LifecycleName>> = {
  clerk: 'clerkTasks',
  team: 'teamTasks',
  executor: 'executorTasks',
};

export interface OfficeFlowsErrorOptions {
  /**
   * The request body fields an `INVALID` refusal is about, which the route
   * reports as field violations so a form can mark them.
   */
  readonly field?: string | readonly string[];
}

/**
 * A refusal the service makes itself, before any lifecycle is involved:
 * `INVALID` is the request, `LOCKED` the record's state, `CONFLICT` a
 * concurrent change.
 */
export class OfficeFlowsError extends Error {
  /** The body fields the refusal names; empty when it is about none. */
  public readonly fields: readonly string[];

  public constructor(
    public readonly code:
      'NOT_FOUND' | 'FORBIDDEN' | 'INVALID' | 'LOCKED' | 'CONFLICT',
    /** Stable, UPPER_SNAKE_CASE: what a client branches on. */
    public readonly reason: string,
    message: string,
    options: OfficeFlowsErrorOptions = {},
  ) {
    super(message);
    this.name = 'OfficeFlowsError';
    const { field } = options;
    this.fields =
      field === undefined ? [] : typeof field === 'string' ? [field] : field;
  }
}

export interface RecordView {
  readonly record: Plain;
  readonly description: LifecycleDescription;
  readonly available: readonly AvailableTransition[];
  readonly history: {
    readonly transitions: readonly TransitionEntry[];
    readonly effectRuns: readonly EffectRun[];
  };
  readonly traces: readonly Plain[];
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

const FIRST_PAGE: Paging = { page: 1, pageSize: 20 };

export interface ProcessingLevel {
  readonly title: string;
  readonly opinionLabel: string;
  readonly opinion: string;
  readonly kind: TaskKind;
  readonly tasks: readonly Plain[];
}

export interface RowInput {
  readonly departmentName: string;
  readonly includeClerks: boolean;
  readonly includeHeads: boolean;
  readonly includeLeaders: boolean;
  /** Only on a clerk task's execution-team row: "是否派发其他部门协助". */
  readonly assistOther?: boolean;
}

const DATA_REQUEST_FIELDS: readonly (keyof DataRequestForm)[] = [
  'subject',
  'reason',
  'volume',
  'frequency',
  'deliveryDate',
  'firstUseDate',
  'lastDeliveryDate',
  'quarterDay',
  'monthDay',
  'weekDay',
  'frequencyNote',
  'scope',
  'consumers',
  'fileShieldAccepted',
  'fileShieldScope',
  'fileShieldCopy',
  'fileShieldValidUntil',
  'ndaFiles',
  'securityFiles',
];

/**
 * How often an edit reads the record again after a concurrent change wrote
 * first, before it answers `RECORD_CHANGED`.
 */
const EDIT_ATTEMPTS = 3;

/** Which state a record may be edited in, per kind. */
const EDITABLE_STATES: Readonly<Record<string, readonly string[]>> = {
  dataRequests: ['draft'],
  incoming: ['draft'],
  extractions: ['pending'],
  clerkTasks: ['reviewing'],
  teamTasks: ['processing'],
  executorTasks: ['processing'],
};

function pick(values: Plain, fields: readonly string[]): Plain {
  return Object.fromEntries(
    fields
      .filter((field) => field in values)
      .map((field) => [field, values[field]]),
  );
}

/**
 * The example's operations around the lifecycles. Every state change goes
 * through `runtime.fire()`; the methods here create records, edit the
 * fields a state allows, keep the distribution rows, and read what a page
 * shows.
 */
export class OfficeFlowsService {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly runtime: LifecycleRuntime,
    private readonly store: OfficeStore,
  ) {}

  // ── Reference data ─────────────────────────────────────────────────────

  public async config(): Promise<Plain> {
    const all = async (collection: string): Promise<Plain[]> =>
      (await this.database.repository(collection).findMany({})).map((row) => ({
        ...row,
      }));
    return {
      people: PEOPLE,
      roles: { dataRequest: DATA_REQUEST_ROLES, incoming: INCOMING_ROLES },
      departments: await all(COLLECTIONS.departments),
      managementGroups: await all(COLLECTIONS.managementGroups),
      holidays: await all(COLLECTIONS.holidays),
    };
  }

  /** The persona's reminders, newest first. */
  public async notices(
    actor: string,
    page: Paging = FIRST_PAGE,
  ): Promise<PlainPage> {
    return this.newestFirst(COLLECTIONS.notices, page, { recipient: actor });
  }

  // ── Shared ─────────────────────────────────────────────────────────────

  public async fire(
    name: LifecycleName,
    id: string,
    transition: string,
    input: JsonObject,
    actor: string,
    manual: boolean = true,
  ): Promise<void> {
    await this.runtime.fire(name, id, transition, {
      actor: { id: actor },
      input,
      manual,
    });
  }

  private async view(
    name: LifecycleName,
    collection: string,
    docKind: string,
    id: string,
    actor: string,
  ): Promise<RecordView> {
    const record = await this.require(collection, id);
    return {
      record,
      description: this.runtime.describe(name),
      available: await this.runtime.available(name, id, { id: actor }),
      history: await this.runtime.history(name, id),
      traces: await this.store.list(COLLECTIONS.traces, {
        docKind,
        docId: idOf(id),
      }),
    };
  }

  private async require(collection: string, id: unknown): Promise<Plain> {
    const record = await this.store.find(collection, id);
    if (!record)
      throw new OfficeFlowsError(
        'NOT_FOUND',
        'RECORD_NOT_FOUND',
        `Record "${text(id)}" does not exist.`,
      );
    return record;
  }

  /**
   * Writes an edit against the record as read: the state check, the
   * permission check and `change` all see that version, and the write
   * applies only while the record is still at it. Every edit moves
   * `lifecycleVersion` on, so of two edits read at the same version only one
   * applies; the other reads again and is applied anew to what the first
   * left, so neither overwrites the other with what it read before. A
   * transition that read the record before an edit wrote is refused with
   * `CONFLICT` when it commits, since it writes on the version it read. After
   * `EDIT_ATTEMPTS` lost races the edit gives up with `RECORD_CHANGED`.
   */
  private async edit(
    name: LifecycleName,
    collection: string,
    id: string,
    /** The columns to write, or how to derive them from the record as read. */
    change: Plain | ((record: Plain) => Plain),
    allowed: (record: Plain) => boolean,
  ): Promise<void> {
    for (let attempt = 1; attempt <= EDIT_ATTEMPTS; attempt += 1) {
      const record = await this.require(collection, id);
      if (!EDITABLE_STATES[name].includes(text(record.status)))
        throw new OfficeFlowsError(
          'LOCKED',
          'RECORD_LOCKED',
          'The record cannot be edited at this step.',
        );
      if (!allowed(record))
        throw new OfficeFlowsError(
          'FORBIDDEN',
          'EDIT_NOT_ALLOWED',
          'The current role cannot edit this record.',
        );
      const values = typeof change === 'function' ? change(record) : change;
      if (!Object.keys(values).length) return;
      // The status and its timestamp are never in `values`: only fire()
      // writes them. The version is the lifecycle's, and is moved from here
      // for the reason `OfficeStore.createExtraction` moves it: a transition
      // conditions its write on the version it decided on, so one that
      // checked these fields — `submit` validates the form, `submitFeedback`
      // the feedback — must not commit over values it did not see.
      const { updatedCount } = await this.database
        .repository(collection)
        .updateMany({
          filter: {
            id: idOf(id),
            status: text(record.status),
            lifecycleVersion: Number(record.lifecycleVersion ?? 0),
          },
          values: {
            ...values,
            lifecycleVersion: { increment: 1 },
          } as RepositoryRecord,
        });
      if (updatedCount) return;
    }
    throw new OfficeFlowsError(
      'CONFLICT',
      'RECORD_CHANGED',
      'Someone else kept changing the record; reload and try again.',
    );
  }

  // ── Data usage requests ────────────────────────────────────────────────

  public async listDataRequests(page: Paging = FIRST_PAGE): Promise<PlainPage> {
    return this.newestFirst(COLLECTIONS.dataRequests, page);
  }

  public async createDataRequest(
    form: DataRequestForm,
    actor: string,
  ): Promise<Plain> {
    if (actor !== DATA_REQUEST_ROLES.applicant)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'APPLICANT_ONLY',
        'Only the applicant can create a request.',
      );
    // Created through the lifecycle: the request's history starts here.
    const number = await this.store.nextNumber('SJSY');
    const { record } = await this.runtime.create(
      'dataRequests',
      {
        ...normalizeDataRequest(form),
        number,
        applicantId: actor,
        createdAt: this.store.now(),
      },
      { actor: { id: actor } },
    );
    return { ...record };
  }

  /**
   * Changes the fields `changes` names; the others keep their stored values.
   * Which fields show depends on others, such as `frequency` and `scope`, so
   * the change is merged into the stored form before it is normalized: a
   * patch of `frequency` alone still clears the answers it hides.
   */
  public async updateDataRequest(
    id: string,
    changes: Partial<DataRequestForm>,
    actor: string,
  ): Promise<void> {
    await this.edit(
      'dataRequests',
      COLLECTIONS.dataRequests,
      id,
      // Merged into the record as `edit` read it, and merged again if a
      // concurrent edit wrote first: a field this patch does not name keeps
      // the other edit's value instead of the one read before it.
      (record) =>
        pick(
          { ...normalizeDataRequest({ ...formOf(record), ...changes }) },
          DATA_REQUEST_FIELDS,
        ),
      (record) => record.applicantId === actor,
    );
  }

  public async dataRequestDetail(id: string, actor: string): Promise<Plain> {
    const view = await this.view(
      'dataRequests',
      COLLECTIONS.dataRequests,
      'dataRequest',
      id,
      actor,
    );
    const extractions = await this.store.list(COLLECTIONS.extractions, {
      requestId: idOf(id),
    });
    const form = formOf(view.record);
    const calendar = await this.store.calendar();
    const nominal = nominalDates(form);
    return {
      ...view,
      form,
      extractions,
      schedule: {
        due:
          form.frequency === 'once' && form.deliveryDate
            ? [nextWorkday(form.deliveryDate, calendar)]
            : extractionDates(form, calendar),
        shifted: nominal
          .map((date) => ({ date, workday: calendar.isWorkday(date) }))
          .filter((item) => !item.workday)
          .map((item) => ({
            date: item.date,
            to: nextWorkday(item.date, calendar),
          })),
      },
    };
  }

  /** "创建抽数子流程" on the acceptance page. */
  public async createManualExtraction(
    id: string,
    values: {
      topic: string;
      requirement: string;
      scheduledDate: string;
      executorIds: string[];
    },
    actor: string,
  ): Promise<Plain> {
    const request = await this.require(COLLECTIONS.dataRequests, id);
    if (request.status !== 'accepting' || actor !== DATA_REQUEST_ROLES.acceptor)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'ACCEPTOR_ONLY',
        'Only the acceptor can create an extraction task, and only while the request is in acceptance.',
      );
    const missing = [
      ...(values.topic.trim() ? [] : ['topic']),
      ...(isDate(values.scheduledDate) ? [] : ['scheduledDate']),
    ];
    if (missing.length)
      throw new OfficeFlowsError(
        'INVALID',
        'EXTRACTION_FIELDS_REQUIRED',
        'Give the extraction task a topic and a first extraction date.',
        { field: missing },
      );
    // A manual task has no period: its key is the number it is given, so
    // two created at once cannot collide on a count read beforehand.
    const created = await this.store.createExtraction({
      requestId: idOf(id),
      origin: 'manual',
      scheduledDate: values.scheduledDate,
      topic: values.topic.trim(),
      requirement: values.requirement,
      executorIds: values.executorIds.length
        ? values.executorIds
        : DATA_REQUEST_ROLES.executors,
    });
    if (!created)
      throw new OfficeFlowsError(
        'CONFLICT',
        'REQUEST_LEFT_ACCEPTANCE',
        'The request left acceptance before the task was created; reload and try again.',
      );
    return created;
  }

  /**
   * The daily sweep: every request in acceptance gets the extraction tasks
   * that are due by `today` and not yet created, counted from the day it was
   * accepted. Safe to repeat — the (request, date) key is unique.
   */
  public async runSchedule(
    today: string = this.store.now().slice(0, 10),
  ): Promise<number> {
    const calendar = await this.store.calendar();
    const requests = await this.database
      .repository(COLLECTIONS.dataRequests)
      .findMany({ filter: { status: 'accepting' } });
    let created = 0;
    for (const row of requests) {
      const form = formOf({ ...row });
      if (form.frequency === 'once' || form.frequency === 'other') continue;
      const acceptedOn = text(row.acceptedAt ?? row.statusChangedAt).slice(
        0,
        10,
      );
      for (const date of extractionDates(form, calendar)) {
        if (date < acceptedOn || date > today) continue;
        const task = await this.store.createExtraction({
          requestId: idOf(row.id),
          periodKey: date,
          origin: 'scheduled',
          scheduledDate: date,
          topic: `${text(row.subject)}（${date}）`,
          requirement: '',
          executorIds: DATA_REQUEST_ROLES.executors,
        });
        if (task) created += 1;
      }
    }
    return created;
  }

  public async extractionDetail(id: string, actor: string): Promise<Plain> {
    const view = await this.view(
      'extractions',
      COLLECTIONS.extractions,
      'extraction',
      id,
      actor,
    );
    return {
      ...view,
      request: await this.store.find(
        COLLECTIONS.dataRequests,
        view.record.requestId,
      ),
    };
  }

  public async updateExtraction(
    id: string,
    values: Plain,
    actor: string,
  ): Promise<void> {
    await this.edit(
      'extractions',
      COLLECTIONS.extractions,
      id,
      pick(values, EXTRACTION_FIELDS),
      (record) =>
        people(record.executorIds).includes(actor) ||
        actor === DATA_REQUEST_ROLES.acceptor,
    );
  }

  // ── Incoming documents ─────────────────────────────────────────────────

  public async listIncoming(page: Paging = FIRST_PAGE): Promise<PlainPage> {
    return this.newestFirst(COLLECTIONS.incoming, page);
  }

  public async createIncoming(values: Plain, actor: string): Promise<Plain> {
    if (actor !== INCOMING_ROLES.registrar)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'REGISTRAR_ONLY',
        'Only the office registrar can record an incoming document.',
      );
    // Created through the lifecycle: the document's history starts here.
    const number = await this.store.nextNumber('SWSQ');
    const { record } = await this.runtime.create(
      'incoming',
      {
        title: '',
        code: '',
        sender: '',
        senderRef: '',
        summary: '',
        officeOpinion: '',
        distributionType: '',
        officeHeadId: INCOMING_ROLES.officeHead,
        officeLeaderId: INCOMING_ROLES.officeLeader,
        attachments: [],
        ...pick(values, INCOMING_FIELDS),
        number,
        registrarId: actor,
        createdAt: this.store.now(),
      },
      { actor: { id: actor } },
    );
    return { ...record };
  }

  public async updateIncoming(
    id: string,
    values: Plain,
    actor: string,
  ): Promise<void> {
    await this.edit(
      'incoming',
      COLLECTIONS.incoming,
      id,
      pick(values, INCOMING_FIELDS),
      (record) => record.registrarId === actor,
    );
  }

  public async incomingDetail(id: string, actor: string): Promise<Plain> {
    const view = await this.view(
      'incoming',
      COLLECTIONS.incoming,
      'incoming',
      id,
      actor,
    );
    return {
      ...view,
      rows: await this.store.list(COLLECTIONS.assignments, {
        parentKind: 'incoming',
        parentId: idOf(id),
      }),
      management: await this.store.list(COLLECTIONS.managementCc, {
        incomingId: idOf(id),
      }),
      processing: [
        await this.level(
          '办事人员列表',
          '办公室意见',
          view.record.officeOpinion,
          'clerk',
          id,
        ),
      ],
    };
  }

  /** Adds a department row: its people come from the department configuration. */
  public async addRow(
    parentKind: 'incoming' | 'clerk' | 'team',
    parentId: string,
    input: RowInput,
    actor: string,
  ): Promise<number> {
    const parent = await this.rowParent(parentKind, parentId, actor);
    if (!input.includeClerks)
      throw new OfficeFlowsError(
        'INVALID',
        'ROW_CLERKS_REQUIRED',
        'A row must include the clerks.',
        { field: 'includeClerks' },
      );
    const department = await this.database
      .repository(COLLECTIONS.departments)
      .findOne({ filter: { name: input.departmentName } });
    if (!department)
      throw new OfficeFlowsError(
        'INVALID',
        'DEPARTMENT_REQUIRED',
        'Choose a department to distribute to.',
        { field: 'departmentName' },
      );
    // A clerk task's "派发其他部门协助" row goes to the root document's own
    // rows, at the clerk level, rather than to this task's execution team.
    const assist = parentKind === 'clerk' && input.assistOther === true;
    const level = assist ? 1 : { incoming: 1, clerk: 2, team: 3 }[parentKind];
    const created = await this.database
      .repository(COLLECTIONS.assignments)
      .createOne({
        values: {
          rootId: idOf(parent.rootId),
          parentKind: assist ? 'incoming' : parentKind,
          parentId: assist ? idOf(parent.rootId) : idOf(parentId),
          level,
          departmentName: input.departmentName,
          includeClerks: input.includeClerks,
          includeHeads: input.includeHeads,
          includeLeaders: input.includeLeaders,
          assignees: input.includeClerks ? people(department.clerks) : [],
          ccHeads: input.includeHeads ? people(department.heads) : [],
          ccLeaders: input.includeLeaders ? people(department.leaders) : [],
          origin: assist ? `clerk:${parentId}` : null,
          dispatched: false,
          createdBy: actor,
          createdAt: this.store.now(),
        },
      });
    const rowId = idOf(created.record.id);
    // Saving an assist row creates the sibling clerk task at once.
    if (assist)
      await this.fire(
        'clerkTasks',
        parentId,
        'requestAssist',
        { rowIds: [rowId] },
        actor,
      );
    return rowId;
  }

  public async removeRow(rowId: string, actor: string): Promise<void> {
    const row = await this.require(COLLECTIONS.assignments, rowId);
    if (row.dispatched)
      throw new OfficeFlowsError(
        'LOCKED',
        'ROW_DISPATCHED',
        'A row that has been dispatched cannot be removed.',
      );
    if (row.createdBy !== actor)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'ROW_OWNER_ONLY',
        'Only the person who added a row can remove it.',
      );
    await this.database
      .repository(COLLECTIONS.assignments)
      .deleteMany({ filter: { id: idOf(rowId), dispatched: false } });
  }

  public async addManagement(
    incomingId: string,
    input: { groupId?: number; groupName?: string; members?: string[] },
    actor: string,
  ): Promise<number> {
    const record = await this.require(COLLECTIONS.incoming, incomingId);
    if (record.status !== 'dispatching' || record.registrarId !== actor)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'MANAGEMENT_NOT_ALLOWED',
        'Only the registrar can add management groups, and only while the document is being dispatched.',
      );
    let groupName = (input.groupName ?? '').trim();
    let members = (input.members ?? []).filter((person) =>
      PEOPLE.some((item) => item.id === person),
    );
    let fromConfig = false;
    if (input.groupId !== undefined) {
      // A group the body names that does not exist is a bad request, not a
      // missing resource: the URL names the document, which does exist.
      const group = await this.store.find(
        COLLECTIONS.managementGroups,
        input.groupId,
      );
      if (!group)
        throw new OfficeFlowsError(
          'INVALID',
          'MANAGEMENT_GROUP_NOT_FOUND',
          `Management group "${input.groupId}" does not exist.`,
          { field: 'groupId' },
        );
      groupName = text(group.name);
      members = people(group.members);
      fromConfig = true;
    }
    if (!groupName || !members.length)
      throw new OfficeFlowsError(
        'INVALID',
        'MANAGEMENT_GROUP_REQUIRED',
        'Name the group and choose who to copy.',
        {
          field: fromConfig
            ? 'groupId'
            : [
                ...(groupName ? [] : ['groupName']),
                ...(members.length ? [] : ['members']),
              ],
        },
      );
    const created = await this.database
      .repository(COLLECTIONS.managementCc)
      .createOne({
        values: {
          incomingId: idOf(incomingId),
          groupName,
          members,
          fromConfig,
          forwarded: false,
          createdAt: this.store.now(),
        },
      });
    return idOf(created.record.id);
  }

  public async removeManagement(rowId: string, actor: string): Promise<void> {
    const row = await this.require(COLLECTIONS.managementCc, rowId);
    const record = await this.require(COLLECTIONS.incoming, row.incomingId);
    if (row.forwarded)
      throw new OfficeFlowsError(
        'LOCKED',
        'MANAGEMENT_ROW_FORWARDED',
        'A row that has been forwarded cannot be removed.',
      );
    if (record.registrarId !== actor)
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'MANAGEMENT_ROW_NOT_ALLOWED',
        'The current role cannot remove this row.',
      );
    await this.database
      .repository(COLLECTIONS.managementCc)
      .deleteMany({ filter: { id: idOf(rowId), forwarded: false } });
  }

  /** Dispatch transitions carry the rows pending now, so a retry sends the same ones. */
  public async fireIncoming(
    id: string,
    transition: string,
    input: JsonObject,
    actor: string,
  ): Promise<void> {
    const extra: JsonObject = {};
    if (transition === 'dispatchClerks')
      extra.rowIds = await this.pendingRows('incoming', id);
    if (transition === 'forwardManagement')
      extra.rowIds = (
        await this.store.list(COLLECTIONS.managementCc, {
          incomingId: idOf(id),
          forwarded: false,
        })
      ).map((row) => idOf(row.id));
    await this.fire('incoming', id, transition, { ...input, ...extra }, actor);
  }

  // ── Incoming-document tasks ────────────────────────────────────────────

  /**
   * The persona's tasks of every kind, clerk tasks first and each kind
   * newest first. They span three collections, so the page is cut from the
   * persona's own tasks in memory; a persona holds few.
   */
  public async myTasks(
    actor: string,
    page: Paging = FIRST_PAGE,
  ): Promise<PlainPage> {
    const memberships = await this.database
      .repository(COLLECTIONS.taskAssignees)
      .findMany({ filter: { personId: actor } });
    const tasks: Plain[] = [];
    for (const kind of ['clerk', 'team', 'executor'] as const) {
      const ids = memberships
        .filter((membership) => membership.kind === kind)
        .map((membership) => idOf(membership.taskId));
      if (ids.length === 0) continue;
      const rows = await this.database
        .repository(TASK_COLLECTIONS[kind])
        .findMany({
          filter: (filter) =>
            filter.or(ids.map((id) => filter.number('id').eq(id))),
          sort: (sort) => sort.field('id').desc(),
        });
      tasks.push(...rows.map((row) => ({ ...row, kind })));
    }
    const start = (page.page - 1) * page.pageSize;
    return {
      records: tasks.slice(start, start + page.pageSize),
      total: tasks.length,
    };
  }

  public async taskDetail(
    kind: TaskKind,
    id: string,
    actor: string,
  ): Promise<Plain> {
    const view = await this.view(
      TASK_LIFECYCLES[kind],
      TASK_COLLECTIONS[kind],
      kind,
      id,
      actor,
    );
    const root = await this.store.find(
      COLLECTIONS.incoming,
      view.record.rootId,
    );
    return {
      ...view,
      kind,
      root,
      rows:
        kind === 'executor'
          ? []
          : await this.store.list(COLLECTIONS.assignments, {
              parentKind: kind,
              parentId: idOf(id),
            }),
      processing: await this.chain(kind, view.record),
    };
  }

  public async updateTask(
    kind: TaskKind,
    id: string,
    values: Plain,
    actor: string,
  ): Promise<void> {
    await this.edit(
      TASK_LIFECYCLES[kind],
      TASK_COLLECTIONS[kind],
      id,
      pick(values, TASK_FIELDS[kind]),
      (record) => people(record.assignees).includes(actor),
    );
  }

  public async fireTask(
    kind: TaskKind,
    id: string,
    transition: string,
    input: JsonObject,
    actor: string,
  ): Promise<void> {
    const extra: JsonObject = {};
    if (transition === 'dispatchTeams' || transition === 'dispatchExecutors')
      extra.rowIds = await this.pendingRows(kind, id);
    await this.fire(
      TASK_LIFECYCLES[kind],
      id,
      transition,
      { ...input, ...extra },
      actor,
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async newestFirst(
    collection: string,
    page: Paging,
    filter?: RepositoryFilter<RepositoryRecord>,
  ): Promise<PlainPage> {
    const repository = this.database.repository(collection);
    const where = filter === undefined ? {} : { filter };
    const rows = await repository.findMany({
      ...where,
      sort: (sort) => sort.field('id').desc(),
      limit: page.pageSize,
      offset: (page.page - 1) * page.pageSize,
    });
    return {
      records: rows.map((row) => ({ ...row })),
      total: await repository.count(where),
    };
  }

  private async pendingRows(
    parentKind: string,
    parentId: string,
  ): Promise<number[]> {
    return (
      await this.store.list(COLLECTIONS.assignments, {
        parentKind,
        parentId: idOf(parentId),
        dispatched: false,
      })
    ).map((row) => idOf(row.id));
  }

  private async rowParent(
    parentKind: 'incoming' | 'clerk' | 'team',
    parentId: string,
    actor: string,
  ): Promise<Plain> {
    if (parentKind === 'incoming') {
      const record = await this.require(COLLECTIONS.incoming, parentId);
      if (record.status !== 'dispatching' || record.registrarId !== actor)
        throw new OfficeFlowsError(
          'FORBIDDEN',
          'ROWS_NOT_ALLOWED',
          'Only the registrar can add rows, and only while the document is being dispatched.',
        );
      return { ...record, rootId: record.id };
    }
    const record = await this.require(TASK_COLLECTIONS[parentKind], parentId);
    const open = parentKind === 'clerk' ? 'reviewing' : 'processing';
    if (record.status !== open || !people(record.assignees).includes(actor))
      throw new OfficeFlowsError(
        'FORBIDDEN',
        'TASK_ROWS_NOT_ALLOWED',
        'Only an assignee of a task in progress can add rows.',
      );
    return record;
  }

  private async level(
    title: string,
    opinionLabel: string,
    opinion: unknown,
    kind: TaskKind,
    parentId: unknown,
  ): Promise<ProcessingLevel> {
    return {
      title,
      opinionLabel,
      opinion: typeof opinion === 'string' ? opinion : '',
      kind,
      tasks: await this.store.list(TASK_COLLECTIONS[kind], {
        parentId: idOf(parentId),
      }),
    };
  }

  /**
   * The processing lists a task shows: its own children first, then each
   * level above it with all of that level's tasks and the opinion they
   * answered.
   */
  private async chain(
    kind: TaskKind,
    record: Plain,
  ): Promise<ProcessingLevel[]> {
    const root = await this.require(COLLECTIONS.incoming, record.rootId);
    const clerkLevel = (): Promise<ProcessingLevel> =>
      this.level(
        '办事人员列表',
        '办公室意见',
        root.officeOpinion,
        'clerk',
        root.id,
      );
    if (kind === 'clerk')
      return [
        await this.level(
          '执行团队列表',
          '办事人员意见',
          record.opinion,
          'team',
          record.id,
        ),
        await clerkLevel(),
      ];
    if (kind === 'team') {
      const clerk = await this.require(COLLECTIONS.clerkTasks, record.parentId);
      return [
        await this.level(
          '执行人列表',
          '执行团队意见',
          record.opinion,
          'executor',
          record.id,
        ),
        await this.level(
          '执行团队列表',
          '办事人员意见',
          clerk.opinion,
          'team',
          clerk.id,
        ),
        await clerkLevel(),
      ];
    }
    const team = await this.require(COLLECTIONS.teamTasks, record.parentId);
    const clerk = await this.require(COLLECTIONS.clerkTasks, team.parentId);
    return [
      await this.level(
        '执行人列表',
        '执行团队意见',
        team.opinion,
        'executor',
        team.id,
      ),
      await this.level(
        '执行团队列表',
        '办事人员意见',
        clerk.opinion,
        'team',
        clerk.id,
      ),
      await clerkLevel(),
    ];
  }
}
