/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import PluginErrorHandler from '@nocobase/plugin-error-handler';
import WorkflowPluginServer, {
  EventOptions,
  EXECUTION_STATUS,
  Trigger,
  WorkflowModel,
} from '@nocobase/plugin-workflow';
import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';
import Application from '@nocobase/server';
import { get, pick } from 'lodash';
import { Context, Next } from '@nocobase/actions';
import { CONTEXT_TYPE, EVENT_TYPE } from '../common/constants';

type CustomActionTriggerEvent = [WorkflowModel, Record<string, any>?];

class CustomActionInterceptionError extends Error {
  status = 400;
  messages: any[] = [];
  constructor(message) {
    super(message);
    this.name = 'CustomActionInterceptionError';
  }
}

export default class CustomActionTrigger extends Trigger {
  static TYPE = EVENT_TYPE;

  async globalTriggerAction(context: Context, next: Next) {
    const { triggerWorkflows, values = {} } = context.action.params;

    const { currentUser, currentRole } = context.state;
    const { model: UserModel } = this.workflow.db.getCollection('users');
    const userInfo = {
      user: UserModel.build(currentUser).desensitize(),
      roleName: currentRole,
    };

    const triggerWorkflowsMap = new Map();
    const triggerWorkflowsArray = [];
    for (const trigger of triggerWorkflows.split(',')) {
      if (!trigger.trim()) {
        continue;
      }
      const [key, path] = trigger.split('!');
      triggerWorkflowsMap.set(key, path);
      triggerWorkflowsArray.push(key);
    }

    const enabledWorkflows = Array.from(this.workflow.enabledCache.values());
    const workflows = [];
    for (const key of triggerWorkflowsArray) {
      const workflow = enabledWorkflows.find((item) => item.key === key);
      if (
        workflow &&
        workflow.type === (<typeof CustomActionTrigger>this.constructor).TYPE &&
        (workflow.config?.type === CONTEXT_TYPE.GLOBAL || workflow.config?.type == null)
      ) {
        workflows.push(workflow);
      }
    }

    const syncGroup = [];
    const asyncGroup = [];
    for (const workflow of workflows) {
      const event: CustomActionTriggerEvent = [workflow];
      event.push({ data: values, ...userInfo });
      (workflow.sync ? syncGroup : asyncGroup).push(event);
    }

    await this.processEvents({
      events: [syncGroup, asyncGroup],
      context,
      next,
    });
  }

  triggerAction = async (context: Context, next: Next) => {
    const {
      resourceName,
      params: { filterByTk, values, triggerWorkflows = '', associatedIndex },
    } = context.action;

    if (!triggerWorkflows) {
      return context.throw(400, 'parameter "triggerWorkflows" is required');
    }

    if (resourceName === 'workflows') {
      return this.globalTriggerAction(context, next);
    }

    const { currentUser, currentRole } = context.state;
    const { model: UserModel } = this.workflow.db.getCollection('users');
    const userInfo = {
      user: UserModel.build(currentUser).desensitize(),
      roleName: currentRole,
    };

    const dataSourceHeader = context.get('x-data-source') || 'main';

    const { collectionManager } = (<Application>context.app).dataSourceManager.dataSources.get(dataSourceHeader) ?? {};
    if (!collectionManager) {
      return context.throw(400, 'Data source not found');
    }
    const repository = collectionManager.getRepository(resourceName, associatedIndex);
    const jointCollectionName = joinCollectionName(dataSourceHeader, repository.collection.name);

    const triggerWorkflowsMap = new Map();
    const triggerWorkflowsArray = [];
    for (const trigger of triggerWorkflows.split(',')) {
      if (!trigger.trim()) {
        continue;
      }
      const [key, path] = trigger.split('!');
      triggerWorkflowsMap.set(key, path);
      triggerWorkflowsArray.push(key);
    }

    const enabledWorkflows = Array.from(this.workflow.enabledCache.values());
    const workflows = [];
    for (const key of triggerWorkflowsArray) {
      const workflow = enabledWorkflows.find((item) => item.key === key);
      if (
        workflow &&
        workflow.type === (<typeof CustomActionTrigger>this.constructor).TYPE &&
        workflow.config?.collection === jointCollectionName
      ) {
        workflows.push(workflow);
      }
    }

    const syncGroup = [];
    const asyncGroup = [];
    for (const workflow of workflows) {
      const event: [WorkflowModel, Record<string, any>?] = [workflow];
      const { appends = [] } = workflow.config;
      const dataPath = triggerWorkflowsMap.get(workflow.key);
      const formData = dataPath ? get(values, dataPath) : values;
      let data = formData;
      if (filterByTk != null) {
        if (Array.isArray(filterByTk)) {
          data = (await repository.find({ filterByTk, appends, context })).map((item) =>
            Object.assign(item.toJSON(), formData),
          );
        } else {
          data = await repository.findOne({ filterByTk, appends, context });
          if (!data) {
            continue;
          }
          if (typeof data.toJSON === 'function') {
            data = data.toJSON();
            // NOTE: for edit form
            Object.assign(data, formData);
          }
        }
      }
      event.push({ data, ...userInfo });
      (workflow.sync ? syncGroup : asyncGroup).push(event);
    }

    await this.processEvents({
      events: [syncGroup, asyncGroup],
      context,
      next,
    });
  };

