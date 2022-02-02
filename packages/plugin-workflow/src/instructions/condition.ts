// config: {
//   not: false,
//   group: {
//     type: 'and',
//     calculations: [
//       {
//         calculator: 'time.equal',
//         operands: [{ type: 'context', options: { path: 'time' } }, { type: 'fn', options: { name: 'newDate', args: [] } }]
//       },
//       {
//         calculator: 'value.equal',
//         operands: [{ type: 'job.result', options: { id: 213, path: '' } }, { type: 'constant', value: { a: 1 } }]
//       }
//     ]
//   }
// }

import Sequelize = require('sequelize');
import { getValue, Operand } from "../utils/getter";
import { getCalculator } from "../utils/calculators";
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

function calculate(config, input, execution) {
  if (!config) {
    return true;
  }

  const { not, group } = config;
  let result;
  if (group) {
    const method = group.type === 'and' ? 'every' : 'some';
    result = group.calculations[method](calculation => calculate(calculation, input, execution));
  } else {
    const args = config.operands.map(operand => getValue(operand, input, execution));
    const fn = getCalculator(config.calculator);
    if (!fn) {
      throw new Error(`no calculator function registered for "${config.calculator}"`);
    }
    result = fn(...args);
  }

  return not ? !result : result;
}


export default {
  async run(this, prevJob, execution) {
    // TODO(optimize): loading of jobs could be reduced and turned into incrementally in execution
    // const jobs = await execution.getJobs();
    const { calculation } = this.config || {};
    const result = calculate(calculation, prevJob, execution);

    if (!result && this.config.rejectOnFalse) {
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
      upstreamId: prevJob instanceof Sequelize.Model ? prevJob.get('id') : null
    };

    const branchNode = execution.nodes
      .find(item => item.upstream === this && Boolean(item.branchIndex) === result);

    if (!branchNode) {
      return job;
    }

    const savedJob = await execution.saveJob(job);

    return execution.exec(branchNode, savedJob);
  },

  async resume(this, branchJob, execution) {
    if (branchJob.status === JOB_STATUS.RESOLVED) {
      // return to continue this.downstream
      return branchJob;
    }

    // pass control to upper scope by ending current scope
    return execution.end(this, branchJob);
  }
}
