/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fn, col } from 'sequelize';
import { Model, Transaction, Transactionable } from '@nocobase/database';
import { appendArrayColumn } from '@nocobase/evaluators';
import { Logger } from '@nocobase/logger';
import { parse } from '@nocobase/utils';
import set from 'lodash/set';
import type Plugin from './Plugin';
import { EXECUTION_REASON, EXECUTION_STATUS, JOB_STATUS } from './constants';
import { IJob, InstructionResult, Runner } from './instructions';
import type { ExecutionModel, FlowNodeModel, JobModel, WorkflowModel } from './types';
import { isWorkflowTimeoutError, WorkflowTimeoutError } from './timeout-errors';

export type ProcessorRunOptions = {
  rerun?: true;
  signal?: AbortSignal;
};

export type ProcessorRerunOptions = {
  nodeId?: string | number;
  overwrite?: boolean;
};

type RerunContext = {
  overwrite: boolean;
  targetJob?: JobModel;
};

export interface ProcessorOptions extends Transactionable {
  plugin: Plugin;
  [key: string]: any;
}

export type BackgroundAbortHandle = {
  signal: AbortSignal;
  dispose: () => void;
  throwIfAborted: () => void;
};

export default class Processor {
  static StatusMap = {
    [JOB_STATUS.PENDING]: EXECUTION_STATUS.STARTED,
    [JOB_STATUS.RESOLVED]: EXECUTION_STATUS.RESOLVED,
    [JOB_STATUS.FAILED]: EXECUTION_STATUS.FAILED,
    [JOB_STATUS.ERROR]: EXECUTION_STATUS.ERROR,
    [JOB_STATUS.ABORTED]: EXECUTION_STATUS.ABORTED,
    [JOB_STATUS.CANCELED]: EXECUTION_STATUS.CANCELED,
    [JOB_STATUS.REJECTED]: EXECUTION_STATUS.REJECTED,
    [JOB_STATUS.RETRY_NEEDED]: EXECUTION_STATUS.RETRY_NEEDED,
  };

  logger: Logger;

  /**
   * @experimental
   */
  transaction?: Transaction | null = null;

  /**
   * @experimental
   */
  nodes: FlowNodeModel[] = [];

  /**
   * @experimental
   */
  nodesMap = new Map<number | string, FlowNodeModel>();

  private jobsMapByNodeKey: { [key: string]: JobModel } = {};
  private jobResultsMapByNodeKey: { [key: string]: any } = {};
  private jobsToSave: Map<string, JobModel> = new Map();
  private rerunContext: RerunContext | null = null;

  /**
   * @experimental
   */
  lastSavedJob: JobModel | null = null;
  abortController = new AbortController();
  timeoutGuard: NodeJS.Timeout | null = null;
  private runningRegistered = false;
  private abortReason: string | null = null;
  private aborted = false;

  constructor(
    public execution: ExecutionModel,
    public options: ProcessorOptions,
  ) {
    this.logger = options.plugin.getLogger(execution.workflowId);
    this.transaction = options.transaction;
  }

  get abortSignal() {
    return this.abortController.signal;
  }

  setTimeoutGuard(ms: number) {
    if (this.timeoutGuard) {
      clearTimeout(this.timeoutGuard);
    }
    this.timeoutGuard = setTimeout(() => {
      this.abortExecution(EXECUTION_REASON.TIMEOUT);
    }, ms);
  }

  abortExecution(reason?: string) {
    this.aborted = true;
    this.abortReason = reason ?? null;
    if (!this.abortController.signal.aborted) {
      this.abortController.abort(
        reason === EXECUTION_REASON.TIMEOUT
          ? new WorkflowTimeoutError('Workflow execution has been aborted')
          : new Error('Workflow execution has been aborted'),
      );
    }
  }

  isTimeoutAborted() {
    return this.abortSignal.aborted;
  }