  constructor(workflow: WorkflowPluginServer) {
    super(workflow);

    this.workflow.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.registerActionHandler('trigger', this.triggerAction);
      // TODO: ACL on `:trigger` action
      // dataSource.acl.setAvailableAction('trigger', {
      //   displayName: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
      // });
      dataSource.acl.allow('*', ['trigger'], 'loggedIn');
    });

    (workflow.app.pm.get(PluginErrorHandler) as PluginErrorHandler).errorHandler.register(
      (err) => err.name === 'CustomActionInterceptionError',
      async (err, ctx) => {
        ctx.body = {
          errors: err.messages,
        };
        ctx.status = err.status;
      },
    );
  }

  private async processEvents({
    events: [syncGroup = [], asyncGroup = []],
    context,
    next,
  }: {
    events: [CustomActionTriggerEvent[], CustomActionTriggerEvent[]];
    context: Context;
    next: Next;
  }) {
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
          // NOTE: response will be set in data-wrapper middleware
          return;
        }
        continue;
      }
      // NOTE: intercept
      if (processor.execution.status < EXECUTION_STATUS.STARTED) {
        if (lastNode?.type !== 'end') {
          return context.throw(500, 'Workflow on your action failed, please contact the administrator');
        }

        const err = new CustomActionInterceptionError('Request is intercepted by workflow');
        err.status = 400;
        err.messages = context.state.messages;
        return context.throw(err.status, err);
      }
      // NOTE: should not be pending
      return context.throw(500, 'Workflow on your action hangs, please contact the administrator');
    }

    await next();

    for (const event of asyncGroup) {
      this.workflow.trigger(event[0], event[1]);
    }
  }

  validateContext(values, workflow: WorkflowModel) {
    const { type } = workflow.config;
    if (type === CONTEXT_TYPE.SINGLE_RECORD) {
      if (!values.data) {
        return {
          data: 'Data is required',
        };
      }
    }
    if (type === CONTEXT_TYPE.MULTIPLE_RECORDS) {
      if (!values.filterByTk?.length) {
        return {
          filterByTk: 'filterByTk is required',
        };
      }
    }
    return null;
  }

  async execute(workflow: WorkflowModel, values, options: EventOptions) {
    const UserRepo = this.workflow.app.db.getRepository('users');
    const actor = await UserRepo.findOne({
      filterByTk: values.userId,
      appends: ['roles'],
    });
    if (!actor) {
      throw new Error('user not found');
    }
    const { roles, ...user } = actor.desensitize().get();
    const userInfo = {
      user,
      roleName: values.roleName || roles?.[0]?.name,
    };

    let { data, filterByTk } = values;
    const { type, collection: jointCollectionName, appends } = workflow.config;
    if (!type) {
      return this.workflow.trigger(
        workflow,
        {
          data,
          ...userInfo,
        },
        options,
      );
    }

    const [dataSourceName, collectionName] = parseCollectionName(jointCollectionName);
    const dataSource = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceName} not found`);
    }
    const collection = dataSource.collectionManager.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    const { filterTargetKey, repository } = collection;

    if (type === CONTEXT_TYPE.MULTIPLE_RECORDS) {
      data = (await repository.find({ filterByTk, appends })).map((item) => item.toJSON());
    } else {
      let loadNeeded = false;
      if (data && typeof data === 'object') {
        filterByTk = collection.isMultiFilterTargetKey()
          ? pick(
              data,
              collection.filterTargetKey.sort((a, b) => a.localeCompare(b)),
            )
          : get(data, collection.filterTargetKey);
      } else {
        filterByTk = data;
        loadNeeded = true;
      }
      if (loadNeeded || appends?.length) {
        data = await repository.findOne({
          filterByTk,
          appends,
        });
      }
    }

    return this.workflow.trigger(
      workflow,
      {
        data,
        ...userInfo,
      },
      options,
    );
  }
}
