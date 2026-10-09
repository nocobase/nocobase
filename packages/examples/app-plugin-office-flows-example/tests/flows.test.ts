// Both processes end to end on a test database, with the plugin's migration
// and seed applied. Effects run in process, so every assertion follows the
// action that caused it.
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { DatabaseManager } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  emptyDataRequest,
  type DataRequestForm,
} from '../shared/data-request.js';
import { registerLifecycles } from '../server/lifecycles/index.js';
import { apiRoutes } from '../server/routes/index.js';
import { COLLECTIONS } from '../server/scope.js';
import { OfficeFlowsService } from '../server/services/office-flows.js';
import { OfficeStore, people, type Plain } from '../server/services/store.js';
import { officeFlowsServiceToken } from '../server/tokens.js';
import { migrations, seeds } from './fixtures.js';

let testDatabase: TestDatabase;
let database: DatabaseManager;
let service: OfficeFlowsService;
let store: OfficeStore;
let runtime: LifecycleRuntime;

beforeEach(async () => {
  testDatabase = await createTestDatabase({ migrations, seeds });
  database = testDatabase.database;
  runtime = new LifecycleRuntime({
    store: createRepositoryLifecycleStore(database, {
      collections: {
        transitions: COLLECTIONS.transitions,
        effectRuns: COLLECTIONS.effectRuns,
      },
    }),
  });
  store = new OfficeStore(database);
  registerLifecycles(runtime, store);
  service = new OfficeFlowsService(database, runtime, store);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await testDatabase.destroy();
});

