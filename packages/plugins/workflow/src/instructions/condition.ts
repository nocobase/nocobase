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
function logicCalculate(calculation, input, execution) {
  if (!calculation) {
    return true;
  }

  const { not, group } = calculation;
  let result;
  if (group) {
    const method = group.type === 'and' ? 'every' : 'some';
    result = group.calculations[method](item => logicCalculate(item, input, execution));
  } else {
    const args = calculation.operands.map(operand => calculate(operand, input, execution));
    const fn = calculators.get(calculation.calculator);
    if (!fn) {
      throw new Error(`no calculator function registered for "${calculation.calculator}"`);
    }
    result = fn(...args);
  }

  return not ? !result : result;
}


export default {
  async run(this, prevJob, execution) {
    // TODO(optimize): loading of jobs could be reduced and turned into incrementally in execution
    // const jobs = await execution.getJobs();
    const { calculation, rejectOnFalse } = this.config || {};
    const result = logicCalculate(calculation, prevJob, execution);

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
      nodeId: this.id,
      upstreamId: prevJob && prevJob.id || null
    };

    const branchNode = execution.nodes
      .find(item => item.upstream === this && Boolean(item.branchIndex) === result);

    if (!branchNode) {
      return job;
    }

    const savedJob = await execution.saveJob(job);

    return execution.run(branchNode, savedJob);
  },

  async resume(this, branchJob, execution) {
    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue this.downstream
      return branchJob;
    }

    // pass control to upper scope by ending current scope
    return execution.end(this, branchJob);
  }
};
