import { Model } from '@nocobase/database';

import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import { getInstruction } from '../instructions';

export class ExecutionModel extends Model {
  async exec(input, previousJob = null, options = {}) {
    // check execution status for quick out
    if (this.get('status') !== EXECUTION_STATUS.STARTED) {
      return;
    }

    let lastJob = previousJob || await this.getLastJob(options);
    const node = await this.getNextNode(lastJob);
    // if not found any node
    if (!node) {
      // set execution as resolved
      await this.update({
        status: EXECUTION_STATUS.RESOLVED
      });

      return;
    }

    // got node.id and node.type
    // find node instruction by type from registered node types in memory (program defined)
    const instruction = getInstruction(node.type);

    let result = null;
    let status = JOB_STATUS.PENDING;
    // check if manual or node is on current job
    if (!instruction.manual || (lastJob && lastJob.node_id === node.id)) {
      // execute instruction of next node and get status
      try {
        result = await instruction.run.call(node, input ?? lastJob?.result, this);
        status = JOB_STATUS.RESOLVED;
      } catch(err) {
        result = err;
        status = JOB_STATUS.REJECTED;
      }
    }

    // manually exec pending job
    if (lastJob && lastJob.node_id === node.id) {
      if (lastJob.status !== JOB_STATUS.PENDING) {
        // not allow to retry resolved or rejected job for now
        // TODO: based on retry config
        return;
      }
      // RUN instruction
      // should update the record based on input
      lastJob.update({
        status,
        result
      });
    } else {
      // RUN instruction
      lastJob = await this.createJob({
        status,
        node_id: node.id,
        upstream_id: lastJob ? lastJob.id : null,
        // TODO: how to presentation error?
        result
      });
    }

    switch(status) {
      case JOB_STATUS.PENDING:
      case JOB_STATUS.REJECTED:
        // TODO: should handle rejected when configured
        return;
      default:
        // should return chained promise to run any nodes as many as possible,
        // till end (pending/rejected/no more)
        return this.exec(result, lastJob, options);
    }
  }

  async getLastJob(options) {
    const jobs = await this.getJobs();
    
    if (!jobs.length) {
      return null;
    }

    // find last job, last means no any other jobs set upstream to
    const lastJobIds = new Set(jobs.map(item => item.id));
    jobs.forEach(item => {
      if (item.upstream_id) {
        lastJobIds.delete(item.upstream_id);
      }
    });
    // TODO(feature):
    // if has multiple jobs? which one or some should be run next?
    // if has determined flowNodeId, run that one.
    // else not supported for now (multiple race pendings)
    const [jobId] = Array.from(lastJobIds);
    return jobs.find(item => item.id === jobId) || null;
  }

  async getNextNode(lastJob) {
    if (!this.get('workflow')) {
      // cache workflow
      this.setDataValue('workflow', await this.getWorkflow());
    }
    const workflow = this.get('workflow');

    // if has not any job, means initial execution
    if (!lastJob) {
      // find first node for this workflow
      // first one is the one has no upstream
      const [firstNode = null] = await workflow.getNodes({
        where: {
          upstream_id: null
        }
      });

      // put firstNode as next node to be execute
      return firstNode;
    }

    const lastNode = await lastJob.getNode();

    if (lastJob.status === JOB_STATUS.PENDING) {
      return lastNode;
    }

    const [nextNode = null] = await workflow.getNodes({
      where: {
        upstream_id: lastJob.node_id,
        // TODO: need better design
        ...(lastNode.type === 'condition' ? {
          when: lastJob.result
        } : {})
      }
    });

    return nextNode;
  }
}
