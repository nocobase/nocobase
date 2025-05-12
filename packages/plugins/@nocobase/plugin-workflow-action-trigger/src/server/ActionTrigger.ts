/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get, pick } from 'lodash';
import { BelongsTo, HasOne } from 'sequelize';
import { Collection, Model, modelAssociationByKey } from '@nocobase/database';
import Application, { DefaultContext } from '@nocobase/server';
import { Context as ActionContext, Next } from '@nocobase/actions';
import PluginErrorHandler from '@nocobase/plugin-error-handler';

import WorkflowPlugin, {
  EXECUTION_STATUS,
  EventOptions,
  Trigger,
  WorkflowModel,
  toJSON,
} from '@nocobase/plugin-workflow';
import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';

interface Context extends ActionContext, DefaultContext {}

class RequestOnActionTriggerError extends Error {
  status = 400;
  messages: any[] = [];
  constructor(message) {
    super(message);
    this.name = 'RequestOnActionTriggerError';
  }
}

export default class extends Trigger {
  static TYPE = 'action';

  constructor(workflow: WorkflowPlugin) {
    super(workflow);

    const self = this;

    async function triggerWorkflowActionMiddleware(context: Context, next: Next) {
      await next();

      const { actionName } = context.action;

      if (!['create', 'update'].includes(actionName)) {
        return;
      }

      return self.collectionTriggerAction(context);
    }

    workflow.app.dataSourceManager.use(triggerWorkflowActionMiddleware);

    workflow.app.pm.get(PluginErrorHandler).errorHandler.register(
      (err) => err instanceof RequestOnActionTriggerError || err.name === 'RequestOnActionTriggerError',
      async (err, ctx) => {
        ctx.body = {
          errors: err.messages,
        };
        ctx.status = err.status;
      },
    );
  }

  getTargetCollection(collection: Collection, association: string) {
    if (!association) {
      return collection;
    }

    let targetCollection = collection;
    for (const key of association.split('.')) {
      targetCollection = collection.db.getCollection(targetCollection.getField(key).target);
    }

    return targetCollection;
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

    const { currentUser, currentRole } = context.state;
    const { model: UserModel } = this.workflow.db.getCollection('users');
    const userInfo = {
      user: UserModel.build(currentUser).desensitize().toJSON(),
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
      const targetCollection = this.getTargetCollection(collection, triggersKeysMap.get(item.key));
      if (item.config.collection === joinCollectionName(dataSourceHeader, targetCollection.name)) {
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
          (workflow.sync ? syncGroup : asyncGroup).push([workflow, { data: toJSON(payload), ...userInfo }]);
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
        (workflow.sync ? syncGroup : asyncGroup).push([workflow, { data, ...userInfo }]);
      }
    }

    for (const event of syncGroup) {
      const processor = await this.workflow.trigger(event[0], event[1], { httpContext: context });

      // NOTE: workflow trigger failed
      if (!processor) {
        return context.throw(500);
      }

      const { lastSavedJob, nodesMap } = processor;
      const lastNode = nodesMap.get(lastSavedJob?.nodeId);
      // NOTE: passthrough
      if (processor.execution.status === EXECUTION_STATUS.RESOLVED) {
        if (lastNode?.type === 'end') {
          return;
        }
        continue;
      }
      // NOTE: intercept
      if (processor.execution.status < EXECUTION_STATUS.STARTED) {
        if (lastNode?.type !== 'end') {
          return context.throw(500, 'Workflow on your action failed, please contact the administrator');
        }

        const err = new RequestOnActionTriggerError('Request failed');
        err.status = 400;
        err.messages = context.state.messages;
        return context.throw(err.status, err);
      }
      // NOTE: should not be pending
      return context.throw(500, 'Workflow on your action hangs, please contact the administrator');
    }

    for (const event of asyncGroup) {
      this.workflow.trigger(event[0], event[1]);
    }
  }

  async execute(workflow: WorkflowModel, values, options: EventOptions) {
    // const { values } = context.action.params;
    const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    const { filterTargetKey, repository } = collectionManager.getCollection(collectionName);

    let { data } = values;
    let filterByTk;
    let loadNeeded = false;
    if (data && typeof data === 'object') {
      filterByTk = Array.isArray(filterTargetKey)
        ? pick(
            data,
            filterTargetKey.sort((a, b) => a.localeCompare(b)),
          )
        : data[filterTargetKey];
    } else {
      filterByTk = data;
      loadNeeded = true;
    }
    const UserRepo = this.workflow.app.db.getRepository('users');
    const actor = await UserRepo.findOne({
      filterByTk: values.userId,
      appends: ['roles'],
    });
    if (!actor) {
      throw new Error('user not found');
    }
    const { roles, ...user } = actor.desensitize().get();
    const roleName = values.roleName || roles?.[0]?.name;

    if (loadNeeded || workflow.config.appends?.length) {
      data = await repository.findOne({
        filterByTk,
        appends: workflow.config.appends,
      });
    }
    return this.workflow.trigger(
      workflow,
      {
        data,
        user,
        roleName,
      },
      options,
    );
  }

  validateContext(values) {
    if (!values.data) {
      return {
        data: 'Data is required',
      };
    }

    if (!values.userId) {
      return {
        userId: 'UserId is required',
      };
    }

    return null;
  }
}
