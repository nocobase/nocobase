/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transaction, Transactionable } from '@nocobase/database';
import { appendArrayColumn } from '@nocobase/evaluators';
import { Logger } from '@nocobase/logger';
import { parse } from '@nocobase/utils';
import set from 'lodash/set';
import type Plugin from './Plugin';
import { EXECUTION_STATUS, JOB_STATUS } from './constants';
import { Runner } from './instructions';
import type { ExecutionModel, FlowNodeModel, JobModel } from './types';

export interface ProcessorOptions extends Transactionable {
  plugin: Plugin;
  [key: string]: any;
}

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
  transaction: Transaction;

  /**
   * @experimental
   */
  mainTransaction: Transaction;

  /**
   * @experimental
   */
  nodes: FlowNodeModel[] = [];

  /**
   * @experimental
   */
  nodesMap = new Map<number, FlowNodeModel>();

  private jobsMapByNodeKey: { [key: string]: JobModel } = {};
  private jobResultsMapByNodeKey: { [key: string]: any } = {};
  private jobsToSave: Map<string, JobModel> = new Map();

  /**
   * @experimental
   */
  lastSavedJob: JobModel | null = null;

  constructor(
    public execution: ExecutionModel,
    public options: ProcessorOptions,
  ) {
    this.logger = options.plugin.getLogger(execution.workflowId);
    this.transaction = options.transaction;
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
    jobs.forEach((job) => {
      const node = this.nodesMap.get(job.nodeId);
      this.jobsMapByNodeKey[node.key] = job;
      this.jobResultsMapByNodeKey[node.key] = job.result;
    });
  }

  public async prepare() {
    const {
      execution,
      options: { plugin },
    } = this;

    this.mainTransaction = plugin.useDataSourceTransaction('main', this.transaction);

    const transaction = this.mainTransaction;

    if (!execution.workflow) {
      execution.workflow =
        plugin.enabledCache.get(execution.workflowId) || (await execution.getWorkflow({ transaction }));
    }

    const nodes = await execution.workflow.getNodes({ transaction });
    execution.workflow.nodes = nodes;

    this.makeNodes(nodes);

    const jobs = await execution.getJobs({
      order: [['id', 'ASC']],
      transaction,
    });

    execution.jobs = jobs;

    this.makeJobs(jobs);
  }

  public async start() {
    const { execution } = this;
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${execution.status} before, could not be started again`);
    }
    await this.prepare();
    if (this.nodes.length) {
      const head = this.nodes.find((item) => !item.upstream);
      await this.run(head, { result: execution.context });
    } else {
      await this.exit(JOB_STATUS.RESOLVED);
    }
  }

  public async resume(job: JobModel) {
    const { execution } = this;
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${execution.status} before, could not be resumed`);
    }
    await this.prepare();
    const node = this.nodesMap.get(job.nodeId);
    await this.recall(node, job);
  }

  private async exec(instruction: Runner, node: FlowNodeModel, prevJob) {
    let job;
    try {
      // call instruction to get result and status
      this.logger.info(`execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id})`);
      this.logger.debug(`config of node`, { data: node.config });
      job = await instruction(node, prevJob, this);
      if (!job) {
        return this.exit();
      }
    } catch (err) {
      // for uncaught error, set to error
      this.logger.error(
        `execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id}) failed: `,
        err,
      );
      job = {
        result:
          err instanceof Error
            ? {
                message: err.message,
                ...err,
              }
            : err,
        status: JOB_STATUS.ERROR,
      };
      // if previous job is from resuming
      if (prevJob && prevJob.nodeId === node.id) {
        prevJob.set(job);
        job = prevJob;
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
    );
    this.logger.debug(`result of node`, { data: savedJob.result });

    if (savedJob.status === JOB_STATUS.RESOLVED && node.downstream) {
      // run next node
      this.logger.debug(`run next node (${node.downstreamId})`);
      return this.run(node.downstream, savedJob);
    }

    // all nodes in scope have been executed
    return this.end(node, savedJob);
  }

  public async run(node, input?) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (!instruction) {
      return Promise.reject(new Error(`instruction [${node.type}] not found for node (#${node.id})`));
    }
    if (typeof instruction.run !== 'function') {
      return Promise.reject(new Error('`run` should be implemented for customized execution of the node'));
    }

    return this.exec(instruction.run.bind(instruction), node, input);
  }

  // parent node should take over the control
  public async end(node, job: JobModel) {
    this.logger.debug(`branch ended at node (${node.id})`);
    const parentNode = this.findBranchParentNode(node);
    // no parent, means on main flow
    if (parentNode) {
      this.logger.debug(`not on main, recall to parent entry node (${node.id})})`);
      await this.recall(parentNode, job);
      return null;
    }

    // really done for all nodes
    // * should mark execution as done with last job status
    return this.exit(job.status);
  }

  private async recall(node, job) {
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

    return this.exec(instruction.resume.bind(instruction), node, job);
  }

  public async exit(s?: number) {
    if (this.jobsToSave.size) {
      const newJobs = [];
      for (const job of this.jobsToSave.values()) {
        if (job.isNewRecord) {
          newJobs.push(job);
        } else {
          await job.save({ transaction: this.mainTransaction });
        }
      }
      if (newJobs.length) {
        const JobsModel = this.options.plugin.db.getModel('jobs');
        await JobsModel.bulkCreate(
          newJobs.map((job) => job.toJSON()),
          {
            transaction: this.mainTransaction,
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
      const status = (<typeof Processor>this.constructor).StatusMap[s] ?? Math.sign(s);
      await this.execution.update({ status }, { transaction: this.mainTransaction });
    }
    if (this.mainTransaction && this.mainTransaction !== this.transaction) {
      await this.mainTransaction.commit();
    }
    this.logger.info(`execution (${this.execution.id}) exiting with status ${this.execution.status}`);
    return null;
  }

  /**
   * @experimental
   */
  saveJob(payload: JobModel | Record<string, any>): JobModel {
    const { database } = <typeof ExecutionModel>this.execution.constructor;
    const { model } = database.getCollection('jobs');
    let job;
    if (payload instanceof model) {
      job = payload;
      job.set('updatedAt', new Date());
    } else {
      job = model.build({
        ...payload,
        id: this.options.plugin.snowflake.getUniqueID().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        executionId: this.execution.id,
      });
    }
    this.jobsToSave.set(job.id, job);

    this.lastSavedJob = job;
    this.jobsMapByNodeKey[job.nodeKey] = job;
    this.jobResultsMapByNodeKey[job.nodeKey] = job.result;

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
  findBranchParentNode(node: FlowNodeModel): FlowNodeModel | null {
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
    branchJobs.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    return branchJobs[branchJobs.length - 1] || null;
  }

  /**
   * @experimental
   */
  public getScope(sourceNodeId: number, includeSelfScope = false) {
    const node = this.nodesMap.get(sourceNodeId);
    const systemFns = {};
    const scope = {
      execution: this.execution,
      node,
    };
    for (const [name, fn] of this.options.plugin.functions.getEntities()) {
      set(systemFns, name, fn.bind(scope));
    }

    const $scopes = {};
    for (let n = includeSelfScope ? node : this.findBranchParentNode(node); n; n = this.findBranchParentNode(n)) {
      const instruction = this.options.plugin.instructions.get(n.type);
      if (typeof instruction?.getScope === 'function') {
        $scopes[n.id] = $scopes[n.key] = instruction.getScope(n, this.jobResultsMapByNodeKey[n.key], this);
      }
    }

    return {
      $context: this.execution.context,
      $jobsMapByNodeKey: this.jobResultsMapByNodeKey,
      $system: systemFns,
      $scopes,
      $env: this.options.plugin.app.environment.getVariables(),
    };
  }

  /**
   * @experimental
   */
  public getParsedValue(value, sourceNodeId: number, { additionalScope = {}, includeSelfScope = false } = {}) {
    const template = parse(value);
    const scope = Object.assign(this.getScope(sourceNodeId, includeSelfScope), additionalScope);
    template.parameters.forEach(({ key }) => {
      appendArrayColumn(scope, key);
    });
    return template(scope);
  }
}
