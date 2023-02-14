import { get } from "lodash";

import { Evaluator, Processor } from '..';
import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";
import { Instruction } from ".";



interface CalculationConfig {
  engine: string;
  expression: string;
}

export default {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine, expression = '' } = <CalculationConfig>node.config || {};
    const evaluator = <Evaluator | undefined>processor.options.plugin.calculators.get(engine);
    const scope = processor.getScope();
    const exp = expression.trim().replace(/\{\{\s*([^{}]+)\.?\s*\}\}/g, (_, v) => {
      const item = get(scope, v);
      return typeof item === 'function' ? item() : item;
    });

    try {
      const result = evaluator && exp
        ? evaluator(exp)
        : null;
      return {
        result,
        status: JOB_STATUS.RESOLVED
      };
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR
      }
    }
  }
} as Instruction;
