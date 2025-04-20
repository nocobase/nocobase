/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Trigger from '..';
import type Plugin from '../../Plugin';
import { WorkflowModel } from '../../types';
import DateFieldScheduleTrigger from './DateFieldScheduleTrigger';
import StaticScheduleTrigger from './StaticScheduleTrigger';
import { SCHEDULE_MODE } from './utils';

export default class ScheduleTrigger extends Trigger {
  sync = false;

  private modes = new Map();

  constructor(workflow: Plugin) {
    super(workflow);

    this.modes.set(SCHEDULE_MODE.STATIC, new StaticScheduleTrigger(workflow));
    this.modes.set(SCHEDULE_MODE.DATE_FIELD, new DateFieldScheduleTrigger(workflow));
  }

  private getTrigger(mode: number) {
    return this.modes.get(mode);
  }

  on(workflow) {
    const mode = workflow.config.mode;
    const trigger = this.getTrigger(mode);
    if (trigger) {
      trigger.on(workflow);
    }
  }

  off(workflow) {
    const mode = workflow.config.mode;
    const trigger = this.getTrigger(mode);
    if (trigger) {
      trigger.off(workflow);
    }
  }

  async execute(workflow, values: any, options) {
    const mode = workflow.config.mode;
    const trigger = this.getTrigger(mode);
    if (trigger) {
      return trigger.execute(workflow, values, options);
    }
  }

  // async validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): Promise<boolean> {
  //   if (!context.date) {
  //     return false;
  //   }
  //   const existed = await workflow.getExecutions({
  //     attributes: ['id'],
  //     where: {
  //       'context.date': context.date instanceof Date ? context.date.toISOString() : context.date,
  //     },
  //     transaction: options.transaction,
  //   });
  //   return !existed.length;
  // }

  validateContext(values, workflow: WorkflowModel) {
    const { mode } = workflow.config;
    const trigger = this.getTrigger(mode);
    if (!trigger) {
      return {
        mode: 'Mode in invalid',
      };
    }

    return trigger.validateContext?.(values, workflow);
  }
}
