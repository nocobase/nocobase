import Sequelize from 'sequelize';
import { Model, ModelCtor } from '@nocobase/database';

import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import { getInstruction } from '../instructions';

export class ExecutionModel extends Model {
  nodes: Array<any> = [];
  nodesMap = new Map();
  jobsMap = new Map();

  // make dual linked nodes list then cache
  makeNodes(nodes = []) {
    this.nodes = nodes;

    nodes.forEach(node => {
      this.nodesMap.set(node.id, node);
    });

    nodes.forEach(node => {
      if (node.upstream_id) {
        node.upstream = this.nodesMap.get(node.upstream_id);
      }

      if (node.downstream_id) {
        node.downstream = this.nodesMap.get(node.downstream_id);
      }
    });
  }

  makeJobs(jobs: Array<ModelCtor<Model>>) {
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
      return this.exit(null);
    }
    const head = this.nodes.find(item => !item.upstream);
    return this.exec(head, { result: this.context });
  }

  async resume(job, options) {
    await this.prepare();
    const node = this.nodesMap.get(job.node_id);
    return this.recall(node, job);
  }

  private async run(instruction, node, prevJob) {
    let job;
    try {
      // call instruction to get result and status
      job = await instruction.call(node, prevJob, this);
    } catch (err) {
      console.error(err);
      // for uncaught error, set to rejected
      job = {
        result: err,
        status: JOB_STATUS.REJECTED
      };
    }

    let savedJob;
    if (job instanceof Sequelize.Model) {
      savedJob = await job.save();
    } else {
      const upstream_id = prevJob instanceof Sequelize.Model ? prevJob.get('id') : null;
      savedJob = await this.saveJob({
        node_id: node.id,
        upstream_id,
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

  async exit(job) {
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
    const JobModel = this.database.getModel('jobs');
    const [result] = await JobModel.upsert({
      ...payload,
      execution_id: this.id
    });

    this.jobsMap.set(result.id, result);

    return result;
  }

  findBranchParentNode(node): any {
    for (let n = node; n; n = n.upstream) {
      if (n.linkType !== null) {
        return n.upstream;
      }
    }
    return null;
  }

  findBranchParentJob(job, node) {
    for (let j = job; j; j = this.jobsMap.get(j.upstream_id)) {
      if (j.node_id === node.id) {
        return j;
      }
    }
    return null;
  }
}
