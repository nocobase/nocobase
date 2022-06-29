import calculators, { calculate, Operand } from "../calculators";
import { JOB_STATUS } from "../constants";

type BaseCalculation = {
  not?: boolean;
};

type SingleCalculation = BaseCalculation & {
  calculation: string;
  operands?: Operand[];
};

type GroupCalculationOptions = {
  type: 'and' | 'or';
  calculations: Calculation[]
};

type GroupCalculation = BaseCalculation & {
  group: GroupCalculationOptions
};

// TODO(type)
type Calculation = SingleCalculation | GroupCalculation;

// @calculation: {
//   not: false,
//   group: {
//     type: 'and',
//     calculations: [
//       {
//         calculator: 'time.equal',
//         operands: [{ value: '{{$context.time}}' }, { value: '{{$fn.now}}' }]
//       },
//       {
//         calculator: 'value.equal',
//         operands: [{ value: '{{$jobsMapByNodeId.213}}' }, { value: 1 }]
//       },
//       {
//         group: {
//           type: 'or',
//           calculations: [
//             {
//               calculator: 'value.equal',
//               operands: [{ value: '{{$jobsMapByNodeId.213}}' }, { value: 1 }]
//             }
//           ]
//         }
//       }
//     ]
//   }
// }
function logicCalculate(calculation, input, processor) {
  if (!calculation) {
    return true;
  }

  const { not, group } = calculation;
  let result;
  if (group) {
    const method = group.type === 'and' ? 'every' : 'some';
    result = group.calculations[method](item => logicCalculate(item, input, processor));
  } else {
    const args = calculation.operands.map(operand => calculate(operand, input, processor));
    const fn = calculators.get(calculation.calculator);
    if (!fn) {
      throw new Error(`no calculator function registered for "${calculation.calculator}"`);
    }
    result = fn(...args);
  }

  return not ? !result : result;
}


export default {
  async run(node, prevJob, processor) {
    // TODO(optimize): loading of jobs could be reduced and turned into incrementally in processor
    // const jobs = await processor.getJobs();
    const { calculation, rejectOnFalse } = node.config || {};
    const result = logicCalculate(calculation, prevJob, processor);

    if (!result && rejectOnFalse) {
      return {
        status: JOB_STATUS.REJECTED,
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

  async resume(node, branchJob, processor) {
    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue node.downstream
      return branchJob;
    }

    // pass control to upper scope by ending current scope
    return processor.end(node, branchJob);
  }
};
