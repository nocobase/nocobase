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

    return this.trigger(context);
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
    const syncGroup = [];
    const asyncGroup = [];
    for (const workflow of workflows) {
      const trigger = triggers.find((trigger) => trigger[0] == workflow.key);
      const event = [workflow];
      if (context.action.resourceName !== 'workflows') {
        if (!context.body) {
          continue;
        }
        const { body: data } = context;
        for (const row of Array.isArray(data) ? data : [data]) {
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
            continue;
          }
          if (appends.length) {
            payload = await model.collection.repository.findOne({
              filterByTk: payload.get(model.primaryKeyAttribute),
              appends,
            });
          }
          // this.workflow.trigger(workflow, { data: toJSON(payload), ...userInfo });
          event.push({ data: toJSON(payload), ...userInfo });
        }
      } else {
        const data = trigger[1] ? get(values, trigger[1]) : values;
        // this.workflow.trigger(workflow, {
        //   data,
        //   ...userInfo,
        // });
        event.push({ data, ...userInfo });
      }
      (workflow.sync ? syncGroup : asyncGroup).push(event);
    }

    for (const event of syncGroup) {
      await this.workflow.trigger(event[0], event[1]);
      // if (processor.execution.status < EXECUTION_STATUS.STARTED) {
      //   // error handling
      //   return context.throw(
      //     500,
      //     'Your data saved, but some workflow on your action failed, please contact the administrator.',
      //   );
      // }
    }

    for (const event of asyncGroup) {
      this.workflow.trigger(event[0], event[1]);
    }
  }

  on(workflow: WorkflowModel) {}

  off(workflow: WorkflowModel) {}
}
