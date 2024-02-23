import { Transactionable } from 'sequelize';
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

  async validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): Promise<boolean> {
    if (!context.date) {
      return false;
    }
    const existed = await workflow.countExecutions({
      where: {
        'context.date': context.date,
      },
      transaction: options.transaction,
    });
    return !existed;
  }
}
