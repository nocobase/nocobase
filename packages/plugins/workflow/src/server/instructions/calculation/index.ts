import { get } from "lodash";

import { Registry } from "@nocobase/utils";

import Plugin, { Processor } from '../..';
import { JOB_STATUS } from "../../constants";
import FlowNodeModel from "../../models/FlowNode";
import { Instruction } from "..";
import initEngines from "./engines";



type Evaluator = (expression: string) => any;

interface CalculationConfig {
  engine: string;
  expression: string;
}

class CalculationInstruction implements Instruction {
  engines = new Registry<Evaluator>();

  constructor(protected plugin: Plugin) {
    initEngines(this);
  }

  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine, expression } = <CalculationConfig>node.config || {};
    const evaluator = <Evaluator | undefined>this.engines.get(engine);
    const scope = processor.getScope();
    const exp = expression.trim().replace(/{{([^{}]+)}}/g, (_, v) => {
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
        status: JOB_STATUS.REJECTED
      }
    }
  }
}

export default CalculationInstruction;
