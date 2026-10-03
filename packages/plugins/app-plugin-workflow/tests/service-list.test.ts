import type { DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/db-testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowRepository } from '../server/repositories/workflow-repository.js';
import { WorkflowRunRepository } from '../server/repositories/workflow-run-repository.js';
import type { WorkflowServiceApi } from '../server/service.js';
import type { WorkflowDistArtifact } from '../server/loader/index.js';
import { asId, asIdFilter, serializeJson } from '../server/engine/utils.js';
import {
  createWorkflowTestDatabase,
  createTestWorkflow,
  insertTestRun,
  testStore,
} from './helpers.js';
import { parseWorkflowIdentifier } from '../server/repositories/mappers.js';

describe('workflow repositories', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let workflows: WorkflowRepository;
  let workflowRuns: WorkflowRunRepository;

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    const service: WorkflowServiceApi = {
      trigger: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized: async () => undefined,
    };
    workflows = new WorkflowRepository(database, service);
    workflowRuns = new WorkflowRunRepository(database, service);
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('filters and paginates workflows in the database query', async () => {
    await createTestWorkflow(database, {
      key: 'leave-approval',
      enabled: true,
      nodes: [],
    });
    await createTestWorkflow(database, {
      key: 'expense-approval',
      enabled: false,
      nodes: [],
    });

    const page = await workflows.list({
      query: 'approval',
      enabled: false,
      page: 1,
      pageSize: 1,
    });

    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(page.data.map((item) => item.key)).toEqual(['expense-approval']);
  });

  it('searches workflows regardless of case on every database', async () => {
    await createTestWorkflow(database, {
      key: 'leave-approval',
      nodes: [],
    });

    const page = await workflows.list({ query: 'APPROVAL' });

    expect(page.data.map((item) => item.key)).toEqual(['leave-approval']);
  });

  it('loads run summaries only for the requested workflow page', async () => {
    const older = await createTestWorkflow(database, {
      key: 'older-workflow',
      nodes: [],
    });
    const newer = await createTestWorkflow(database, {
      key: 'newer-workflow',
      nodes: [],
    });
    await insertTestRun(database, {
      workflowId: older.id,
      workflowKey: older.key,
      eventKey: 'older-active',
      status: 0,
    });
    await insertTestRun(database, {
      workflowId: newer.id,
      workflowKey: newer.key,
      eventKey: 'newer-completed',
      status: 1,
    });
    await insertTestRun(database, {
      workflowId: newer.id,
      workflowKey: newer.key,
      eventKey: 'newer-active',
      status: null,
    });

    const page = await workflows.list({ page: 1, pageSize: 1 });

    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(page.data).toEqual([
      expect.objectContaining({
        key: 'newer-workflow',
        activeRunCount: 1,
        latestRun: expect.objectContaining({ status: null }),
      }),
    ]);
  });

  it('loads detail execution counts from workflow stats without run details', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'detail-stats',
      nodes: [],
    });
    await testStore(database).stats.createOne({
      values: { key: workflow.key, executed: 7 },
    });
    await insertTestRun(database, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'latest-run',
      status: 1,
    });

    await expect(workflows.get(workflow.id)).resolves.toMatchObject({
      executed: 7,
      latestRun: null,
    });
  });

  it('classifies workflow ids and Artifact hashes before repository queries', async () => {
    const hash = 'A'.repeat(64);
    expect(parseWorkflowIdentifier('42')).toEqual({ kind: 'id', value: '42' });
    expect(parseWorkflowIdentifier(hash)).toEqual({
      kind: 'hash',
      value: hash.toLowerCase(),
    });
    expect(parseWorkflowIdentifier('1'.repeat(64))).toEqual({
      kind: 'hash',
      value: '1'.repeat(64),
    });

    const ensureArtifactMaterialized = vi.fn(async () => undefined);
    const repository = new WorkflowRepository(database, {
      trigger: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      refreshSourceResolvers: async (): Promise<void> => undefined,
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized,
    });

    for (const identifier of [
      'artifact-hash',
      '0',
      '-1',
      '1.5',
      '9223372036854775808',
      'g'.repeat(64),
    ]) {
      await expect(repository.enable(identifier)).rejects.toThrow(
        /positive integer id or a 64-character hexadecimal Artifact hash/,
      );
    }
    expect(ensureArtifactMaterialized).not.toHaveBeenCalled();

    await expect(repository.enable('42')).rejects.toThrow(
      /Workflow id or hash 42 was not found/,
    );
    expect(ensureArtifactMaterialized).not.toHaveBeenCalled();

    await expect(repository.enable(hash)).rejects.toThrow(
      new RegExp(`Workflow id or hash ${hash} was not found`),
    );
    expect(ensureArtifactMaterialized).toHaveBeenCalledExactlyOnceWith(
      hash.toLowerCase(),
    );
  });

  it('paginates matching undeployed artifacts after database workflows', async () => {
    await createTestWorkflow(database, { key: 'database-workflow', nodes: [] });
    const artifacts: WorkflowDistArtifact[] = [
      createArtifact('artifact-one'),
      createArtifact('artifact-two'),
    ];
    const service: WorkflowServiceApi = {
      trigger: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      discoverArtifacts: async () => artifacts,
      ensureArtifactMaterialized: async () => undefined,
    };
    workflows = new WorkflowRepository(database, service);

    const page = await workflows.list({ page: 2, pageSize: 1 });

    expect(page).toMatchObject({ page: 2, pageSize: 1, total: 3 });
    expect(page.data.map((item) => item.key)).toEqual(['artifact-one']);
  });

  it('keeps the current revision visible when a newer Artifact is deployed', async () => {
    const current = await createTestWorkflow(database, {
      key: 'deployed-update',
      enabled: true,
      nodes: [],
    });
    const currentHash = '1'.repeat(64);
    const pending = createArtifact('deployed-update');
    pending.workflow.title = 'Pending title';
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(current.id) },
      values: {
        title: 'Current title',
        version: 'version-1',
        hash: currentHash,
      },
    });
    const service: WorkflowServiceApi = {
      trigger: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      discoverArtifacts: async () => [pending],
      ensureArtifactMaterialized: async () => undefined,
    };
    workflows = new WorkflowRepository(database, service);

    await expect(workflows.list({ enabled: true })).resolves.toMatchObject({
      total: 1,
      data: [
        {
          id: String(current.id),
          key: 'deployed-update',
          title: 'Current title',
          version: 'version-1',
          hash: currentHash,
          current: true,
          enabled: true,
          pendingArtifact: {
            hash: pending.digest,
            title: 'Pending title',
          },
        },
      ],
    });
    await expect(workflows.list({ enabled: false })).resolves.toMatchObject({
      total: 0,
      data: [],
    });
    await expect(workflows.get(current.id)).resolves.toMatchObject({
      id: String(current.id),
      hash: currentHash,
      current: true,
      enabled: true,
      pendingArtifact: { hash: pending.digest, title: 'Pending title' },
    });
  });

  it('offers a deployed Artifact as a revision before anything materializes it', async () => {
    const current = await createTestWorkflow(database, {
      key: 'deployed-update',
      enabled: true,
      nodes: [],
    });
    const currentHash = '1'.repeat(64);
    const pending = {
      ...createArtifact('deployed-update'),
      digest: '2'.repeat(64),
    };
    pending.workflow.title = 'Pending title';
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(current.id) },
      values: {
        title: 'Current title',
        version: 'version-1',
        hash: currentHash,
      },
    });
    await testStore(database).stats.createOne({
      values: { key: 'deployed-update', executed: 4 },
    });
    const materialize = vi.fn(async () => undefined);
    const service: WorkflowServiceApi = {
      trigger: async () => ({ status: 'accepted', eventKey: 'test-event' }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      discoverArtifacts: async () => [pending],
      ensureArtifactMaterialized: materialize,
    };
    workflows = new WorkflowRepository(database, service);

    await expect(workflows.revisions(current.id)).resolves.toMatchObject([
      {
        id: null,
        key: 'deployed-update',
        title: 'Pending title',
        hash: pending.digest,
        version: null,
        current: null,
        enabled: false,
        executed: 4,
      },
      {
        id: String(current.id),
        hash: currentHash,
        version: 'version-1',
        current: true,
        enabled: true,
        executed: 4,
      },
    ]);
    // Reading the candidate revision must not turn it into a row, because
    // materializing it is what enabling it does.
    expect(materialize).not.toHaveBeenCalled();
    await expect(
      testStore(database).workflows.count({
        filter: { key: 'deployed-update' },
      }),
    ).resolves.toBe(1);
    await expect(workflows.get(pending.digest)).resolves.toMatchObject({
      id: null,
      hash: pending.digest,
      version: null,
      executed: 4,
    });
  });

  it('lists a materialized Artifact once', async () => {
    const current = await createTestWorkflow(database, {
      key: 'materialized-update',
      enabled: true,
      nodes: [],
    });
    const pending = {
      ...createArtifact('materialized-update'),
      digest: '3'.repeat(64),
    };
    const materializedRevision = await testStore(database).workflows.createOne({
      values: {
        key: 'materialized-update',
        hash: pending.digest,
        version: 'version-2',
        enabled: false,
        current: null,
        inputSchema: serializeJson({ type: 'object' }),
        parametersSchema: serializeJson({}),
        parameterValues: serializeJson({}),
        options: serializeJson({}),
      },
      select: (select) => select.fields('id'),
    });
    const service: WorkflowServiceApi = {
      trigger: async () => ({ status: 'accepted', eventKey: 'test-event' }),
      triggerRevision: async () => ({
        status: 'accepted',
        eventKey: 'test-event',
      }),
      discoverArtifacts: async () => [pending],
      ensureArtifactMaterialized: async () => undefined,
    };
    workflows = new WorkflowRepository(database, service);

    const revisions = await workflows.revisions(current.id);
    expect(revisions.map((revision) => revision.id)).toEqual([
      String(materializedRevision.record.id),
      String(current.id),
    ]);
  });

  it('filters executions before applying pagination', async () => {
    const leave = await createTestWorkflow(database, {
      key: 'leave-approval',
      nodes: [],
    });
    const expense = await createTestWorkflow(database, {
      key: 'expense-report',
      nodes: [],
    });
    await insertTestRun(database, {
      workflowId: leave.id,
      workflowKey: leave.key,
      eventKey: 'leave-failed',
      status: -1,
    });
    await insertTestRun(database, {
      workflowId: leave.id,
      workflowKey: leave.key,
      eventKey: 'leave-resolved',
      status: 1,
    });
    await insertTestRun(database, {
      workflowId: expense.id,
      workflowKey: expense.key,
      eventKey: 'expense-failed',
      status: -1,
    });

    const page = await workflowRuns.list({
      workflowTitle: 'leave',
      status: -1,
      page: 1,
      pageSize: 1,
    });

    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(page.data.map((item) => item.eventKey)).toEqual(['leave-failed']);
  });

  it('loads the materialized workflow title and version with run details', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'versioned-run',
      nodes: [],
    });
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(workflow.id) },
      values: { title: 'Versioned run', version: 'version-3' },
    });
    const run = await insertTestRun(database, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'versioned-run-detail',
      status: 1,
    });

    await expect(workflowRuns.get(run)).resolves.toMatchObject({
      workflowTitle: 'Versioned run',
      workflowVersion: 'version-3',
    });
  });

  it('keeps enabled exclusive to the current revision', async () => {
    const first = await createTestWorkflow(database, {
      key: 'versioned',
      enabled: true,
      nodes: [],
    });
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(first.id) },
      values: { current: null },
    });
    const second = await testStore(database).workflows.createOne({
      values: {
        key: 'versioned',
        title: 'versioned v2',
        enabled: false,
        current: true,
        inputSchema: serializeJson({ type: 'object' }),
        parametersSchema: serializeJson({}),
        parameterValues: serializeJson({}),
        options: serializeJson({}),
      },
      select: (select) => select.fields('id'),
    });

    await workflows.setStatus(asId(second.record.id), true);

    const revisions = await testStore(database).workflows.findMany({
      filter: { key: 'versioned' },
      select: (select) => select.fields('id', 'current', 'enabled'),
      sort: (sort) => sort.field('id').asc(),
    });
    expect(revisions).toEqual([
      expect.objectContaining({
        id: first.id,
        current: null,
        enabled: false,
      }),
      expect.objectContaining({
        id: second.record.id,
        current: true,
        enabled: true,
      }),
    ]);
  });
});

function createArtifact(key: string): WorkflowDistArtifact {
  return {
    key,
    digest: key.padEnd(64, '0'),
    directory: `/tmp/${key}`,
    workflow: {
      formatVersion: 1,
      key,
      inputSchema: { type: 'object' },
      parameters: {},
      nodes: [],
    },
  };
}
