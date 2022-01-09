import { Model } from '@nocobase/database';

import { get as getTrigger } from '../triggers';
import { EXECUTION_STATUS } from '../constants';

export class WorkflowModel extends Model {
  static async mount() {
    const workflows = await this.findAll({
      where: { enabled: true }
    });

    workflows.forEach(workflow => {
      workflow.mount();
    });

    this.addHook('afterCreate', (model: WorkflowModel) => model.mount());
    // TODO: afterUpdate, afterDestroy
  }

  async mount() {
    if (!this.get('enabled')) {
      return;
    }
    const type = this.get('type');
    const config = this.get('config');
    const trigger = getTrigger(type);
    trigger.call(this, config, this.start.bind(this));
  }

  // TODO
  async unmount() {
    
  }

  async start(context: Object, options) {
    // `null` means not to trigger
    if (context === null) {
      return;
    }

    const execution = await this.createExecution({
      context,
      status: EXECUTION_STATUS.STARTED
    });
    execution.setDataValue('workflow', this);
    await execution.exec(context, null, options);
    return execution;
  }
}
