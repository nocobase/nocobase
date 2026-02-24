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

import { pick } from 'lodash';

import PluginErrorHandler from '@nocobase/plugin-error-handler';
import { EventOptions, EXECUTION_STATUS, Trigger, WorkflowModel } from '@nocobase/plugin-workflow';
import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';
import { INTERCEPTABLE_ACTIONS } from '../common/constants';

class RequestInterceptionError extends Error {
  status = 400;
  messages: any[] = [];
  constructor(message) {
    super(message);
    this.name = 'RequestInterceptionError';
  }
}

export default class RequestInterceptionTrigger extends Trigger {
  static TYPE = 'request-interception';

  sync = true;

  middleware = async (context, next) => {
    const {
      resourceName,
      actionName,
      params: { filterByTk, filter, values, triggerWorkflows = '' },
    } = context.action;

    const dataSourceHeader = context.get('x-data-source') || 'main';
    const dataSource = context.app.dataSourceManager.dataSources.get(dataSourceHeader);
    if (!dataSource) {
      context.logger.warn(`[Workflow pre-action]: data source "${dataSourceHeader}" not found`);
      return next();
    }

    const collection = dataSource.collectionManager.getCollection(resourceName);

    if (!collection) {
      context.logger.warn(`[Workflow pre-action]: collection "${resourceName}" not found`);
      return next();
    }

    const fullCollectionName = joinCollectionName(dataSourceHeader, collection.name);

    const triggerWorkflowsMap = new Map();
    const triggerWorkflowsArray = [];
    for (const trigger of triggerWorkflows.split(',')) {
      const [key, path] = trigger.split('!');
      triggerWorkflowsMap.set(key, path);
      triggerWorkflowsArray.push(key);
    }

    const workflows = Array.from(this.workflow.enabledCache.values()).filter(
      (item) =>
        item.type === (<typeof RequestInterceptionTrigger>this.constructor).TYPE &&
        item.config.collection === fullCollectionName,
    );

    const globalWorkflows = workflows
      .filter((item) => item.config.global && item.config.actions?.includes(actionName))
      .sort((a, b) => a.id - b.id);
    const localWorkflows = workflows
      .filter((item) => !item.config.global)
      .sort((a, b) => {
        const aIndex = triggerWorkflowsArray.indexOf(a.key);
        const bIndex = triggerWorkflowsArray.indexOf(b.key);
        if (aIndex === -1 && bIndex === -1) {
          return a.id - b.id;
        }
        if (aIndex === -1) {
          return 1;
        }
        if (bIndex === -1) {
          return -1;
        }
        return aIndex - bIndex;
      });

    for (const workflow of localWorkflows.concat(globalWorkflows)) {
      if (!workflow.config.global && !triggerWorkflowsMap.has(workflow.key)) {
        continue;
      }

      const processor = await this.workflow.trigger(
        workflow,
        {
          user: context.state.currentUser,
          roleName: context.state.currentRole,
          params: {
            filterByTk,
            filter,
            values,
          },
        },
        { httpContext: context },
      );
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

        const err = new RequestInterceptionError('Request is intercepted by workflow');
        err.status = 400;
        err.messages = context.state.messages;
        return context.throw(err.status, err);
      }
      // NOTE: should not be pending
      return context.throw(500, 'Workflow on your action hangs, please contact the administrator');
    }

    await next();
  };

  constructor(workflow) {
    super(workflow);

    workflow.app.dataSourceManager.use(this.middleware);

    workflow.app.pm.get(PluginErrorHandler).errorHandler.register(
      (err) => err instanceof RequestInterceptionError || err.name === 'RequestInterceptionError',
      async (err, ctx, next) => {
        ctx.body = {
          errors: err.messages,
        };
        ctx.status = err.status;
      },
    );
  }

  validateContext(values) {
    if (!values.target) {
      return {
        target: 'Target data or key is required',
      };
    }
    if (!values.userId) {
      return {
        userId: 'UserId is required',
      };
    }
    return null;
  }

  async execute(workflow: WorkflowModel, values, options: EventOptions) {
    const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
    const dataSource = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceName} not found`);
    }
    const collection = dataSource.collectionManager.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    const { filterTargetKey, repository } = collection;
    let { target } = values;
    let filterByTk;
    let loadNeeded = false;
    if (target && typeof target === 'object') {
      filterByTk = Array.isArray(filterTargetKey) ? pick(target, filterTargetKey) : target[filterTargetKey];
    } else {
      filterByTk = target;
      loadNeeded = true;
    }
    if (loadNeeded) {
      target = await repository.findOne({
        filterByTk,
      });
    }
    const params = values.action === INTERCEPTABLE_ACTIONS.DESTROY ? { filterByTk } : { values: target };
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

    return this.workflow.trigger(
      workflow,
      {
        params,
        user,
        roleName,
      },
      options,
    );
  }
}
