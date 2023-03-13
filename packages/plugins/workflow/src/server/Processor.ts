import { Transaction, Transactionable } from 'sequelize';
import parse from 'json-templates';

import { Model } from "@nocobase/database";

import Plugin from '.';
import ExecutionModel from './models/Execution';
import JobModel from './models/Job';
import FlowNodeModel from './models/FlowNode';
import { EXECUTION_STATUS, JOB_STATUS } from './constants';



export interface ProcessorOptions extends Transactionable {
  plugin: Plugin
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
  };

  transaction?: Transaction;

  nodes: FlowNodeModel[] = [];
  nodesMap = new Map<number, FlowNodeModel>();
  jobsMap = new Map<number, JobModel>();
  jobsMapByNodeId: { [key: number]: any } = {};

  constructor(public execution: ExecutionModel, public options: ProcessorOptions) {
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
      this.jobsMap.set(job.id, job);
      // TODO: should consider cycle, and from previous job
      this.jobsMapByNodeId[job.nodeId] = job.result;
    });
  }

  private async getTransaction() {
    if (!this.execution.useTransaction) {
      return;
    }

    const { options } = this;

    // @ts-ignore
    return options.transaction && !options.transaction.finished
      ? options.transaction
      : await options.plugin.db.sequelize.transaction();
  }

  public async prepare() {
    const transaction = await this.getTransaction();
    this.transaction = transaction;

    const { execution } = this;
    if (!execution.workflow) {
      execution.workflow = await execution.getWorkflow({ transaction });
    }

    const nodes = await execution.workflow.getNodes({ transaction });

    this.makeNodes(nodes);

    const jobs = await execution.getJobs({
      order: [['id', 'ASC']],
      transaction,
    });

    this.makeJobs(jobs);
  }

  public async start() {
    const { execution } = this;
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${execution.status}`);
    }
    await this.prepare();
    if (this.nodes.length) {
      const head = this.nodes.find(item => !item.upstream);
      await this.run(head, { result: execution.context });
    } else {
      await this.exit(null);
    }
    await this.commit();
  }

  public async resume(job: JobModel) {
    const { execution } = this;
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${execution.status}`);
    }
    await this.prepare();
    const node = this.nodesMap.get(job.nodeId);
    await this.recall(node, job);
    await this.commit();
  }

  private async commit() {
    // @ts-ignore
    if (this.transaction && (!this.options.transaction || this.options.transaction.finished)) {
      await this.transaction.commit();
    }
  }

  private async exec(instruction: Function, node: FlowNodeModel, prevJob) {
    let job;
    try {
      // call instruction to get result and status
      job = await instruction(node, prevJob, this);
      if (!job) {
        return null;
      }
    } catch (err) {
      // for uncaught error, set to error
      job = {
        result: err instanceof Error
          ? { message: err.message, stack: process.env.NODE_ENV === 'production' ? [] : err.stack }
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
      job.upstreamId = prevJob instanceof Model ? prevJob.get('id') : null;
      job.nodeId = node.id;
    }
    const savedJob = await this.saveJob(job);

    if (savedJob.status === JOB_STATUS.RESOLVED && node.downstream) {
      // run next node
      return this.run(node.downstream, savedJob);
    }

    // all nodes in scope have been executed
    return this.end(node, savedJob);
  }

  public async run(node, input?) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (typeof instruction.run !== 'function') {
      return Promise.reject(new Error('`run` should be implemented for customized execution of the node'));
    }

    return this.exec(instruction.run.bind(instruction), node, input);
  }

  // parent node should take over the control
  public async end(node, job) {
    const parentNode = this.findBranchParentNode(node);
    // no parent, means on main flow
    if (parentNode) {
      await this.recall(parentNode, job);
      return job;
    }

    // really done for all nodes
    // * should mark execution as done with last job status
    return this.exit(job);
  }

  async recall(node, job) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (typeof instruction.resume !== 'function') {
      return Promise.reject(new Error('`resume` should be implemented'));
    }

    return this.exec(instruction.resume.bind(instruction), node, job);
  }

  async exit(job: JobModel | null) {
    const status = job ? (<typeof Processor>this.constructor).StatusMap[job.status] ?? Math.sign(job.status) : EXECUTION_STATUS.RESOLVED;
    await this.execution.update({ status }, { transaction: this.transaction });
    return null;
  }

  // TODO(optimize)
  async saveJob(payload) {
    const { database } = <typeof ExecutionModel>this.execution.constructor;
    const { model } = database.getCollection('jobs');
    let job;
    if (payload instanceof model) {
      job = await payload.save({ transaction: this.transaction });
    } else if (payload.id) {
      [job] = await model.update(payload, {
        where: { id: payload.id },
        returning: true,
        transaction: this.transaction
      });
    } else {
      job = await model.create({
        ...payload,
        executionId: this.execution.id,
      }, {
        transaction: this.transaction
      });
    }
    this.jobsMap.set(job.id, job);
    this.jobsMapByNodeId[job.nodeId] = job.result;

    return job;
  }

  getBranches(node: FlowNodeModel): FlowNodeModel[] {
    return this.nodes
      .filter(item => item.upstream === node && item.branchIndex !== null)
      .sort((a, b) => Number(a.branchIndex) - Number(b.branchIndex));
  }

  // find the first node in current branch
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

  // find the node start current branch
  findBranchParentNode(node: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.upstream) {
      if (n.branchIndex !== null) {
        return n.upstream;
      }
    }
    return null;
  }

  findBranchParentJob(job: JobModel, node: FlowNodeModel): JobModel | null {
    for (let j: JobModel | undefined = job; j; j = this.jobsMap.get(j.upstreamId)) {
      if (j.nodeId === node.id) {
        return j;
      }
    }
    return null;
  }

  public getScope(node?) {
    const systemFns = {};
    const scope = {
      execution: this.execution,
      node
    };
    for (let [name, fn] of this.options.plugin.functions.getEntities()) {
      systemFns[name] = fn.bind(scope);
    }

    return {
      $context: this.execution.context,
      $jobsMapByNodeId: this.jobsMapByNodeId,
      $system: systemFns
    };
  }

  public getParsedValue(value, node?) {
    return parse(value)(this.getScope(node));
  }
}