  /**
   * Create an independent abort handle for background work that outlives this processor's
   * run loop (e.g. fire-and-forget instructions that resume the job later). It mirrors the
   * current abort state and sets its own timer based on the execution's `expiresAt`, so the
   * timeout still applies after the processor has exited its synchronous run.
   *
   * The caller must invoke `dispose()` once the background work settles to release the timer
   * and the abort listener.
   */
  createBackgroundAbortHandle(): BackgroundAbortHandle {
    const controller = new AbortController();
    const sourceSignal = this.abortSignal;
    let timeoutGuard: NodeJS.Timeout | null = null;
    let sourceListener: (() => void) | null = null;

    const abort = (reason?: any) => {
      if (!controller.signal.aborted) {
        controller.abort(isWorkflowTimeoutError(reason) ? reason : new WorkflowTimeoutError());
      }
    };

    if (sourceSignal.aborted) {
      abort(sourceSignal.reason);
    } else {
      sourceListener = () => abort(sourceSignal.reason);
      sourceSignal.addEventListener('abort', sourceListener, { once: true });
    }

    const remaining = this.execution.expiresAt ? this.execution.expiresAt.getTime() - Date.now() : null;
    if (remaining != null) {
      if (remaining <= 0) {
        abort();
      } else {
        timeoutGuard = setTimeout(abort, remaining);
      }
    }

    return {
      signal: controller.signal,
      dispose: () => {
        if (timeoutGuard) {
          clearTimeout(timeoutGuard);
          timeoutGuard = null;
        }
        if (sourceListener) {
          sourceSignal.removeEventListener('abort', sourceListener);
          sourceListener = null;
        }
      },
      throwIfAborted: () => {
        if (controller.signal.aborted) {
          throw controller.signal.reason ?? new WorkflowTimeoutError();
        }
      },
    };
  }

  /**
   * Reload a job and return it only when it is still pending, otherwise `null`. Background
   * work uses this before resuming so it never overwrites a job that another path (timeout
   * abort, a competing resume) has already settled.
   */
  async findPendingJob(jobId: number | string): Promise<JobModel | null> {
    const job = await this.options.plugin.db.getRepository('jobs').findOne({
      filterByTk: jobId,
    });
    return job?.status === JOB_STATUS.PENDING ? job : null;
  }

  // make dual linked nodes list then cache
  private makeNodes(nodes: FlowNodeModel[] = []) {
    this.nodes = nodes;

    nodes.forEach((node) => {
      this.nodesMap.set(node.id, node);
    });

    nodes.forEach((node) => {
      if (node.upstreamId) {
        node.upstream = this.nodesMap.get(node.upstreamId) as FlowNodeModel;
      }

      if (node.downstreamId) {
        node.downstream = this.nodesMap.get(node.downstreamId) as FlowNodeModel;
      }
    });
  }

  private makeJobs(jobs: Array<JobModel>) {
    for (const job of jobs) {
      const node = this.nodesMap.get(job.nodeId);
      if (!node) {
        this.logger.warn(`node (#${job.nodeId}) not found for job (#${job.id}), this will lead to unexpected error`);
        continue;
      }
      this.jobsMapByNodeKey[node.key] = job;
      this.jobResultsMapByNodeKey[node.key] = job.result;
    }
  }

  public async prepare() {
    const {
      execution,
      options: { plugin },
    } = this;

    if (!execution.workflow) {
      execution.workflow = plugin.enabledCache.get(execution.workflowId) || (await execution.getWorkflow());
    }
    if (!execution.workflow) {
      throw new Error(`workflow (#${execution.workflowId}) not found for execution (#${execution.id})`);
    }

    const nodes = execution.workflow.nodes || (await execution.workflow.getNodes());
    execution.workflow.nodes = nodes;

    this.makeNodes(nodes);

    const JobDBModel = plugin.db.getModel('jobs');
    const jobIds = await JobDBModel.findAll({
      attributes: ['executionId', 'nodeId', [fn('MAX', col('id')), 'id']],
      group: ['executionId', 'nodeId'],
      where: {
        executionId: execution.id,
      },
      raw: true,
    });
    const jobs = await execution.getJobs({
      where: {
        id: jobIds.map((item) => item.id),
      },
      order: [['id', 'ASC']],
    });

    execution.jobs = jobs;

    this.makeJobs(jobs);
  }

