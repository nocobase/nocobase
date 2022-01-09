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

import { getValue, Operand } from "./getter";
import { getCalculator } from "./calculators";

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
  manual: false,
  async run(this, input, execution) {
    // TODO(optimize): loading of jobs could be reduced and turned into incrementally in execution
    const jobs = await execution.getJobs();
    return calculate(this.config as Calculation, input, execution);
  }
}
