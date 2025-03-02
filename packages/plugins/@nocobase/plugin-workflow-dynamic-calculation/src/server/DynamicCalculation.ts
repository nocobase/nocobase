/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '@nocobase/utils';
import { FlowNodeModel, Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import evaluators, { Evaluator } from '@nocobase/evaluators';

export class DynamicCalculation extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    let { engine = 'math.js', expression = '' } = node.config;
    let scope = processor.getScope(node.id);
    const parsed = parse(expression)(scope) ?? {};
    engine = parsed.engine;
    expression = parsed.expression;
    scope = parse(node.config.scope ?? '')(scope) ?? {};

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