  public async start() {
    const { execution } = this;
    if (!(await this.shouldContinueExecution())) {
      this.logger.warn(`execution was ended with status ${execution.status} before, could not be started again`, {
        workflowId: execution.workflowId,
      });
      return;
    }
    this.enterRunningState();
    try {
      await this.prepare();
      if (this.nodes.length) {
        const head = this.nodes.find((item) => !item.upstream);
        if (!head) {
          this.logger.warn(`head node not found for workflow (${execution.workflowId}), could not be started`, {
            workflowId: execution.workflowId,
          });
          return this.exit(JOB_STATUS.ERROR);
        }
        await this.run(head);
      } else {
        await this.exit(JOB_STATUS.RESOLVED);
      }
    } finally {
      this.leaveRunningState();
    }
  }

  public async resume(job: JobModel) {
    const { execution } = this;
    if (!(await this.shouldContinueExecution())) {
      this.logger.warn(`execution was ended with status ${execution.status} before, could not be resumed`, {
        workflowId: execution.workflowId,
      });
      return;
    }
    this.enterRunningState();
    try {
      await this.prepare();
      const node: FlowNodeModel = this.nodesMap.get(job.nodeId) as FlowNodeModel;
      await this.recall(node, job);
    } finally {
      this.leaveRunningState();
    }
  }

  private resolveRerun(options: ProcessorRerunOptions = {}) {
    const node = this.getRerunNode(options.nodeId);
    const targetJob = this.jobsMapByNodeKey[node.key];

    if (options.nodeId != null && !targetJob) {
      throw new Error(`job of node (#${node.id}) not found in execution (#${this.execution.id})`);
    }

    if (options.nodeId == null && options.overwrite && !targetJob) {
      throw new Error(`job of head node (#${node.id}) not found in execution (#${this.execution.id})`);
    }

    const input = this.getRerunInput(node);
    return { node, input, targetJob };
  }

  public async rerun(options: ProcessorRerunOptions = {}) {
    const { execution } = this;
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution (#${execution.id}) is not started`);
    }
    if (!(await this.shouldContinueExecution())) {
      this.logger.warn(`execution was ended with status ${execution.status} before, could not be rerun`, {
        workflowId: execution.workflowId,
      });
      return;
    }

    this.enterRunningState();
    try {
      await this.prepare();
      const { node, input, targetJob } = this.resolveRerun(options);
      this.rerunContext = {
        overwrite: options.overwrite === true,
        targetJob,
      };

      return await this.run(node, input, { rerun: true });
    } finally {
      this.rerunContext = null;
      this.leaveRunningState();
    }
  }

  private getRerunNode(nodeId?: string | number) {
    if (nodeId != null) {
      const node = this.nodesMap.get(nodeId) || this.nodes.find((item) => String(item.id) === String(nodeId));
      if (!node) {
        throw new Error(`node (#${nodeId}) not found in workflow (#${this.execution.workflowId})`);
      }
      return node;
    }

    const head = this.nodes.find((item) => !item.upstream);
    if (!head) {
      throw new Error(`head node not found in workflow (#${this.execution.workflowId})`);
    }
    return head;
  }

  private getRerunInput(node: FlowNodeModel) {
    if (!node.upstream) {
      return { result: this.execution.context };
    }

    const upstreamJob = this.jobsMapByNodeKey[node.upstream.key];
    if (!upstreamJob) {
      throw new Error(`upstream job of node (#${node.id}) not found in execution (#${this.execution.id})`);
    }

    return upstreamJob;
  }

