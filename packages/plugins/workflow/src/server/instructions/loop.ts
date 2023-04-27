import FlowNodeModel from '../models/FlowNode';
import JobModel from '../models/Job';
import Processor from '../Processor';
import { JOB_STATUS } from '../constants';

export default {
  async run(node: FlowNodeModel, prevJob: JobModel, processor: Processor) {
    const [branch] = processor.getBranches(node);
    const target = processor.getParsedValue(node.config.target);
    const targets = (Array.isArray(target) ? target : [target]).filter((t) => t != null);

    if (!branch || !targets.length) {
      return {
        status: JOB_STATUS.RESOLVED,
        result: 0,
      };
    }

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      // save loop index
      result: 0,
      nodeId: node.id,
      upstreamId: prevJob?.id ?? null,
    });

    // TODO: add loop scope to stack
    // processor.stack.push({
    //   label: node.title,
    //   value: node.id
    // });

    await processor.run(branch, job);

    return processor.end(node, job);
  },

  async resume(node: FlowNodeModel, branchJob, processor: Processor) {
    const job = processor.findBranchParentJob(branchJob, node) as JobModel;
    const loop = processor.nodesMap.get(job.nodeId);
    const [branch] = processor.getBranches(node);

    const { result, status } = job;
    // if loop has been done (resolved / rejected), do not care newly executed branch jobs.
    if (status !== JOB_STATUS.PENDING) {
      return null;
    }

    const nextIndex = result + 1;

    const target = processor.getParsedValue(loop.config.target);
    // branchJob.status === JOB_STATUS.RESOLVED means branchJob is done, try next loop or exit as resolved
    const targets = (Array.isArray(target) ? target : [target]).filter((t) => t != null);
    if (branchJob.status > JOB_STATUS.PENDING && nextIndex < targets.length) {
      job.set({ result: nextIndex });
      await processor.saveJob(job);
      await processor.run(branch, job);

      return null;
    }

    // branchJob.status !== JOB_STATUS.PENDING means branchJob is done (resolved / rejected)
    // branchJob.status < JOB_STATUS.PENDING means branchJob is rejected, any rejection should cause loop rejected
    if (branchJob.status) {
      job.set({
        result: nextIndex,
        status: branchJob.status,
      });

      return job;
    }

    return processor.end(node, job);
  },

  getScope(node, index, processor) {
    const target = processor.getParsedValue(node.config.target);
    const targets = (Array.isArray(target) ? target : [target]).filter((t) => t != null);

    const result = {
      item: targets[index],
      index,
    };

    return result;
  },
};
