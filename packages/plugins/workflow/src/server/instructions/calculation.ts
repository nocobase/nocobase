import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";
import { calculate } from "../calculators";

// @calculation: {
//   calculator: 'concat',
//   operands: [
//     {
//       type: 'calculation',
//       options: {
//         calculator: 'add',
//         operands: [{ value: 1 }, { value: 2 }]
//       }
//     },
//     {
//       type: 'constant',
//       value: '{{$context.data.title}}'
//     },
//     {
//       type: 'context',
//       options: {
//         path: 'data.title'
//       }
//     },
//     {
//       type: 'constant',
//       value: 1
//     }
//   ]
// }

export default {
  async run(node: FlowNodeModel, prevJob, processor) {
    const { calculation } = node.config || {};

    const result = calculation
      ? calculate({
        type: '$calculation',
        options: processor.getParsedValue(calculation)
      }, prevJob, processor)
      : null;

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
}
