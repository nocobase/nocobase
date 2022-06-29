import { Transaction, Transactionable } from 'sequelize';
import parse from 'json-templates';

import { Model } from "@nocobase/database";

import Plugin from '.';
import ExecutionModel from './models/Execution';
import JobModel from './models/Job';
import FlowNodeModel from './models/FlowNode';
import calculators from './calculators';
import { EXECUTION_STATUS, JOB_STATUS } from './constants';



export interface ProcessorOptions extends Transactionable {
  plugin: Plugin
}



export default class Processor {
  static StatusMap = {
    [JOB_STATUS.PENDING]: EXECUTION_STATUS.STARTED,
    [JOB_STATUS.RESOLVED]: EXECUTION_STATUS.RESOLVED,
    [JOB_STATUS.REJECTED]: EXECUTION_STATUS.REJECTED,
    [JOB_STATUS.CANCELLED]: EXECUTION_STATUS.CANCELLED,
  };

  transaction: Transaction;

  nodes: FlowNodeModel[] = [];
  nodesMap = new Map<number, FlowNodeModel>();
  jobsMap = new Map<number, JobModel>();
  jobsMapByNodeId: { [key: number]: any } = {};

  constructor(public execution: ExecutionModel, private options: ProcessorOptions) {
  }

  // make dual linked nodes list then cache
  private makeNodes(nodes = []) {
    this.nodes = nodes;

    nodes.forEach((node) => {
      this.nodesMap.set(node.id, node);
    });

    nodes.forEach((node) => {
      if (node.upstreamId) {
        node.upstream = this.nodesMap.get(node.upstreamId);
      }

      if (node.downstreamId) {
        node.downstream = this.nodesMap.get(node.downstreamId);
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

    const { sequelize } = (<typeof ExecutionModel>this.execution.constructor).database;

    // @ts-ignore
    const transaction = options.transaction && !options.transaction.finished
      ? options.transaction
      : await sequelize.transaction();

    // @ts-ignore
    if (this.execution.transaction !== transaction.id) {

    // @ts-ignore
      await this.execution.update({ transaction: transaction.id }, { transaction });
    }
    return transaction;
  }

  async prepare(commit?: boolean) {
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

    if (commit) {
      await this.commit();
    }
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
      // for uncaught error, set to rejected
      job = {
        result: err instanceof Error
          ? { message: err.message, stack: process.env.NODE_ENV === 'production' ? [] : err.stack }
          : err,
        status: JOB_STATUS.REJECTED,
      };
      // if previous job is from resuming
      if (prevJob && prevJob.nodeId === node.id) {
        prevJob.set(job);
        job = prevJob;
      }
    }

    let savedJob;
    // TODO(optimize): many checking of resuming or new could be improved
    // could be implemented separately in exec() / resume()
    if (job instanceof Model) {
      savedJob = (await job.save({ transaction: this.transaction })) as unknown as JobModel;
    } else {
      const upstreamId = prevJob instanceof Model ? prevJob.get('id') : null;
      savedJob = await this.saveJob({
        nodeId: node.id,
        upstreamId,
        ...job,
      });
    }

    if (savedJob.status === JOB_STATUS.RESOLVED && node.downstream) {
      // run next node
      return this.run(node.downstream, savedJob);
    }

    // all nodes in scope have been executed
    return this.end(node, savedJob);
  }

  public async run(node, input?) {
    const { instructions } = this.options.plugin;
    const { run } = instructions.get(node.type);
    if (typeof run !== 'function') {
      return Promise.reject(new Error('`run` should be implemented for customized execution of the node'));
    }

    return this.exec(run, node, input);
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
    const { resume } = instructions.get(node.type);
    if (typeof resume !== 'function') {
      return Promise.reject(new Error('`resume` should be implemented'));
    }

    return this.exec(resume, node, job);
  }

  async exit(job: JobModel | null) {
    const status = job ? (<typeof Processor>this.constructor).StatusMap[job.status] : EXECUTION_STATUS.RESOLVED;
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
      .sort((a, b) => a.branchIndex - b.branchIndex);
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
    for (let j = job; j; j = this.jobsMap.get(j.upstreamId)) {
      if (j.nodeId === node.id) {
        return j;
      }
    }
    return null;
  }

  public getParsedValue(value, node?) {
    const injectedFns = {};
    const scope = {
      execution: this.execution,
      node
    };
    for (let [name, fn] of calculators.getEntities()) {
      injectedFns[name] = fn.bind(scope);
    }

    return parse(value)({
      $context: this.execution.context,
      $jobsMapByNodeId: this.jobsMapByNodeId,
      $fn: injectedFns
    });
  }
}
