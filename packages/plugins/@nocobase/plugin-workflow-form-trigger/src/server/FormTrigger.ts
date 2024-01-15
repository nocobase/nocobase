import { get } from 'lodash';
import { BelongsTo, HasOne } from 'sequelize';
import { Model, modelAssociationByKey } from '@nocobase/database';

import WorkflowPlugin, { Trigger, WorkflowModel, toJSON } from '@nocobase/plugin-workflow';

export default class extends Trigger {
  constructor(workflow: WorkflowPlugin) {
    super(workflow);

    workflow.app.resourcer.use(this.middleware);
  }

  async triggerAction(context, next) {
    const { triggerWorkflows } = context.action.params;

    if (!triggerWorkflows) {
      return context.throw(400);
    }

    context.status = 202;
    await next();

    this.trigger(context);
  }

  middleware = async (context, next) => {
    const {
      resourceName,
      actionName,
      params: { triggerWorkflows },
    } = context.action;

    if (resourceName === 'workflows' && actionName === 'trigger') {
      return this.triggerAction(context, next);
    }

    await next();

    if (!triggerWorkflows) {
      return;
    }

    if (!['create', 'update'].includes(actionName)) {
      return;
    }

    this.trigger(context);
  };

  private async trigger(context) {
    const { triggerWorkflows = '', values } = context.action.params;

    const { currentUser, currentRole } = context.state;
    const userInfo = {
      user: toJSON(currentUser),
      roleName: currentRole,
    };

    const triggers = triggerWorkflows.split(',').map((trigger) => trigger.split('!'));
    const workflowRepo = this.workflow.db.getRepository('workflows');
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
      if (context.body?.data) {
        const { data } = context.body;
        (Array.isArray(data) ? data : [data]).forEach(async (row: Model) => {
          let payload = row;
          if (trigger[1]) {
            const paths = trigger[1].split('.');
            for await (const field of paths) {
              if (payload.get(field)) {
                payload = payload.get(field);
              } else {
                const association = <HasOne | BelongsTo>modelAssociationByKey(payload, field);
                payload = await payload[association.accessors.get]();
              }
            }
          }
          const { collection, appends = [] } = workflow.config;
          const model = <typeof Model>payload.constructor;
          if (collection !== model.collection.name) {
            return;
          }
          if (appends.length) {
            payload = await model.collection.repository.findOne({
              filterByTk: payload.get(model.primaryKeyAttribute),
              appends,
            });
          }
          this.workflow.trigger(workflow, { data: toJSON(payload), ...userInfo });
        });
      } else {
        const data = trigger[1] ? get(values, trigger[1]) : values;
        this.workflow.trigger(workflow, {
          data,
          ...userInfo,
        });
      }
    });
  }

  on(workflow: WorkflowModel) {}

  off(workflow: WorkflowModel) {}
}
