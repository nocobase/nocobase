import { get } from 'lodash';

import { Trigger } from '.';
import Plugin from '..';
import { WorkflowModel } from '../types';

export default class FormTrigger extends Trigger {
  constructor(plugin: Plugin) {
    super(plugin);

    plugin.app.resourcer.use(this.middleware);
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

    this.trigger(context);
  };

  middleware = async (context, next) => {
    await next();

    const { resourceName, actionName } = context.action;

    if ((resourceName === 'workflows' && actionName === 'trigger') || !['create', 'update'].includes(actionName)) {
      return;
    }

    this.trigger(context);
  };

  async trigger(context) {
    const { triggerWorkflows, values } = context.action.params;
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
      const payload = context.body?.data ?? values;
      if (Array.isArray(payload)) {
        payload.forEach((row) => {
          this.plugin.trigger(workflow, { data: trigger[1] ? get(row, trigger[1]) : row });
        });
      } else {
        this.plugin.trigger(workflow, { data: trigger[1] ? get(payload, trigger[1]) : payload });
      }
    });
  }

  on(workflow: WorkflowModel) {}

  off(workflow: WorkflowModel) {}
}
