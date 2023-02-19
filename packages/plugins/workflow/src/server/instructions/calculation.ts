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

    try {
      const result = evaluator && expression
        ? evaluator(expression, scope)
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
