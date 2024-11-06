/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get } from 'lodash';
import { BelongsTo, HasOne } from 'sequelize';
import { Model, modelAssociationByKey } from '@nocobase/database';
import Application, { DefaultContext } from '@nocobase/server';
import { Context as ActionContext, Next } from '@nocobase/actions';

import WorkflowPlugin, { Trigger, WorkflowModel, toJSON } from '@nocobase/plugin-workflow';
import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';

interface Context extends ActionContext, DefaultContext {}

export default class extends Trigger {
  static TYPE = 'action';

  constructor(workflow: WorkflowPlugin) {
    super(workflow);

    const self = this;

    async function triggerWorkflowActionMiddleware(context: Context, next: Next) {
      const { resourceName, actionName } = context.action;

      if (resourceName === 'workflows' && actionName === 'trigger') {
        return self.workflowTriggerAction(context, next);
      }

      await next();

      if (!['create', 'update'].includes(actionName)) {
        return;
      }

      return self.collectionTriggerAction(context);
    }

    workflow.app.dataSourceManager.use(triggerWorkflowActionMiddleware);
  }

  /**
   * @deprecated
   */
  async workflowTriggerAction(context: Context, next: Next) {
    const { triggerWorkflows } = context.action.params;

    if (!triggerWorkflows) {
      return context.throw(400);
    }

    context.status = 202;
    await next();

    return this.collectionTriggerAction(context);
  }

  private async collectionTriggerAction(context: Context) {
    const {
      resourceName,
      actionName,
      params: { triggerWorkflows = '', values },
    } = context.action;
    const dataSourceHeader = context.get('x-data-source') || 'main';
    const collection = context.app.dataSourceManager.dataSources
      .get(dataSourceHeader)
      .collectionManager.getCollection(resourceName);

    if (!collection) {
      return;
    }

    const fullCollectionName = joinCollectionName(dataSourceHeader, collection.name);
    const { currentUser, currentRole } = context.state;
    const { model: UserModel } = this.workflow.db.getCollection('users');
    const userInfo = {
      user: UserModel.build(currentUser).desensitize(),
      roleName: currentRole,
    };

    const triggers = triggerWorkflows.split(',').map((trigger) => trigger.split('!'));
    const triggersKeysMap = new Map<string, string>(triggers);
    const workflows = Array.from(this.workflow.enabledCache.values()).filter(
      (item) => item.type === 'action' && item.config.collection,
    );
    const globalWorkflows = new Map();
    const localWorkflows = new Map();
    workflows.forEach((item) => {
      if (resourceName === 'workflows' && actionName === 'trigger') {
        localWorkflows.set(item.key, item);
      } else if (item.config.collection === fullCollectionName) {
        if (item.config.global) {
          if (item.config.actions?.includes(actionName)) {
            globalWorkflows.set(item.key, item);
          }
        } else {
          localWorkflows.set(item.key, item);
        }
      }
    });
    const triggeringLocalWorkflows = [];
    const uniqueTriggersMap = new Map();
    triggers.forEach((trigger) => {
      const [key] = trigger;
      const workflow = localWorkflows.get(key);
      if (workflow && !uniqueTriggersMap.has(key)) {
        triggeringLocalWorkflows.push(workflow);
        uniqueTriggersMap.set(key, true);
      }
    });
    const syncGroup = [];
    const asyncGroup = [];
    for (const workflow of triggeringLocalWorkflows.concat(...globalWorkflows.values())) {
      const { appends = [] } = workflow.config;
      const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
      const dataPath = triggersKeysMap.get(workflow.key);
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
          if (dataPath) {
            const paths = dataPath.split('.');
            for (const field of paths) {
              if (!payload) {
                break;
              }
              if (payload.get(field)) {
                payload = payload.get(field);
              } else {
                const association = <HasOne | BelongsTo>modelAssociationByKey(payload, field);
                payload = await payload[association.accessors.get]();
              }
            }
          }
          if (payload instanceof Model) {
            const model = payload.constructor as unknown as Model;
            if (collectionName !== model.collection.name) {
              continue;
            }
            if (appends.length) {
              payload = await model.collection.repository.findOne({
                filterByTk: payload.get(model.collection.filterTargetKey),
                appends,
              });
            }
          }
          event.push({ data: toJSON(payload), ...userInfo });
        }
      } else {
        const { filterTargetKey, repository } = (<Application>context.app).dataSourceManager.dataSources
          .get(dataSourceName)
          .collectionManager.getCollection(collectionName);
        let data = dataPath ? get(values, dataPath) : values;
        const pk = get(data, filterTargetKey);
        if (appends.length && pk != null) {
          data = await repository.findOne({
            filterByTk: pk,
            appends,
          });
        }
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
