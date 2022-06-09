import { Database, Model } from '@nocobase/database';
import parse from 'json-templates';
import { BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, Transaction } from 'sequelize';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import instructions from '../instructions';
import WorkflowModel from './Workflow';
import FlowNodeModel from './FlowNode';
import JobModel from './Job';
import calculators from '../calculators';

export interface ExecutionOptions {
  transaction?: Transaction;
}

export default class ExecutionModel extends Model {
  declare static readonly database: Database;

  declare id: number;
  declare title: string;
  declare context: any;
  declare status: number;
  // NOTE: this duplicated column is for transaction in preparing cycle from workflow
  declare useTransaction: boolean;
  declare transaction: string;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare key: string;

  declare workflow?: WorkflowModel;
  declare getWorkflow: BelongsToGetAssociationMixin<WorkflowModel>;

  declare jobs?: JobModel[];
  declare getJobs: HasManyGetAssociationsMixin<JobModel>;

  options: ExecutionOptions;

  tx: Transaction;

  nodes: Array<FlowNodeModel> = [];
  nodesMap = new Map<number, FlowNodeModel>();
  jobsMap = new Map<number, JobModel>();
  jobsMapByNodeId: { [key: number]: any } = {};

  static StatusMap = {
    [JOB_STATUS.PENDING]: EXECUTION_STATUS.STARTED,
    [JOB_STATUS.RESOLVED]: EXECUTION_STATUS.RESOLVED,
    [JOB_STATUS.REJECTED]: EXECUTION_STATUS.REJECTED,
    [JOB_STATUS.CANCELLED]: EXECUTION_STATUS.CANCELLED,
  };

  // make dual linked nodes list then cache
  makeNodes(nodes = []) {
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

  makeJobs(jobs: Array<JobModel>) {
    jobs.forEach((job) => {
      this.jobsMap.set(job.id, job);
      // TODO: should consider cycle, and from previous job
      this.jobsMapByNodeId[job.nodeId] = job.result;
    });
  }

  async getTransaction() {
    const { sequelize } = (<typeof ExecutionModel>this.constructor).database;

    if (!this.useTransaction) {
      return undefined;
    }

    const { options } = this;

    // @ts-ignore
    const transaction = options.transaction && !options.transaction.finished
      ? options.transaction
      : sequelize.transaction();

    // @ts-ignore
    if (this.transaction !== transaction.id) {
      // @ts-ignore
      await this.update({ transaction: transaction.id }, { transaction });
    }
    return transaction;
  }

  async prepare(options, commit = false) {
    this.options = options || {};
    const transaction = await this.getTransaction();
    this.tx = transaction;

    if (!this.workflow) {
      this.workflow = await this.getWorkflow({ transaction });
    }

    const nodes = await this.workflow.getNodes({ transaction });

    this.makeNodes(nodes);

    const jobs = await this.getJobs({
      order: [['id', 'ASC']],
      transaction,
    });

    this.makeJobs(jobs);

    if (commit) {
      await this.commit();
    }
  }

  public async start(options: ExecutionOptions) {
    if (this.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${this.status}`);
    }
    await this.prepare(options);
    if (this.nodes.length) {
      const head = this.nodes.find(item => !item.upstream);
      await this.run(head, { result: this.context });
    } else {
      await this.exit(null);
    }
    await this.commit();
  }

  public async resume(job: JobModel, options: ExecutionOptions) {
    if (this.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${this.status}`);
    }
    await this.prepare(options);
    const node = this.nodesMap.get(job.nodeId);
    await this.recall(node, job);
    await this.commit();
  }

  private async commit() {
    // @ts-ignore
    if (this.tx && (!this.options.transaction || this.options.transaction.finished)) {
      await this.tx.commit();
    }
  }

  private async exec(instruction: Function, node: FlowNodeModel, prevJob) {
    let job;
    try {
      // call instruction to get result and status
      job = await instruction.call(node, prevJob, this);
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
      savedJob = (await job.save({ transaction: this.tx })) as unknown as JobModel;
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
    const { run } = instructions.get(node.type);
    if (typeof run !== 'function') {
      return Promise.reject(new Error('`run` should be implemented for customized execution of the node'));
    }

    return this.exec(run, node, input);
  }

  // parent node should take over the control
  public end(node, job) {
    const parentNode = this.findBranchParentNode(node);
    // no parent, means on main flow
    if (parentNode) {
      return this.recall(parentNode, job);
    }

    // really done for all nodes
    // * should mark execution as done with last job status
    return this.exit(job);
  }

  async recall(node, job) {
    const { resume } = instructions.get(node.type);
    if (typeof resume !== 'function') {
      return Promise.reject(new Error('`resume` should be implemented because the node made branch'));
    }

    return this.exec(resume, node, job);
  }

  async exit(job: JobModel | null) {
    const status = job ? ExecutionModel.StatusMap[job.status] : EXECUTION_STATUS.RESOLVED;
    await this.update({ status }, { transaction: this.tx });
    return null;
  }

  // TODO(optimize)
  async saveJob(payload) {
    const { database } = <typeof ExecutionModel>this.constructor;
    const { model } = database.getCollection('jobs');
    const [job] = (await model.upsert(
      {
        ...payload,
        executionId: this.id,
      },
      { transaction: this.tx },
    )) as unknown as [JobModel, boolean | null];
    this.jobsMap.set(job.id, job);
    this.jobsMapByNodeId[job.nodeId] = job.result;

    return job;
  }

  // find the first node in current branch
  findBranchStartNode(node: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.upstream) {
      if (n.branchIndex !== null) {
        return n;
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
      execution: this,
      node
    };
    for (let [name, fn] of calculators.getEntities()) {
      injectedFns[name] = fn.bind(scope);
    }

    return parse(value)({
      $context: this.context,
      $jobsMapByNodeId: this.jobsMapByNodeId,
      $fn: injectedFns
    });
  }
}
