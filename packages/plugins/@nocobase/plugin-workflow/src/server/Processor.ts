import { Model, Transaction, Transactionable } from '@nocobase/database';
import { appendArrayColumn } from '@nocobase/evaluators';
import { Logger } from '@nocobase/logger';
import { parse } from '@nocobase/utils';
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
  transaction: Transaction;
  nodes: FlowNodeModel[] = [];
  nodesMap = new Map<number, FlowNodeModel>();
  jobsMap = new Map<number, JobModel>();
  jobsMapByNodeKey: { [key: string]: any } = {};
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
      this.jobsMap.set(job.id, job);

      const node = this.nodesMap.get(job.nodeId);
      this.jobsMapByNodeKey[node.key] = job.result;
    });
  }

  public async prepare() {
    const { execution, transaction } = this;
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
        return null;
      }
    } catch (err) {
      // for uncaught error, set to error
      this.logger.error(
        `execution (${this.execution.id}) run instruction [${node.type}] for node (${node.id}) failed: `,
        { error: err },
      );
      job = {
        result:
          err instanceof Error
            ? {
                message: err.message,
                stack:
                  process.env.NODE_ENV === 'production'
                    ? 'Error stack will not be shown under "production" environment, please check logs.'
                    : err.stack,
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
      job.upstreamId = prevJob instanceof Model ? prevJob.get('id') : null;
      job.nodeId = node.id;
      job.nodeKey = node.key;
    }
    const savedJob = await this.saveJob(job);

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
      return job;
    }

    // really done for all nodes
    // * should mark execution as done with last job status
    return this.exit(job.status);
  }

  async recall(node, job) {
    const { instructions } = this.options.plugin;
    const instruction = instructions.get(node.type);
    if (typeof instruction.resume !== 'function') {
      return Promise.reject(
        new Error(`"resume" method should be implemented for [${node.type}] instruction of node (#${node.id})`),
      );
    }

    return this.exec(instruction.resume.bind(instruction), node, job);
  }

  async exit(s?: number) {
    if (typeof s === 'number') {
      const status = (<typeof Processor>this.constructor).StatusMap[s] ?? Math.sign(s);
      await this.execution.update({ status }, { transaction: this.transaction });
    }
    this.logger.info(`execution (${this.execution.id}) exiting with status ${this.execution.status}`);
    return null;
  }

  // TODO(optimize)
  async saveJob(payload) {
    const { database } = <typeof ExecutionModel>this.execution.constructor;
    const { transaction } = this;
    const { model } = database.getCollection('jobs');
    let job;
    if (payload instanceof model) {
      job = await payload.save({ transaction });
    } else if (payload.id) {
      job = await model.findByPk(payload.id, { transaction });
      await job.update(payload, { transaction });
    } else {
      job = await model.create(
        {
          ...payload,
          executionId: this.execution.id,
        },
        { transaction },
      );
    }
    this.jobsMap.set(job.id, job);

    this.lastSavedJob = job;
    this.jobsMapByNodeKey[job.nodeKey] = job.result;

    return job;
  }

  getBranches(node: FlowNodeModel): FlowNodeModel[] {
    return this.nodes
      .filter((item) => item.upstream === node && item.branchIndex !== null)
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

  findBranchEndNode(node: FlowNodeModel): FlowNodeModel | null {
    for (let n = node; n; n = n.downstream) {
      if (!n.downstream) {
        return n;
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

  findBranchLastJob(node: FlowNodeModel, job: JobModel): JobModel | null {
    const allJobs = Array.from(this.jobsMap.values());
    const branchJobs = [];
    for (let n = this.findBranchEndNode(node); n && n !== node.upstream; n = n.upstream) {
      branchJobs.push(...allJobs.filter((item) => item.nodeId === n.id));
    }
    branchJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = branchJobs.length - 1; i >= 0; i -= 1) {
      for (let j = branchJobs[i]; j && j.id !== job.id; j = this.jobsMap.get(j.upstreamId)) {
        if (j.upstreamId === job.id) {
          return branchJobs[i];
        }
      }
    }
    return null;
  }

  public getScope(sourceNodeId: number) {
    const node = this.nodesMap.get(sourceNodeId);
    const systemFns = {};
    const scope = {
      execution: this.execution,
      node,
    };
    for (const [name, fn] of this.options.plugin.functions.getEntities()) {
      systemFns[name] = fn.bind(scope);
    }

    const $scopes = {};
    for (let n = this.findBranchParentNode(node); n; n = this.findBranchParentNode(n)) {
      const instruction = this.options.plugin.instructions.get(n.type);
      if (typeof instruction.getScope === 'function') {
        $scopes[n.id] = $scopes[n.key] = instruction.getScope(n, this.jobsMapByNodeKey[n.key], this);
      }
    }

    return {
      $context: this.execution.context,
      $jobsMapByNodeKey: this.jobsMapByNodeKey,
      $system: systemFns,
      $scopes,
    };
  }

  public getParsedValue(value, sourceNodeId: number, additionalScope?: object) {
    const template = parse(value);
    const scope = Object.assign(this.getScope(sourceNodeId), additionalScope);
    template.parameters.forEach(({ key }) => {
      appendArrayColumn(scope, key);
    });
    return template(scope);
  }
}
