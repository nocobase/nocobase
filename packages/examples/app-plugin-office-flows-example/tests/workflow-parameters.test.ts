import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { OfficeWorkflowParameterService } from '../server/services/workflow-parameters.js';
import { OfficeStore } from '../server/services/store.js';
import { migrations, seeds } from './fixtures.js';

const test = createDatabaseTest({ migrations, seeds });
test('shares role members while isolating dispatch rules and checks both revisions atomically', async ({
  database,
}) => {
  const service = new OfficeWorkflowParameterService(database);
  const initial = await service.read('incoming');
  const other = await service.read('clerkTasks');
  const departments = [
    {
      name: 'Shared department',
      clerks: ['huangtao'],
      heads: ['xulei'],
      leaders: [],
    },
  ];
  const saved = await service.save('incoming', initial.values, 0, {
    departments,
    expectedRevision: 0,
  });
  expect(saved.organization).toMatchObject({ departments, revision: 1 });
  expect((await service.read('clerkTasks')).organization?.departments).toEqual(
    departments,
  );
  expect((await service.read('clerkTasks')).values).toEqual(other.values);
  expect(
    (await service.read('teamTasks')).values.dispatchRules?.ownDepartmentOnly,
  ).toBe(true);
  const changed = {
    ...other.values,
    dispatchRules: { ...other.values.dispatchRules!, ccHeads: true },
  };
  await expect(
    service.save('clerkTasks', changed, 0, {
      expectedRevision: 0,
      departments,
    }),
  ).rejects.toMatchObject({ reason: 'CONFIGURATION_CONFLICT' });
  expect((await service.read('clerkTasks')).revision).toBe(0);
  expect((await service.read('clerkTasks')).values).toEqual(other.values);
  await expect(
    service.save('incoming', initial.values, 0, {
      departments: [],
      expectedRevision: 1,
    }),
  ).rejects.toMatchObject({ reason: 'CONFIGURATION_CONFLICT' });
  expect((await service.organization()).departments).toEqual(departments);
  await expect(
    service.save('clerkTasks', { ...changed, departments }, 0),
  ).rejects.toMatchObject({ reason: 'INVALID_WORKFLOW_PARAMETERS' });
  await expect(service.read('executorTasks')).rejects.toMatchObject({
    reason: 'WORKFLOW_PARAMETERS_NOT_FOUND',
  });
});
test('rejects deleting a department selected by another workflow', async ({
  database,
}) => {
  const service = new OfficeWorkflowParameterService(database);
  const team = await service.read('teamTasks');
  const name = team.organization!.departments[0]!.name;
  await service.save(
    'teamTasks',
    {
      dispatchRules: { ...team.values.dispatchRules!, departmentNames: [name] },
    },
    0,
  );
  const incoming = await service.read('incoming');
  await expect(
    service.save('incoming', incoming.values, 0, {
      expectedRevision: incoming.organization!.revision,
      departments: [],
    }),
  ).rejects.toMatchObject({ reason: 'DEPARTMENT_IN_USE' });
  expect((await service.read('incoming')).revision).toBe(0);
});
test('reads legacy overrides as shared defaults and freezes them when saving rules', async ({
  database,
}) => {
  const departments = [
    { name: 'Legacy', clerks: ['huangtao'], heads: [], leaders: [] },
  ];
  await database.repository('officeFlowsWorkflowParameters').createOne({
    values: { id: 'office.teamTasks', revision: 1, values: { departments } },
  });
  const service = new OfficeWorkflowParameterService(database);
  const team = await service.read('teamTasks');
  expect(team.organization).toMatchObject({
    legacyOverrides: true,
    departments: expect.arrayContaining(departments),
  });
  expect(team.values.dispatchRules?.departmentNames).toEqual(['Legacy']);
  await service.save('teamTasks', team.values, 1);
  expect((await service.organization()).departments).toEqual(
    expect.arrayContaining(departments),
  );
  expect((await service.organization()).legacyOverrides).toBe(false);
});
test('the schedule reads the workflow calendar after saving', async ({
  database,
}) => {
  const service = new OfficeWorkflowParameterService(database);
  await service.save(
    'dataRequests',
    { holidays: [{ date: '2026-10-19', kind: 'holiday', name: 'Closed' }] },
    0,
  );
  const calendar = await new OfficeStore(database).calendar();
  expect(calendar.isWorkday('2026-10-19')).toBe(false);
  expect(calendar.isWorkday('2026-10-20')).toBe(true);
  expect((await service.read('dataRequests')).values.holidays).toEqual([
    { date: '2026-10-19', kind: 'holiday', name: 'Closed' },
  ]);
});
describeMigration('202610160004_office_flows_workflow_parameters', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('officeFlowsWorkflowParameters').toHaveField(
      'values',
      { nullable: false },
    );
    await expectCollection('officeFlowsWorkflowParameters').toHaveField(
      'revision',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('officeFlowsWorkflowParameters').not.toExist();
  },
});
