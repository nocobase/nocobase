import { get } from 'lodash';

import { Trigger } from '.';
import Plugin from '..';
import { WorkflowModel } from '../types';

export default class FormTrigger extends Trigger {
  constructor(plugin: Plugin) {
    super(plugin);

    plugin.app.resourcer.use(this.middleware, { before: 'restApi' });
    plugin.app.actions({
      ['workflows:trigger']: this.triggerAction,
    });
  }

  triggerAction = async (context, next) => {
    const { triggerWorkflows } = context.action.params;

    if (!triggerWorkflows) {
      return context.throw(400);
    }

    context.status = 202;
    await next();

    this.trigger(context.action.params);
  };

  middleware = async (context, next) => {
    await next();

    const { resourceName, actionName } = context.action;

    if (resourceName === 'workflows' && actionName === 'trigger') {
      return;
    }

    this.trigger(context.action.params);
  };

  async trigger({ triggerWorkflows, values }) {
    if (!triggerWorkflows) {
      return;
    }
    const triggers = triggerWorkflows.split(',').map((trigger) => trigger.split('!'));
    const workflowRepo = this.plugin.db.getRepository('workflows');
    const workflows = await workflowRepo.find({
      filter: {
        key: triggers.map((trigger) => trigger[0]),
        current: true,
        type: 'form',
        enabled: true,
      },
    });
    workflows.forEach((workflow) => {
      const trigger = triggers.find((trigger) => trigger[0] == workflow.key);
      this.plugin.trigger(workflow, { data: trigger[1] ? get(values, trigger[1]) : values });
    });
  }

  on(workflow: WorkflowModel) {}

  off(workflow: WorkflowModel) {}
}