function today(offset = 0): string {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

function requestForm(values: Partial<DataRequestForm>): DataRequestForm {
  return {
    ...emptyDataRequest(),
    subject: '客户画像数据',
    reason: '季度经营分析',
    volume: '50≤x<2万',
    scope: 'internal',
    consumers: ['内部合规风险审计'],
    frequency: 'once',
    deliveryDate: today(5),
    ...values,
  };
}

async function approveToAcceptance(id: string): Promise<void> {
  await service.fire('dataRequests', id, 'submit', {}, 'zhangwei');
  await service.fire('dataRequests', id, 'approve', {}, 'lina');
  await service.fire('dataRequests', id, 'approve', {}, 'wangqiang');
  await service.fire('dataRequests', id, 'approve', {}, 'zhaomin');
}

async function noticesOf(person: string): Promise<Plain[]> {
  return (await service.notices(person, { page: 1, pageSize: 100 })).records;
}

describe('data usage request', () => {
  it('refuses to submit an incomplete form and changes nothing', async () => {
    const created = await service.createDataRequest(
      requestForm({ consumers: ['内部管理及分析'] }),
      'zhangwei',
    );
    await expect(
      service.fire(
        'dataRequests',
        String(created.id),
        'submit',
        {},
        'zhangwei',
      ),
    ).rejects.toMatchObject({
      // The request to submit is fine; the form is not complete yet.
      code: 'INVALID_STATE',
      message: expect.stringContaining('授权人员范围'),
    });
    const detail = await service.dataRequestDetail(
      String(created.id),
      'zhangwei',
    );
    expect((detail.record as Plain).status).toBe('draft');
  });

  it('goes through three managers and creates the one-time extraction task', async () => {
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    await service.fire('dataRequests', id, 'submit', {}, 'zhangwei');
    await expect(
      service.fire('dataRequests', id, 'approve', {}, 'wangqiang'),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
    });
    await service.fire('dataRequests', id, 'approve', {}, 'lina');
    await service.fire('dataRequests', id, 'approve', {}, 'wangqiang');
    await service.fire('dataRequests', id, 'approve', {}, 'zhaomin');
    const detail = await service.dataRequestDetail(id, 'chenjing');
    expect((detail.record as Plain).status).toBe('accepting');
    expect(detail.extractions).toMatchObject([
      { origin: 'once', status: 'pending' },
    ]);
  });

  it('cannot return to the applicant once a task exists, nor finish while one is open', async () => {
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    const available = (await (
      await service.dataRequestDetail(id, 'chenjing')
    ).available) as {
      name: string;
      allowed: boolean;
    }[];
    expect(
      available.find((item) => item.name === 'acceptanceReturn')?.allowed,
    ).toBe(false);
    expect(available.find((item) => item.name === 'complete')?.allowed).toBe(
      false,
    );
    expect(available.find((item) => item.name === 'exit')?.allowed).toBe(true);

    const [task] = (await service.dataRequestDetail(id, 'chenjing'))
      .extractions as Plain[];
    const taskId = String(task!.id);
    await expect(
      service.fire('extractions', taskId, 'submit', {}, 'liuyang'),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE',
    });
    await service.updateExtraction(
      taskId,
      {
        category: '一次性清单数据抽取',
        complexity: '简单',
        agreedDeliveryAt: today(6),
        sourceSystem: '核心系统',
        needsDownload: true,
        feedbackNote: '已抽取',
        managerId: 'chenjing',
        confirmerId: 'zhangwei',
      },
      'liuyang',
    );
    await service.fire('extractions', taskId, 'submit', {}, 'liuyang');
    await service.fire('dataRequests', id, 'complete', {}, 'chenjing');
    expect(
      ((await service.dataRequestDetail(id, 'chenjing')).record as Plain)
        .status,
    ).toBe('completed');
  });

  it('edits only the fields an edit sends, and clears the answers they hide', async () => {
    const created = await service.createDataRequest(
      requestForm({ consumers: ['内部合规风险审计', '内部管理及分析'] }),
      'zhangwei',
    );
    const id = String(created.id);
    await service.updateDataRequest(
      id,
      { subject: '客户分群数据' },
      'zhangwei',
    );
    let form = (await service.dataRequestDetail(id, 'zhangwei'))
      .form as DataRequestForm;
    expect(form).toMatchObject({
      subject: '客户分群数据',
      reason: '季度经营分析',
      volume: '50≤x<2万',
      frequency: 'once',
      deliveryDate: today(5),
      scope: 'internal',
      consumers: ['内部合规风险审计', '内部管理及分析'],
    });
    // The change is merged into the stored form before it is normalized, so
    // a new frequency alone drops the delivery date it no longer asks for.
    await service.updateDataRequest(
      id,
      {
        frequency: 'daily',
        firstUseDate: today(1),
        lastDeliveryDate: today(9),
      },
      'zhangwei',
    );
    form = (await service.dataRequestDetail(id, 'zhangwei'))
      .form as DataRequestForm;
    expect(form).toMatchObject({
      subject: '客户分群数据',
      frequency: 'daily',
      deliveryDate: '',
      firstUseDate: today(1),
      consumers: ['内部合规风险审计', '内部管理及分析'],
    });
  });

  it('keeps both fields of two partial edits that interleave', async () => {
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    // Another request on its own store, so the spy below does not see it.
    const other = new OfficeFlowsService(
      database,
      runtime,
      new OfficeStore(database),
    );
    const find = store.find.bind(store);
    let interleaved = false;
    vi.spyOn(store, 'find').mockImplementation(async (collection, recordId) => {
      const record = await find(collection, recordId);
      if (!interleaved && collection === COLLECTIONS.dataRequests) {
        interleaved = true;
        // The other edit reads and writes after this one read, before it writes.
        await other.updateDataRequest(id, { reason: '年度审计' }, 'zhangwei');
      }
      return record;
    });
    await service.updateDataRequest(
      id,
      { subject: '客户分群数据' },
      'zhangwei',
    );
    expect(interleaved).toBe(true);
    vi.restoreAllMocks();
    const form = (await service.dataRequestDetail(id, 'zhangwei'))
      .form as DataRequestForm;
    expect(form).toMatchObject({
      subject: '客户分群数据',
      reason: '年度审计',
      volume: '50≤x<2万',
    });
  });

  it('refuses a transition decided on the record before an edit', async () => {
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    // A page shows the form as it is, ready to submit.
    const seen = await runtime.view('dataRequests', id, { id: 'zhangwei' });
    expect(seen.available.find((item) => item.name === 'submit')).toMatchObject(
      { allowed: true },
    );
    // Meanwhile another edit changes the form: the version moves on, so a
    // submit decided on what that page showed no longer commits.
    await service.updateDataRequest(
      id,
      { subject: '客户分群数据' },
      'zhangwei',
    );
    await expect(
      runtime.fire('dataRequests', id, 'submit', {
        actor: { id: 'zhangwei' },
        expect: { version: seen.version },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const detail = await service.dataRequestDetail(id, 'zhangwei');
    expect((detail.record as Plain).status).toBe('draft');
  });

  it('creates the due tasks of a periodic request once, however often it sweeps', async () => {
    const created = await service.createDataRequest(
      requestForm({
        frequency: 'daily',
        deliveryDate: '',
        firstUseDate: today(),
        lastDeliveryDate: today(30),
      }),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    const first = await service.runSchedule(today(10));
    expect(first).toBeGreaterThan(0);
    expect(await service.runSchedule(today(10))).toBe(0);
    const detail = await service.dataRequestDetail(id, 'chenjing');
    expect(detail.extractions).toHaveLength(first);
    // Every task falls on a day the schedule says is due.
    const due = (detail.schedule as { due: string[] }).due;
    for (const task of detail.extractions as Plain[])
      expect(due).toContain(task.scheduledDate);
  });
});

describe('incoming document', () => {
  async function dispatching(): Promise<string> {
    const created = await service.createIncoming(
      {
        title: '关于加强数据安全管理的通知',
        code: 'SW-2026-0101',
        sender: '监管机构',
        senderRef: '监管〔2026〕12号',
        summary: '要求各部门开展数据安全自查。',
        officeOpinion: '财务部统筹，工会、信息技术部协办。',
        distributionType: 'review',
      },
      'zhoujie',
    );
    const id = String(created.id);
    await service.fireIncoming(id, 'submit', {}, 'zhoujie');
    await service.fireIncoming(id, 'approve', {}, 'wuhua');
    await service.fireIncoming(id, 'approve', {}, 'zhengkai');
    return id;
  }

  const allPeople = {
    includeClerks: true,
    includeHeads: true,
    includeLeaders: true,
  };

  it('reminds a person in several departments once, also after re-approval', async () => {
    const id = await dispatching();
    await service.addRow(
      'incoming',
      id,
      { departmentName: '财务部', ...allPeople },
      'zhoujie',
    );
    await service.addRow(
      'incoming',
      id,
      { departmentName: '工会', ...allPeople },
      'zhoujie',
    );
    await service.fireIncoming(id, 'dispatchClerks', {}, 'zhoujie');

    const detail = await service.incomingDetail(id, 'zhoujie');
    const [level] = detail.processing as { tasks: Plain[] }[];
    expect(level!.tasks.map((task) => task.departmentName)).toEqual([
      '财务部',
      '工会',
    ]);
    // 何明 heads both departments.
    expect(await noticesOf('heming')).toHaveLength(1);

    await service.fireIncoming(id, 'reapprove', {}, 'zhoujie');
    await service.fireIncoming(id, 'approve', {}, 'wuhua');
    await service.fireIncoming(id, 'approve', {}, 'zhengkai');
    await service.addRow(
      'incoming',
      id,
      { departmentName: '信息技术部', ...allPeople },
      'zhoujie',
    );
    await service.fireIncoming(id, 'dispatchClerks', {}, 'zhoujie');
    // 马慧 leads 财务部 and 信息技术部; the second dispatch does not remind her again.
    expect(await noticesOf('mahui')).toHaveLength(1);
    expect(await noticesOf('huangtao')).toHaveLength(1);
    const traces = (await service.incomingDetail(id, 'zhoujie'))
      .traces as Plain[];
    expect(traces.at(-1)?.detail).toMatchObject({ skipped: ['mahui'] });
  });

  it('forwards to management from configuration and by hand, reminding each member once', async () => {
    const id = await dispatching();
    const groups = (await service.config()).managementGroups as Plain[];
    for (const group of groups)
      await service.addManagement(id, { groupId: Number(group.id) }, 'zhoujie');
    await service.addManagement(
      id,
      { groupName: '临时群组', members: ['caobin'] },
      'zhoujie',
    );
    await service.fireIncoming(id, 'forwardManagement', {}, 'zhoujie');
    // 叶青 is in both configured groups, 曹斌 in one of them and the manual row.
    expect(await noticesOf('yeqing')).toHaveLength(1);
    expect(await noticesOf('caobin')).toHaveLength(1);
    expect(await noticesOf('jiangli')).toHaveLength(1);
  });

  it('runs a clerk task through countersign, execution team and executor', async () => {
    const id = await dispatching();
    await service.addRow(
      'incoming',
      id,
      { departmentName: '财务部', ...allPeople },
      'zhoujie',
    );
    await service.fireIncoming(id, 'dispatchClerks', {}, 'zhoujie');
    const [clerk] = (await service.myTasks('gaoyan')).records;
    const clerkId = String(clerk!.id);

    // Both of 财务部's clerks countersign before it moves on.
    await service.fireTask(
      'clerk',
      clerkId,
      'sign',
      { decision: 'C' },
      'gaoyan',
    );
    expect(
      ((await service.taskDetail('clerk', clerkId, 'gaoyan')).record as Plain)
        .status,
    ).toBe('signing');
    await service.fireTask(
      'clerk',
      clerkId,
      'sign',
      { decision: 'C' },
      'linfeng',
    );
    expect(
      ((await service.taskDetail('clerk', clerkId, 'gaoyan')).record as Plain)
        .status,
    ).toBe('reviewing');

    // An execution team below this task, and an assisting department beside it.
    await service.addRow(
      'clerk',
      clerkId,
      { departmentName: '工会', ...allPeople },
      'gaoyan',
    );
    await service.fireTask('clerk', clerkId, 'dispatchTeams', {}, 'gaoyan');
    await service.addRow(
      'clerk',
      clerkId,
      {
        departmentName: '风险管理部',
        includeClerks: true,
        includeHeads: false,
        includeLeaders: false,
        assistOther: true,
      },
      'gaoyan',
    );
    const incoming = await service.incomingDetail(id, 'zhoujie');
    const clerkLevel = (incoming.processing as { tasks: Plain[] }[])[0]!;
    expect(clerkLevel.tasks.map((task) => task.departmentName)).toEqual([
      '财务部',
      '风险管理部',
    ]);
    // The root records both of 财务部's distributions.
    expect((incoming.traces as Plain[]).map((trace) => trace.action)).toEqual(
      expect.arrayContaining(['财务部派发执行团队', '财务部派发其他部门协助']),
    );

    const [team] = (await service.myTasks('luoxin')).records;
    const teamId = String(team!.id);
    expect(team!.kind).toBe('team');
    await service.addRow(
      'team',
      teamId,
      { departmentName: '董事会办公室', ...allPeople },
      'luoxin',
    );
    await service.fireTask('team', teamId, 'dispatchExecutors', {}, 'luoxin');
    const [executor] = (await service.myTasks('tangjun')).records;
    expect(executor!.kind).toBe('executor');

    const executorView = await service.taskDetail(
      'executor',
      String(executor!.id),
      'tangjun',
    );
    expect(
      (executorView.processing as { title: string }[]).map(
        (level) => level.title,
      ),
    ).toEqual(['执行人列表', '执行团队列表', '办事人员列表']);
    await service.updateTask(
      'executor',
      String(executor!.id),
      { redHeadFeedback: false, feedback: '已按要求自查' },
      'tangjun',
    );
    await service.fireTask(
      'executor',
      String(executor!.id),
      'submitFeedback',
      {},
      'tangjun',
    );
    const done = await service.taskDetail(
      'executor',
      String(executor!.id),
      'tangjun',
    );
    expect((done.record as Plain).status).toBe('done');
    // The executor's feedback stays out of the root's traces.
    const rootTraces = (await service.incomingDetail(id, 'zhoujie'))
      .traces as Plain[];
    expect(rootTraces.some((trace) => trace.action === '派发执行人')).toBe(
      false,
    );
    expect(people((done.record as Plain).assignees)).toEqual(['tangjun']);
  });

  it('ends a clerk task on an objection and tells the office', async () => {
    const id = await dispatching();
    await service.addRow(
      'incoming',
      id,
      { departmentName: '工会', ...allPeople },
      'zhoujie',
    );
    await service.fireIncoming(id, 'dispatchClerks', {}, 'zhoujie');
    const [clerk] = (await service.myTasks('luoxin')).records;
    await service.fireTask(
      'clerk',
      String(clerk!.id),
      'sign',
      { decision: 'B' },
      'luoxin',
    );
    expect(
      (
        (await service.taskDetail('clerk', String(clerk!.id), 'luoxin'))
          .record as Plain
      ).status,
    ).toBe('objected');
    expect(
      (await noticesOf('zhoujie')).map((notice) => notice.message),
    ).toEqual([expect.stringContaining('有异议')]);
  });
});

describe('extraction tasks and the request they belong to', () => {
  it('creates every manual task asked for at once, each with its own key', async () => {
    const created = await service.createDataRequest(
      requestForm({
        frequency: 'other',
        deliveryDate: '',
        firstUseDate: today(1),
        lastDeliveryDate: today(30),
        frequencyNote: '按需',
      }),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    const task = {
      topic: '临时取数',
      requirement: '',
      scheduledDate: today(3),
      executorIds: [],
    };
    await Promise.all(
      Array.from({ length: 3 }, () =>
        service.createManualExtraction(id, task, 'chenjing'),
      ),
    );
    const detail = await service.dataRequestDetail(id, 'chenjing');
    const tasks = detail.extractions as Plain[];
    expect(tasks).toHaveLength(3);
    expect(new Set(tasks.map((item) => item.periodKey)).size).toBe(3);
  });

  it('creates no task for a request that has left acceptance', async () => {
    const created = await service.createDataRequest(
      requestForm({
        frequency: 'other',
        deliveryDate: '',
        firstUseDate: today(1),
        lastDeliveryDate: today(30),
        frequencyNote: '按需',
      }),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    await service.fire('dataRequests', id, 'exit', {}, 'chenjing');
    expect(
      await store.createExtraction({
        requestId: Number(id),
        periodKey: today(),
        origin: 'scheduled',
        scheduledDate: today(),
        topic: '客户画像数据',
        requirement: '',
        executorIds: ['sunli'],
      }),
    ).toBeUndefined();
    const detail = await service.dataRequestDetail(id, 'chenjing');
    expect(detail.extractions).toEqual([]);
  });

  it('makes a decision taken before a task was created meet a conflict', async () => {
    const created = await service.createDataRequest(
      requestForm({
        frequency: 'other',
        deliveryDate: '',
        firstUseDate: today(1),
        lastDeliveryDate: today(30),
        frequencyNote: '按需',
      }),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    // The acceptor read the request with no open task and decides to complete it.
    const seen = await runtime.view('dataRequests', id, { id: 'chenjing' });
    expect(
      seen.available.find((item) => item.name === 'complete'),
    ).toMatchObject({ allowed: true });
    // Meanwhile the sweep creates a task: the request's version moves on.
    expect(
      await store.createExtraction({
        requestId: Number(id),
        periodKey: today(),
        origin: 'scheduled',
        scheduledDate: today(),
        topic: '客户画像数据',
        requirement: '',
        executorIds: ['sunli'],
      }),
    ).toBeDefined();
    await expect(
      runtime.fire('dataRequests', id, 'complete', {
        actor: { id: 'chenjing' },
        expect: { version: seen.version },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    // Read again, the open task is what refuses it.
    const now = await runtime.view('dataRequests', id, { id: 'chenjing' });
    expect(
      now.available.find((item) => item.name === 'complete'),
    ).toMatchObject({ allowed: false });
  });
});

describe('office store under retries and races', () => {
  it('hands out a different number to each concurrent caller', async () => {
    const numbers = await Promise.all(
      Array.from({ length: 5 }, () => store.nextNumber('TEST')),
    );
    expect(new Set(numbers).size).toBe(5);
    expect(numbers.map((number) => number.slice(-4)).sort()).toEqual([
      '0001',
      '0002',
      '0003',
      '0004',
      '0005',
    ]);
  });

  it('retries an aborted serial allocation, but stops after five retries', async () => {
    const repository = store.repository(COLLECTIONS.serials);
    vi.spyOn(store, 'repository').mockReturnValue(repository);
    const deadlock = Object.assign(new Error('Transaction aborted'), {
      code: 'ER_LOCK_DEADLOCK',
    });
    const upsert = vi
      .spyOn(repository, 'upsertOne')
      .mockRejectedValueOnce(deadlock);
    expect(await store.nextNumber('RETRY')).toMatch(/-0001$/);
    expect(upsert).toHaveBeenCalledTimes(2);
    upsert.mockClear().mockRejectedValue(deadlock);
    await expect(store.nextNumber('EXHAUSTED')).rejects.toBe(deadlock);
    expect(upsert).toHaveBeenCalledTimes(6);
  });

  it('does not retry an unknown serial outcome or a caller-owned transaction', async () => {
    const repository = store.repository(COLLECTIONS.serials);
    vi.spyOn(store, 'repository').mockReturnValue(repository);
    const uncertain = new Error('Connection lost');
    const upsert = vi
      .spyOn(repository, 'upsertOne')
      .mockRejectedValue(uncertain);
    await expect(store.nextNumber('UNKNOWN')).rejects.toBe(uncertain);
    expect(upsert).toHaveBeenCalledTimes(1);
    const deadlock = Object.assign(new Error('Transaction aborted'), {
      code: 'ER_LOCK_DEADLOCK',
    });
    upsert.mockClear().mockRejectedValue(deadlock);
    await expect(
      database.transaction(async (connection) => {
        const bound = store.bound(connection);
        vi.spyOn(bound, 'repository').mockReturnValue(repository);
        await bound.nextNumber('BOUND');
      }),
    ).rejects.toBe(deadlock);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('writes a keyed trace once however often it is retried', async () => {
    const trace = {
      key: 'incoming:42',
      docKind: 'incoming',
      docId: 1,
      actorId: 'registrar',
      action: '派发办事人员',
      detail: {},
    };
    await store.trace(trace);
    await store.trace(trace);
    await store.trace({ ...trace, key: undefined });
    expect(
      await database
        .repository(COLLECTIONS.traces)
        .count({ filter: { docKind: 'incoming', docId: 1 } }),
    ).toBe(2);
  });

  it('lists only the assignee’s tasks across kinds, with stable pagination', async () => {
    for (const level of [1, 2, 3] as const) {
      const { record } = await database
        .repository(COLLECTIONS.assignments)
        .createOne({
          values: {
            rootId: 1,
            parentKind: 'incoming',
            parentId: 1,
            level,
            departmentName: '财务部',
            assignees: ['clerk-a', 'clerk-a', 'clerk-b'],
            ccHeads: ['head-only'],
            createdBy: 'registrar',
            createdAt: new Date().toISOString(),
          },
        });
      await store.dispatch(level, [Number(record.id)]);
      await store.dispatch(level, [Number(record.id)]);
    }
    const all = await service.myTasks('clerk-a');
    expect(all.total).toBe(3);
    expect(all.records.map((task) => task.kind)).toEqual([
      'clerk',
      'team',
      'executor',
    ]);
    expect(await service.myTasks('clerk-a', { page: 2, pageSize: 1 })).toEqual({
      total: 3,
      records: [all.records[1]],
    });
    expect((await service.myTasks('clerk-b')).total).toBe(3);
    expect(await service.myTasks('head-only')).toEqual({
      total: 0,
      records: [],
    });
    expect(await service.myTasks('stranger')).toEqual({
      total: 0,
      records: [],
    });
    expect(await database.repository(COLLECTIONS.taskAssignees).count()).toBe(
      6,
    );
  });

  it('reports a row an earlier attempt dispatched instead of skipping it', async () => {
    const row = await database.repository(COLLECTIONS.assignments).createOne({
      values: {
        rootId: 1,
        parentKind: 'incoming',
        parentId: 1,
        level: 1,
        departmentName: '财务部',
        assignees: ['clerk-a'],
        createdBy: 'registrar',
        createdAt: new Date().toISOString(),
      },
    });
    const id = Number(row.record.id);
    const first = await store.dispatch(1, [id]);
    // The attempt stopped after dispatching, before the reminders and the
    // trace; the retry must still report the task so they are sent.
    const retry = await store.dispatch(1, [id]);
    expect(retry.created).toEqual(first.created);
    expect(retry.notified).toEqual([]);
    expect(retry.skipped).toEqual(['clerk-a']);
    expect(await database.repository(COLLECTIONS.clerkTasks).count({})).toBe(1);
  });
});

describe('routes on the real service', () => {
  const signedIn = {
    required: () => async (context, next) => {
      context.set('auth', { user: { id: 'user-1' } });
      await next();
    },
  } as unknown as Auth;

  async function router(): Promise<Hono> {
    const container = new ServiceContainer();
    container.instance(authenticationToken, signedIn);
    container.instance(officeFlowsServiceToken, service);
    const app: AppPluginApplication = {
      appName: 'main',
      publicBasePath: '',
      config: {} as never,
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    };
    return (await apiRoutes.createRouter(app)) as Hono;
  }

  function send(path: string, body: unknown, method = 'POST'): Request {
    return new Request(`http://localhost/officeFlowsExample/${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('answers an open task as a failed precondition to the acceptor, and anyone else as forbidden', async () => {
    const routes = await router();
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    // The one-time extraction task is open: the acceptor has to wait for it.
    const waiting = await routes.request(
      send(`dataRequests/${id}/fire?actAs=chenjing`, {
        transition: 'complete',
      }),
    );
    expect(waiting.status).toBe(400);
    await expect(waiting.json()).resolves.toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'GUARD_REJECTED',
        domain: 'officeFlowsExample',
        metadata: {
          blockers: [{ code: 'extractionsOpen', kind: 'precondition' }],
        },
      },
    });
    const returned = await routes.request(
      send(`dataRequests/${id}/fire?actAs=chenjing`, {
        transition: 'acceptanceReturn',
        input: { reason: '需要补充' },
      }),
    );
    expect(returned.status).toBe(400);
    await expect(returned.json()).resolves.toMatchObject({
      error: { metadata: { blockers: [{ code: 'extractionsExist' }] } },
    });
    // The applicant may not complete it, open task or not.
    const applicant = await routes.request(
      send(`dataRequests/${id}/fire?actAs=zhangwei`, {
        transition: 'complete',
      }),
    );
    expect(applicant.status).toBe(403);
    await expect(applicant.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        metadata: { blockers: [{ kind: 'permission' }] },
      },
    });
  });

  it('answers an incomplete form on submit as a failed precondition', async () => {
    const routes = await router();
    const created = await service.createDataRequest(
      requestForm({ reason: '' }),
      'zhangwei',
    );
    const submitted = await routes.request(
      send(`dataRequests/${String(created.id)}/fire?actAs=zhangwei`, {
        transition: 'submit',
      }),
    );
    expect(submitted.status).toBe(400);
    await expect(submitted.json()).resolves.toMatchObject({
      error: { status: 'FAILED_PRECONDITION', reason: 'INVALID_STATE' },
    });
  });

  it('patches only the form fields sent', async () => {
    const routes = await router();
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    const patched = await routes.request(
      send(
        `dataRequests/${id}?actAs=zhangwei`,
        { form: { reason: '年度审计' } },
        'PATCH',
      ),
    );
    expect(patched.status).toBe(200);
    await expect(patched.json()).resolves.toMatchObject({
      data: {
        form: {
          subject: '客户画像数据',
          reason: '年度审计',
          volume: '50≤x<2万',
          consumers: ['内部合规风险审计'],
          deliveryDate: today(5),
        },
      },
    });
  });

  it('names the body field a refusal is about', async () => {
    const routes = await router();
    const created = await service.createIncoming(
      {
        title: '关于加强数据安全管理的通知',
        code: 'SW-2026-0101',
        sender: '监管机构',
        senderRef: '监管〔2026〕12号',
        summary: '要求各部门开展数据安全自查。',
        officeOpinion: '财务部统筹。',
        distributionType: 'review',
      },
      'zhoujie',
    );
    const id = String(created.id);
    await service.fireIncoming(id, 'submit', {}, 'zhoujie');
    await service.fireIncoming(id, 'approve', {}, 'wuhua');
    await service.fireIncoming(id, 'approve', {}, 'zhengkai');

    // A group the body names that does not exist: a bad request, not a 404.
    const unknownGroup = await routes.request(
      send(`incoming/${id}/managementRows?actAs=zhoujie`, { groupId: '999' }),
    );
    expect(unknownGroup.status).toBe(400);
    await expect(unknownGroup.json()).resolves.toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'MANAGEMENT_GROUP_NOT_FOUND',
        fieldViolations: [expect.objectContaining({ field: 'groupId' })],
      },
    });
    const unnamed = await routes.request(
      send(`incoming/${id}/managementRows?actAs=zhoujie`, {
        members: ['caobin'],
      }),
    );
    await expect(unnamed.json()).resolves.toMatchObject({
      error: {
        reason: 'MANAGEMENT_GROUP_REQUIRED',
        fieldViolations: [expect.objectContaining({ field: 'groupName' })],
      },
    });
    const noDepartment = await routes.request(
      send(`incoming/${id}/rows?actAs=zhoujie`, { departmentName: '不存在' }),
    );
    expect(noDepartment.status).toBe(400);
    await expect(noDepartment.json()).resolves.toMatchObject({
      error: {
        reason: 'DEPARTMENT_REQUIRED',
        fieldViolations: [expect.objectContaining({ field: 'departmentName' })],
      },
    });
    // The document the URL names still answers 404 when it is missing.
    const missing = await routes.request(
      send('incoming/999/managementRows?actAs=zhoujie', { groupId: '1' }),
    );
    expect(missing.status).toBe(404);
  });

  it('answers an edit that keeps losing to concurrent changes with 409 ABORTED', async () => {
    const routes = await router();
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    const find = store.find.bind(store);
    let reads = 0;
    // Every read is overtaken by another change before the edit writes.
    vi.spyOn(store, 'find').mockImplementation(async (collection, recordId) => {
      const record = await find(collection, recordId);
      if (collection === COLLECTIONS.dataRequests) {
        reads += 1;
        await database.repository(COLLECTIONS.dataRequests).updateMany({
          filter: { id: Number(id) },
          values: { lifecycleVersion: { increment: 1 } },
        });
      }
      return record;
    });
    const patched = await routes.request(
      send(
        `dataRequests/${id}?actAs=zhangwei`,
        { form: { subject: '客户分群数据' } },
        'PATCH',
      ),
    );
    expect(patched.status).toBe(409);
    await expect(patched.json()).resolves.toMatchObject({
      error: { status: 'ABORTED', reason: 'RECORD_CHANGED' },
    });
    // Read again on each attempt, and nothing written.
    expect(reads).toBe(3);
    vi.restoreAllMocks();
    const form = (await service.dataRequestDetail(id, 'zhangwei'))
      .form as DataRequestForm;
    expect(form.subject).toBe('客户画像数据');
  });

  it('refuses a second countersign to that clerk alone, as forbidden', async () => {
    const routes = await router();
    const created = await service.createIncoming(
      {
        title: '关于加强数据安全管理的通知',
        code: 'SW-2026-0101',
        sender: '监管机构',
        senderRef: '监管〔2026〕12号',
        summary: '要求各部门开展数据安全自查。',
        officeOpinion: '财务部统筹。',
        distributionType: 'review',
      },
      'zhoujie',
    );
    const id = String(created.id);
    await service.fireIncoming(id, 'submit', {}, 'zhoujie');
    await service.fireIncoming(id, 'approve', {}, 'wuhua');
    await service.fireIncoming(id, 'approve', {}, 'zhengkai');
    await service.addRow(
      'incoming',
      id,
      {
        departmentName: '财务部',
        includeClerks: true,
        includeHeads: false,
        includeLeaders: false,
      },
      'zhoujie',
    );
    await service.fireIncoming(id, 'dispatchClerks', {}, 'zhoujie');
    const [clerk] = (await service.myTasks('gaoyan')).records;
    const sign = async (person: string): Promise<Response> =>
      routes.request(
        send(`tasks/clerk/${String(clerk!.id)}/fire?actAs=${person}`, {
          transition: 'sign',
          input: { decision: 'C' },
        }),
      );
    expect((await sign('gaoyan')).status).toBe(204);
    // Having signed refuses gaoyan only; it is not a state nobody can pass.
    const again = await sign('gaoyan');
    expect(again.status).toBe(403);
    await expect(again.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'GUARD_REJECTED',
        metadata: {
          blockers: [{ code: 'alreadySigned', kind: 'permission' }],
        },
      },
    });
    expect((await sign('linfeng')).status).toBe(204);
    expect(
      (
        (await service.taskDetail('clerk', String(clerk!.id), 'gaoyan'))
          .record as Plain
      ).status,
    ).toBe('reviewing');
  });

  it('names both fields of a manual extraction task left empty', async () => {
    const routes = await router();
    const created = await service.createDataRequest(
      requestForm({}),
      'zhangwei',
    );
    const id = String(created.id);
    await approveToAcceptance(id);
    const empty = await routes.request(
      send(`dataRequests/${id}/extractions?actAs=chenjing`, {
        topic: ' ',
        scheduledDate: 'soon',
      }),
    );
    expect(empty.status).toBe(400);
    await expect(empty.json()).resolves.toMatchObject({
      error: {
        reason: 'EXTRACTION_FIELDS_REQUIRED',
        fieldViolations: [
          expect.objectContaining({ field: 'topic' }),
          expect.objectContaining({ field: 'scheduledDate' }),
        ],
      },
    });
  });
});
