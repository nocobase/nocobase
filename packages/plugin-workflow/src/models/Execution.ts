import {
  Model,
  BelongsToGetAssociationMixin,
  Optional,
  HasManyGetAssociationsMixin
} from 'sequelize';

import Database from '@nocobase/database';

import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import { getInstruction } from '../instructions';
import WorkflowModel from './Workflow';
import FlowNodeModel from './FlowNode';
import JobModel from './Job';

interface ExecutionAttributes {
  id: number;
  title: string;
  context: any;
  status: number;
}

interface ExecutionCreationAttributes extends Optional<ExecutionAttributes, 'id'> {}

export default class ExecutionModel
  extends Model<ExecutionAttributes, ExecutionCreationAttributes>
  implements ExecutionAttributes {

  declare readonly database: Database;

  declare id: number;
  declare title: string;
  declare context: any;
  declare status: number;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare workflow?: WorkflowModel;
  declare getWorkflow: BelongsToGetAssociationMixin<WorkflowModel>;

  declare jobs?: JobModel[];
  declare getJobs: HasManyGetAssociationsMixin<JobModel>;

  nodes: Array<FlowNodeModel> = [];
  nodesMap = new Map<number, FlowNodeModel>();
  jobsMap = new Map<number, JobModel>();

  // make dual linked nodes list then cache
  makeNodes(nodes = []) {
    this.nodes = nodes;

    nodes.forEach(node => {
      this.nodesMap.set(node.id, node);
    });

    nodes.forEach(node => {
      if (node.upstreamId) {
        node.upstream = this.nodesMap.get(node.upstreamId);
      }

      if (node.downstreamId) {
        node.downstream = this.nodesMap.get(node.downstreamId);
      }
    });
  }

  makeJobs(jobs: Array<JobModel>) {
    jobs.forEach(job => {
      this.jobsMap.set(job.id, job);
    });
  }

  async prepare() {
    if (this.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`execution was ended with status ${this.status}`);
    }

    if (!this.workflow) {
      this.workflow = await this.getWorkflow();
    }

    const nodes = await this.workflow.getNodes();

    this.makeNodes(nodes);

    const jobs = await this.getJobs();

    this.makeJobs(jobs);
  }

  async start(options) {
    await this.prepare();
    if (!this.nodes.length) {
      return this.exit();
    }
    const head = this.nodes.find(item => !item.upstream);
    return this.exec(head, { result: this.context });
  }

  async resume(job, options) {
    await this.prepare();
    const node = this.nodesMap.get(job.nodeId);
    return this.recall(node, job);
  }

  private async run(instruction, node, prevJob) {
    let job;
    try {
      // call instruction to get result and status
      job = await instruction.call(node, prevJob, this);
    } catch (err) {
      // for uncaught error, set to rejected
      job = {
        result: err instanceof Error ? err.toString() : err,
        status: JOB_STATUS.REJECTED
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
      savedJob = await job.save();
    } else {
      const upstreamId = prevJob instanceof Model ? prevJob.get('id') : null;
      savedJob = await this.saveJob({
        nodeId: node.id,
        upstreamId,
        ...job
      });
    }

    if (savedJob.get('status') === JOB_STATUS.RESOLVED && node.downstream) {
      // run next node
      return this.exec(node.downstream, savedJob);
    }

    // all nodes in scope have been executed
    return this.end(node, savedJob);
  }

  async exec(node, input?) {
    const { run } = getInstruction(node.type);

    return this.run(run, node, input);
  }

  // parent node should take over the control
  end(node, job) {
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
    const { resume } = getInstruction(node.type);
    if (!resume) {
      return Promise.reject(new Error('`resume` should be implemented because the node made branch'));
    }

    return this.run(resume, node, job);
  }

  async exit(job?: JobModel) {
    const executionStatusMap = {
      [JOB_STATUS.PENDING]: EXECUTION_STATUS.STARTED,
      [JOB_STATUS.RESOLVED]: EXECUTION_STATUS.RESOLVED,
      [JOB_STATUS.REJECTED]: EXECUTION_STATUS.REJECTED,
      [JOB_STATUS.CANCELLED]: EXECUTION_STATUS.CANCELLED,
    };
    const status = job ? executionStatusMap[job.status] : EXECUTION_STATUS.RESOLVED;
    await this.update({ status });
    return job;
  }

  // TODO(optimize)
  async saveJob(payload) {
    // @ts-ignore
    const { database } = this.constructor;
    const { model } = database.getCollection('jobs');
    const [result] = await model.upsert({
      ...payload,
      executionId: this.id
    }) as [JobModel, boolean | null];
    this.jobsMap.set(result.id, result);

    return result;
  }

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
}
