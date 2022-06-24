import FlowNodeModel from "../models/FlowNode";
import JobModel from "../models/Job";
import Processor from "../Processor";
import { JOB_STATUS } from "../constants";

export const PARALLEL_MODE = {
  ALL: 'all',
  ANY: 'any',
  RACE: 'race'
} as const;

const StatusGetters = {
  [PARALLEL_MODE.ALL](result) {
    if (result.some(j => j && j.status === JOB_STATUS.REJECTED)) {
      return JOB_STATUS.REJECTED;
    }
    if (result.every(j => j && j.status === JOB_STATUS.RESOLVED)) {
      return JOB_STATUS.RESOLVED;
    }
    return JOB_STATUS.PENDING;
  },
  [PARALLEL_MODE.ANY](result) {
    return result.some(j => j && j.status === JOB_STATUS.RESOLVED)
      ? JOB_STATUS.RESOLVED
      : (
        result.some(j => j && j.status === JOB_STATUS.PENDING)
          ? JOB_STATUS.PENDING
          : JOB_STATUS.REJECTED
      )
  },
  [PARALLEL_MODE.RACE](result) {
    return result.some(j => j && j.status === JOB_STATUS.RESOLVED)
      ? JOB_STATUS.RESOLVED
      : (
        result.some(j => j && j.status === JOB_STATUS.REJECTED)
          ? JOB_STATUS.REJECTED
          : JOB_STATUS.PENDING
      )
  }
};

export default {
  async run(node: FlowNodeModel, prevJob: JobModel, processor: Processor) {
    const branches = processor.nodes
      .filter(item => item.upstream === node && item.branchIndex !== null)
      .sort((a, b) => a.branchIndex - b.branchIndex);

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: Array(branches.length).fill(null),
      nodeId: node.id,
      upstreamId: prevJob?.id ?? null
    });

    // NOTE:
    // use `reduce` but not `Promise.all` here to avoid racing manupulating db.
    // for users, this is almost equivalent to `Promise.all`,
    // because of the delay is not significant sensible.
    // another benifit of this is, it could handle sequenced branches in future.
    await branches.reduce((promise: Promise<any>, branch) => promise.then(() => processor.run(branch, job)), Promise.resolve());

    return processor.end(node, job);
  },

  async resume(node: FlowNodeModel, branchJob, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node);

    const { result, status } = job;
    // if parallel has been done (resolved / rejected), do not care newly executed branch jobs.
    if (status !== JOB_STATUS.PENDING) {
      return null;
    }

    // find the index of the node which start the branch
    const jobNode = processor.nodesMap.get(branchJob.nodeId);
    const { branchIndex } = processor.findBranchStartNode(jobNode);
    const { mode = PARALLEL_MODE.ALL } = node.config || {};

    const newResult = [...result.slice(0, branchIndex), branchJob.get(), ...result.slice(branchIndex + 1)];
    job.set({
      result: newResult,
      status: StatusGetters[mode](newResult)
    });

    if (job.status === JOB_STATUS.PENDING) {
      await job.save({ transaction: processor.transaction });
      return processor.end(node, job);
    }

    return job;
  }
};
