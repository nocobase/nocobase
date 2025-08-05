/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Evaluator, evaluators } from '@nocobase/evaluators';
import { parse } from '@nocobase/utils';
import { Instruction } from '.';
import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel } from '../types';

export interface CalculationConfig {
  engine?: string;
  expression?: string;
}

export class CalculationInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine = 'math.js', expression = '' } = node.config;
    const scope = processor.getScope(node.id);

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

  async test({ engine = 'math.js', expression = '' }) {
    const evaluator = <Evaluator | undefined>evaluators.get(engine);
    try {
      const result = evaluator && expression ? evaluator(expression) : null;
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
