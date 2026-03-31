/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import WorkflowPlugin from '../..';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';
import type { ExecutionModel } from '../../types';

describe('workflow > instructions > multi-conditions', () => {
  let app: Application;
  let db: Database;
  let plugin: WorkflowPlugin;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();
    plugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'syncTrigger',
    });
  });

  afterEach(() => app.destroy());

  async function createMultiNode(config) {
    const node = await workflow.createNode({
      type: 'multi-conditions',
      config,
    });
    const tail = await workflow.createNode({
      type: 'echo',
      upstreamId: node.id,
    });
    await node.setDownstream(tail);
    return node;
  }

  async function createBranch(node, branchIndex, options: { type?: string; config?: any } = {}) {
    const { type = 'echo', config } = options;
    return workflow.createNode({
      type,
      upstreamId: node.id,
      branchIndex,
      ...(config ? { config } : {}),
    });
  }

  async function triggerWorkflow() {
    await plugin.trigger(workflow, {});
    const [execution] = await workflow.getExecutions();
    const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
    return { execution, jobs };
  }

  async function waitForExecution(
    execution: ExecutionModel,
    predicate: (execution: ExecutionModel) => boolean,
    timeout = 1000,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await execution.reload();
      if (predicate(execution)) {
        return;
      }
      await sleep(20);
    }
    throw new Error('execution did not reach expected status in time');
  }

  it('executes the first matching branch and resolves', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [1, 1],
          },
        },
        {
          uid: 'c2',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [0, 1],
          },
        },
      ],
    });
    const branch1 = await createBranch(node, 1);
    const branch2 = await createBranch(node, 2);
    const defaultBranch = await createBranch(node, 0);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.RESOLVED);
    expect(nodeJob.result).toBe(true);
    expect(nodeJob.meta).toEqual({ conditions: [true] });

    expect(jobs.some((job) => job.nodeId === branch1.id)).toBe(true);
    expect(jobs.some((job) => job.nodeId === branch2.id)).toBe(false);
    expect(jobs.some((job) => job.nodeId === defaultBranch.id)).toBe(false);
  });

  it('keeps evaluating until a later condition matches', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [0, 1],
          },
        },
        {
          uid: 'c2',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [2, 2],
          },
        },
      ],
    });
    const branch1 = await createBranch(node, 1);
    const branch2 = await createBranch(node, 2);
    const defaultBranch = await createBranch(node, 0);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.result).toBe(true);

    expect(jobs.some((job) => job.nodeId === branch1.id)).toBe(false);
    expect(jobs.some((job) => job.nodeId === branch2.id)).toBe(true);
    expect(jobs.some((job) => job.nodeId === defaultBranch.id)).toBe(false);
  });

  it('runs default branch when no condition matches but continues when configured', async () => {
    const node = await createMultiNode({
      continueOnNoMatch: true,
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [0, 1],
          },
        },
      ],
    });
    const branch1 = await createBranch(node, 1);
    const defaultBranch = await createBranch(node, 0);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.RESOLVED);
    expect(nodeJob.result).toBe(false);

    expect(jobs.some((job) => job.nodeId === branch1.id)).toBe(false);
    expect(jobs.some((job) => job.nodeId === defaultBranch.id)).toBe(true);
  });

  it('marks workflow failed when no branch matches and continueOnNoMatch is false', async () => {
    const node = await createMultiNode({
      continueOnNoMatch: false,
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [0, 1],
          },
        },
      ],
    });
    const branch1 = await createBranch(node, 1);
    const defaultBranch = await createBranch(node, 0);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.FAILED);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.FAILED);
    expect(nodeJob.result).toBe(false);
    expect(jobs.some((job) => job.nodeId === branch1.id)).toBe(false);
    expect(jobs.some((job) => job.nodeId === defaultBranch.id)).toBe(true);
  });

  it('returns error when condition evaluation throws', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'broken',
          engine: 'basic',
          calculation: {
            calculator: 'unknown-calculator',
            operands: [1, 1],
          },
        },
      ],
    });
    const branch1 = await createBranch(node, 1);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.ERROR);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.ERROR);
    expect(typeof nodeJob.result).toBe('string');

    expect(jobs.some((job) => job.nodeId === branch1.id)).toBe(false);
  });

  it('propagates failure when a matched branch fails', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [1, 1],
          },
        },
        {
          uid: 'c2',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [2, 2],
          },
        },
      ],
    });

    const failedBranch = await createBranch(node, 1, {
      type: 'end',
      config: {
        endStatus: JOB_STATUS.FAILED,
      },
    });
    const successBranch = await createBranch(node, 2);
    const defaultBranch = await createBranch(node, 0);

    const { execution, jobs } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.FAILED);

    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob?.status).toBe(JOB_STATUS.RESOLVED);
    expect(nodeJob?.result).toBe(true);

    expect(jobs.find((job) => job.nodeId === failedBranch.id)?.status).toBe(JOB_STATUS.FAILED);
    expect(jobs.some((job) => job.nodeId === successBranch.id)).toBe(false);
    expect(jobs.some((job) => job.nodeId === defaultBranch.id)).toBe(false);
  });

  it('waits for pending branch and resumes once resolved', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [1, 1],
          },
        },
      ],
    });
    const pendingBranch = await createBranch(node, 1, { type: 'pending' });
    await createBranch(node, 0);

    const { execution } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);

    let jobs = await execution.getJobs({ order: [['id', 'ASC']] });
    const pendingJob = jobs.find((job) => job.nodeId === pendingBranch.id);
    expect(pendingJob?.status).toBe(JOB_STATUS.PENDING);

    pendingJob.set({ status: JOB_STATUS.RESOLVED, result: 'done' });
    pendingJob.execution = execution;
    await plugin.resume(pendingJob);
    await waitForExecution(execution, (item) => item.status === EXECUTION_STATUS.RESOLVED);

    jobs = await execution.getJobs({ order: [['id', 'ASC']] });
    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.RESOLVED);
    expect(nodeJob.result).toBe(true);
  });

  it('continues evaluating when a pending branch resumes with failure', async () => {
    const node = await createMultiNode({
      conditions: [
        {
          uid: 'c1',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [1, 1],
          },
        },
        {
          uid: 'c2',
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [2, 2],
          },
        },
      ],
    });

    const pendingBranch = await createBranch(node, 1, { type: 'pending' });
    const successBranch = await createBranch(node, 2);
    await createBranch(node, 0);

    const { execution } = await triggerWorkflow();
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);

    let jobs = await execution.getJobs({ order: [['id', 'ASC']] });
    const pendingJob = jobs.find((job) => job.nodeId === pendingBranch.id);
    expect(pendingJob?.status).toBe(JOB_STATUS.PENDING);

    pendingJob.set({ status: JOB_STATUS.FAILED });
    pendingJob.execution = execution;
    await plugin.resume(pendingJob);
    await waitForExecution(execution, (item) => item.status !== EXECUTION_STATUS.STARTED);

    expect(execution.status).toBe(EXECUTION_STATUS.FAILED);

    jobs = await execution.getJobs({ order: [['id', 'ASC']] });
    const nodeJob = jobs.find((job) => job.nodeId === node.id);
    expect(nodeJob.status).toBe(JOB_STATUS.RESOLVED);
    expect(nodeJob.result).toBe(true);
    expect(jobs.find((job) => job.nodeId === successBranch.id)).toBeUndefined();
  });
});
