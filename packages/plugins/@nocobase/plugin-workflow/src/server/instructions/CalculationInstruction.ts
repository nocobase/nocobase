import { Evaluator, evaluators } from '@nocobase/evaluators';
import { parse } from '@nocobase/utils';
import { Instruction } from '.';
import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel } from '../types';

export interface CalculationConfig {
  dynamic?: boolean | string;
  engine?: string;
  expression?: string;
}

export class CalculationInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { dynamic = false } = <CalculationConfig>node.config || {};
    let { engine = 'math.js', expression = '' } = node.config;
    let scope = processor.getScope(node.id);
    if (dynamic) {
      const parsed = parse(dynamic)(scope) ?? {};
      engine = parsed.engine;
      expression = parsed.expression;
      scope = parse(node.config.scope ?? '')(scope) ?? {};
    }

    const evaluator = <Evaluator | undefined>evaluators.get(engine);

    try {
      const result = evaluator && expression ? evaluator(expression, scope) : null;
      return {
        result,
        status: JOB_STATUS.RESOLVED,
      };
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR,
      };
    }
  }
}

export default CalculationInstruction;
