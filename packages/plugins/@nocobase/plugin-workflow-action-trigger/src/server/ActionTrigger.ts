import { get } from 'lodash';
import { BelongsTo, HasOne } from 'sequelize';
import { Model, modelAssociationByKey } from '@nocobase/database';
import Application, { DefaultContext } from '@nocobase/server';
import { Context as ActionContext, Next } from '@nocobase/actions';

import WorkflowPlugin, { Trigger, WorkflowModel, toJSON } from '@nocobase/plugin-workflow';
import { parseCollectionName } from '@nocobase/data-source-manager';

interface Context extends ActionContext, DefaultContext {}

export default class extends Trigger {
  constructor(workflow: WorkflowPlugin) {
    super(workflow);

    workflow.app.use(this.middleware, { after: 'dataSource' });
  }

  async triggerAction(context: Context, next: Next) {
    const { triggerWorkflows } = context.action.params;

    if (!triggerWorkflows) {
      return context.throw(400);
    }

    context.status = 202;
    await next();

    this.trigger(context);
  }

  middleware = async (context: Context, next: Next) => {
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

  private async trigger(context: Context) {
    const { triggerWorkflows = '', values } = context.action.params;
    const dataSourceHeader = context.get('x-data-source') || 'main';

    const { currentUser, currentRole } = context.state;
    const { model: UserModel } = this.workflow.db.getCollection('users');
    const userInfo = {
      user: UserModel.build(currentUser).desensitize(),
      roleName: currentRole,
    };

    const triggers = triggerWorkflows.split(',').map((trigger) => trigger.split('!'));
    const workflowRepo = this.workflow.db.getRepository('workflows');
    const workflows = (
      await workflowRepo.find({
        filter: {
          key: triggers.map((trigger) => trigger[0]),
          current: true,
          type: 'action',
          enabled: true,
        },
      })
    ).filter((workflow) => Boolean(workflow.config.collection));
    const syncGroup = [];
    const asyncGroup = [];
    for (const workflow of workflows) {
      const { collection, appends = [] } = workflow.config;
      const [dataSourceName, collectionName] = parseCollectionName(collection);
      const trigger = triggers.find((trigger) => trigger[0] == workflow.key);
      const event = [workflow];
      if (context.action.resourceName !== 'workflows') {
        if (!context.body) {
          continue;
        }
        if (dataSourceName !== dataSourceHeader) {
          continue;
        }
        const { body: data } = context;
        for (const row of Array.isArray(data) ? data : [data]) {
          let payload = row;
          if (trigger[1]) {
            const paths = trigger[1].split('.');
            for (const field of paths) {
              if (payload.get(field)) {
                payload = payload.get(field);
              } else {
                const association = <HasOne | BelongsTo>modelAssociationByKey(payload, field);
                payload = await payload[association.accessors.get]();
              }
            }
          }
          const model = payload.constructor;
          if (payload instanceof Model) {
            if (collectionName !== model.collection.name) {
              continue;
            }
            if (appends.length) {
              payload = await model.collection.repository.findOne({
                filterByTk: payload.get(model.primaryKeyAttribute),
                appends,
              });
            }
          }
          // this.workflow.trigger(workflow, { data: toJSON(payload), ...userInfo });
          event.push({ data: toJSON(payload), ...userInfo });
        }
      } else {
        const { model, repository } = (<Application>context.app).dataSourceManager.dataSources
          .get(dataSourceName)
          .collectionManager.getCollection(collectionName);
        let data = trigger[1] ? get(values, trigger[1]) : values;
        const pk = get(data, model.primaryKeyAttribute);
        if (appends.length && pk != null) {
          data = await repository.findOne({
            filterByTk: pk,
            appends,
          });
        }
        // this.workflow.trigger(workflow, {
        //   data,
        //   ...userInfo,
        // });
        event.push({ data, ...userInfo });
      }
      (workflow.sync ? syncGroup : asyncGroup).push(event);
    }

    for (const event of syncGroup) {
      await this.workflow.trigger(event[0], event[1], { httpContext: context });
    }

    for (const event of asyncGroup) {
      this.workflow.trigger(event[0], event[1]);
    }
  }

  on(workflow: WorkflowModel) {}

  off(workflow: WorkflowModel) {}
}