  private async exec(
    instruction: Runner,
    node: FlowNodeModel,
    prevJob?: JobModel | { result: unknown },
    options: ProcessorRunOptions = {},
  ): Promise<any> {
    let job: InstructionResult;
    if (!(await this.shouldContinueExecution())) {
      return this.exit();
    }
    try {
      // call instruction to get result and status
      this.logger.debug(`config of node`, { data: node.config, workflowId: node.workflowId });
      job = await instruction(node, prevJob, this, { ...options, signal: this.abortSignal });
      if (job === null) {
        return this.exit();
      }
      if (!job) {
        return this.exit(true);
      }
    } catch (err: any) {
      if (isWorkflowTimeoutError(err) || (this.abortSignal.aborted && this.aborted)) {
        job = {
          result: {
            message: err.message,
          },
          status: JOB_STATUS.ABORTED,
        };
      } else {
        // for uncaught error, set to error
        this.logger.error(
          `execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id}) failed: `,
          { error: err, workflowId: node.workflowId },
        );
        job = {
          result:
            err instanceof Error
              ? {
                  ...err,
                  message: err.message,
                }
              : err,
          status: JOB_STATUS.ERROR,
        };
      }
      // if previous job is from resuming
      if (prevJob instanceof Model && (prevJob as JobModel).nodeId === node.id) {
        (prevJob as JobModel).set(job);
        job = prevJob as JobModel;
      }
    }

    if (!(job instanceof Model)) {
      // job.upstreamId = prevJob instanceof Model ? prevJob.get('id') : null;
      job.nodeId = node.id;
      job.nodeKey = node.key;
    }
    const savedJob = this.saveJob(job);

    this.logger.info(
      `execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id}) finished as status: ${savedJob.status}`,
      {
        workflowId: node.workflowId,
      },
    );
    this.logger.debug(`result of node`, { data: savedJob.result });

    if (this.execution.status === EXECUTION_STATUS.ABORTED || this.isTimeoutAborted()) {
      return this.exit(JOB_STATUS.ABORTED);
    }

    if (savedJob.status === JOB_STATUS.RESOLVED && node.downstream) {
      // run next node
      this.logger.debug(`run next node (${node.downstreamId})`);
      return this.run(node.downstream, savedJob);
    }

    // all nodes in scope have been executed
    return this.end(node, savedJob);
  }

  public async run(node: FlowNodeModel, input?: JobModel | { result: unknown }, options?: ProcessorRunOptions) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (!instruction) {
      return Promise.reject(new Error(`instruction [${node.type}] not found for node (#${node.id})`));
    }
    if (typeof instruction.run !== 'function') {
      return Promise.reject(new Error('`run` should be implemented for customized execution of the node'));
    }

