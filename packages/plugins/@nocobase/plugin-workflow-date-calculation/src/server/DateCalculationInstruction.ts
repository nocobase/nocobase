/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';
import dayjs, { Dayjs } from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';

import { functions } from './dateFunction';
import { isDate } from '..';
import { Registry } from '@nocobase/utils';

dayjs.extend(isLeapYear);

export default class extends Instruction {
  functions: Registry<Function> = new Registry();

  constructor(workflow) {
    super(workflow);

    for (const key in functions) {
      this.functions.register(key, functions[key]);
    }
  }

  calculate({ steps = [], input = new Date(), inputType = 'date' }) {
    let result: Dayjs | number;
    if (inputType === 'date' && isDate(input)) {
      result = dayjs(input);
    } else if (inputType === 'number' && typeof input === 'number') {
      result = input;
    } else {
      return {
        result: 'Invalid input',
        status: JOB_STATUS.ERROR,
      };
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const calculate = this.functions.get(step.function);

      try {
        result = calculate(result, step.arguments);
      } catch (e) {
        return {
          result: e.toString(),
          status: JOB_STATUS.ERROR,
        };
      }
    }

    return {
      result: dayjs.isDayjs(result) ? result.toDate() : result,
      status: JOB_STATUS.RESOLVED,
    };
  }

  async run(node: FlowNodeModel, _: any, processor: Processor) {
    const { steps = [], input = new Date(), inputType = 'date' } = processor.getParsedValue(node.config, node.id);

    return this.calculate({ steps, input, inputType });
  }

  async test({ steps = [], input = new Date(), inputType = 'date' }) {
    return this.calculate({ steps, input, inputType });
  }
}
