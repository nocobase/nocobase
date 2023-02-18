
import { get } from "lodash";

import { Evaluator, Processor } from '..';
import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";
import { Instruction } from ".";

function logicCalculate(calculation, evaluator, scope) {
  if (!calculation) {
    return true;
  }

  if (typeof calculation === 'object' && calculation.group) {
    const method = calculation.group.type === 'and' ? 'every' : 'some';
    return calculation.group.calculations[method](item => logicCalculate(item, evaluator, scope));
  }

  return evaluator(calculation, scope);
}


export default {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    // TODO(optimize): loading of jobs could be reduced and turned into incrementally in processor
    // const jobs = await processor.getJobs();
    const { engine = 'basic', calculation, rejectOnFalse } = node.config || {};
    const evaluator = <Evaluator | undefined>processor.options.plugin.calculators.get(engine);
    if (!evaluator) {
      return {
        status: JOB_STATUS.ERROR,
        result: new Error('no calculator engine configured')
      }
    }

    const scope = processor.getScope();
    let result = true;

    try {
      result = logicCalculate(calculation, evaluator, scope);
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR
      }
    }

    if (!result && rejectOnFalse) {
      return {
        status: JOB_STATUS.FAILED,
        result
      };
    }

    const job = {
      status: JOB_STATUS.RESOLVED,
      result,
      // TODO(optimize): try unify the building of job
      nodeId: node.id,
      upstreamId: prevJob && prevJob.id || null
    };

    const branchNode = processor.nodes
      .find(item => item.upstream === node && Boolean(item.branchIndex) === result);

    if (!branchNode) {
      return job;
    }

    const savedJob = await processor.saveJob(job);

    return processor.run(branchNode, savedJob);
  },

  async resume(node: FlowNodeModel, branchJob, processor: Processor) {
    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue node.downstream
      return branchJob;
    }

    // pass control to upper scope by ending current scope
    return processor.end(node, branchJob);
  }
} as Instruction;