    this.logger.info(`execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id})`, {
      workflowId: node.workflowId,
    });
    return this.exec(instruction.run.bind(instruction), node, input, options);
  }

  // parent node should take over the control
  public async end(node: FlowNodeModel, job: JobModel) {
    this.logger.debug(`branch ended at node (${node.id})`);
    const parentNode = this.findBranchParentNode(node);
    // no parent, means on main flow
    if (parentNode) {
      this.logger.debug(`not on main, recall to parent entry node (${node.id})})`, {
        workflowId: node.workflowId,
      });
      await this.recall(parentNode, job);
      return null;
    }

    // really done for all nodes
    // * should mark execution as done with last job status
    return this.exit(job.status);
  }

  private async recall(node: FlowNodeModel, job: JobModel) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (!instruction) {
      return Promise.reject(new Error(`instruction [${node.type}] not found for node (#${node.id})`));
    }
    if (typeof instruction.resume !== 'function') {
      return Promise.reject(
        new Error(`"resume" method should be implemented for [${node.type}] instruction of node (#${node.id})`),
      );
    }

    this.logger.info(`execution (${this.execution.id}) resume instruction [${node.type}] for node (${node.id})`, {
      workflowId: node.workflowId,
    });
    return this.exec(instruction.resume.bind(instruction), node, job);
  }

  public async exit(s?: number | true) {
    this.leaveRunningState();
    if (s === true) {
      return;
    }

    if (this.jobsToSave.size) {
      const newJobs = [];
      for (const job of this.jobsToSave.values()) {
        if (job.isNewRecord) {
          newJobs.push(job);
        } else {
          const JobCollection = this.options.plugin.db.getCollection('jobs');
          const changes = [];
          if (job.changed('status')) {
            changes.push([`status`, job.status]);
            job.changed('status', false);
          }
          if (job.changed('meta')) {
            changes.push([`meta`, JSON.stringify(job.meta ?? null)]);
            job.changed('meta', false);
          }
          if (job.changed('result')) {
            changes.push([`result`, JSON.stringify(job.result ?? null)]);
            job.changed('result', false);
          }
          if (changes.length) {
            await this.options.plugin.db.sequelize.query(
              `UPDATE ${JobCollection.quotedTableName()} SET ${changes.map(([key]) => `${key} = ?`)} WHERE id='${
                job.id
              }'`,
              { replacements: changes.map(([, value]) => value) },
            );
          }
          // await job.save();
        }
      }
      if (newJobs.length) {
        const JobsModel = this.options.plugin.db.getModel('jobs');
        await JobsModel.bulkCreate(
          newJobs.map((job) => job.toJSON()),
          {
            returning: false,
          },
        );
        for (const job of newJobs) {
          job.isNewRecord = false;
        }
      }
      this.jobsToSave.clear();
    }
    if (typeof s === 'number') {
      const status =
        (<typeof Processor>this.constructor).StatusMap[s as keyof typeof Processor.StatusMap] ?? Math.sign(s);
      const values: { status: number; reason?: string } = { status };
      if (status === EXECUTION_STATUS.ABORTED && this.abortReason) {
        values.reason = this.abortReason;
      }
      const ExecutionModelClass = this.options.plugin.db.getModel('executions');
      const [affected] = await ExecutionModelClass.update(values, {
        where: {
          id: this.execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
      });
      if (affected) {
        this.execution.set(values);
      } else {
        await this.execution.reload();
      }
    }

    if (this.execution.status === EXECUTION_STATUS.STARTED) {
      this.options.plugin.timeoutManager.scheduleExecutionTimeout(this.execution);
    } else {
      this.options.plugin.timeoutManager.clear(this.execution.id);
      this.options.plugin.timeoutManager.invalidateNextExpiresAtIfMatches(this.execution.expiresAt);
    }

    this.logger.info(`execution (${this.execution.id}) exiting with status ${this.execution.status}`, {
      workflowId: this.execution.workflowId,
    });
    return null;
  }

  /**
   * @experimental
   */
  saveJob(payload: JobModel | IJob): JobModel {
    const { database } = <typeof ExecutionModel>this.execution.constructor;
    const model = database.getModel('jobs');
    let job: JobModel;
    if (payload instanceof model) {
      job = payload;
      job.set('updatedAt', new Date());
    } else if (
      this.rerunContext?.overwrite &&
      this.rerunContext.targetJob &&
      this.rerunContext.targetJob.nodeId === payload.nodeId
    ) {
      job = this.rerunContext.targetJob;
      job.set({
        status: payload.status,
        result: Object.prototype.hasOwnProperty.call(payload, 'result') ? payload.result : null,
        meta: Object.prototype.hasOwnProperty.call(payload, 'meta') ? payload.meta : null,
        updatedAt: new Date(),
      });
    } else {
      job = model.build(
        {
          ...payload,
          id: this.options.plugin.snowflake.getUniqueID().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          executionId: this.execution.id,
        },
        {
          isNewRecord: true,
        },
      ) as JobModel;
    }
    this.jobsToSave.set(job.id.toString(), job);

    this.lastSavedJob = job;
    this.jobsMapByNodeKey[job.nodeKey] = job;
    this.jobResultsMapByNodeKey[job.nodeKey] = job.result;
    this.logger.debug(`job added to save list: ${JSON.stringify(job)}`, {
      workflowId: this.execution.workflowId,
    });

    return job;
  }

  /**
   * @experimental
   */
  getBranches(node: FlowNodeModel): FlowNodeModel[] {
    return this.nodes
      .filter((item) => item.upstream === node && item.branchIndex !== null)
      .sort((a, b) => Number(a.branchIndex) - Number(b.branchIndex));
  }

  private enterRunningState() {
    this.options.plugin.timeoutManager.clear(this.execution.id);
    this.abortReason = null;
    this.aborted = false;
    this.options.plugin.registerRunningExecution(this.execution.id, (reason) => this.abortExecution(reason));
    this.runningRegistered = true;

    const remaining = this.execution.expiresAt ? this.execution.expiresAt.getTime() - Date.now() : null;
    if (remaining == null) {
      return;
    }
    if (remaining <= 0) {
      this.abortExecution(EXECUTION_REASON.TIMEOUT);
      return;
    }
    this.setTimeoutGuard(remaining);
  }

  private async shouldContinueExecution() {
    return this.options.plugin.timeoutManager.shouldContinue(this.execution);
  }

  private leaveRunningState() {
    if (this.timeoutGuard) {
      clearTimeout(this.timeoutGuard);
      this.timeoutGuard = null;
    }
    if (!this.runningRegistered) {
      return;
    }
    this.options.plugin.unregisterRunningExecution(this.execution.id);
    this.runningRegistered = false;
  }

  /**
   * @experimental
   * find the first node in current branch
   */
  findBranchStartNode(node: FlowNodeModel, parent?: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.upstream) {
      if (!parent) {
        if (n.branchIndex !== null) {
          return n;
        }
      } else {
        if (n.upstream === parent) {
          return n;
        }
      }
    }
    return null;
  }

  /**
   * @experimental
   * find the node start current branch
   */
  findBranchParentNode(node?: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.upstream) {
      if (n.branchIndex !== null) {
        return n.upstream;
      }
    }
    return null;
  }

  /**
   * @experimental
   */
  findBranchEndNode(node: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.downstream) {
      if (!n.downstream) {
        return n;
      }
    }
    return null;
  }

  /**
   * @experimental
   */
  findBranchParentJob(job: JobModel, node: FlowNodeModel): JobModel | null {
    return this.jobsMapByNodeKey[node.key];
  }

  /**
   * @experimental
   */
  findBranchLastJob(node: FlowNodeModel, job: JobModel): JobModel | null {
    const allJobs = Object.values(this.jobsMapByNodeKey);
    const branchJobs = [];
    for (let n = this.findBranchEndNode(node); n && n !== node.upstream; n = n.upstream) {
      branchJobs.push(...allJobs.filter((item) => item.nodeId === n.id));
    }
    branchJobs.sort((a, b) => a.id - b.id);
    return branchJobs[branchJobs.length - 1] || null;
  }

  /**
   * @experimental
   */
  public getScope(sourceNodeId?: number | string, includeSelfScope = false) {
    const node: FlowNodeModel | undefined = sourceNodeId ? this.nodesMap.get(sourceNodeId) : undefined;
    const systemFns = {};
    const scope = {
      execution: this.execution,
      node,
    };
    for (const [name, fn] of this.options.plugin.functions.getEntities()) {
      set(systemFns, name, fn.bind(scope));
    }

    const $scopes: Record<string, any> = {};
    for (let n = includeSelfScope ? node : this.findBranchParentNode(node); n; n = this.findBranchParentNode(n)) {
      const instruction = this.options.plugin.instructions.get(n.type);
      if (typeof instruction?.getScope === 'function') {
        $scopes[n.id] = $scopes[n.key] = instruction.getScope(n, this.jobResultsMapByNodeKey[n.key], this);
      }
    }

    const scopes = {
      $context: this.execution.context,
      $jobsMapByNodeKey: this.jobResultsMapByNodeKey,
      $system: systemFns,
      $scopes,
      $env: this.options.plugin.app.environment.getVariables(),
    };

    return {
      ...scopes,
      ctx: scopes, // 2.0
    };
  }

  /**
   * @experimental
   */
  public getParsedValue(
    value: any,
    sourceNodeId?: number | string,
    { additionalScope = {}, includeSelfScope = false } = {},
  ) {
    const template = parse(value);
    const scope = Object.assign(this.getScope(sourceNodeId, includeSelfScope), additionalScope);
    template.parameters.forEach(({ key }: { key: string }) => {
      appendArrayColumn(scope, key);
    });
    return template(scope);
  }
}
