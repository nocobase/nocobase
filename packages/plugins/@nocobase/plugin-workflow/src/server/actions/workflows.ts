/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, utils } from '@nocobase/actions';
import { Op } from '@nocobase/database';

import Plugin from '../Plugin';
import Processor from '../Processor';
import WorkflowRepository from '../repositories/WorkflowRepository';

export async function update(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as WorkflowRepository;
  const { filterByTk, values } = context.action.params;
  context.action.mergeParams({
    whitelist: ['title', 'description', 'enabled', 'triggerTitle', 'config', 'options', 'categories'],
  });
  // only enable/disable
  if (Object.keys(values).includes('config')) {
    const workflow = await repository.findOne({
      filterByTk,
      appends: ['versionStats'],
    });
    if (workflow.versionStats.executed > 0) {
      return context.throw(400, 'config of executed workflow can not be updated');
    }
  }
  return actions.update(context, next);
}

export async function destroy(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as WorkflowRepository;
  const { filterByTk, filter } = context.action.params;

  await context.db.sequelize.transaction(async (transaction) => {
    const items = await repository.find({
      filterByTk,
      filter,
      fields: ['id', 'key', 'current'],
      transaction,
    });
    const ids = new Set<number>(items.map((item) => item.id));
    const keysSet = new Set<string>(items.filter((item) => item.current).map((item) => item.key));
    const revisions = await repository.find({
      filter: {
        key: Array.from(keysSet),
        current: { [Op.not]: true },
      },
      fields: ['id'],
      transaction,
    });

    revisions.forEach((item) => ids.add(item.id));

    const deleted = await repository.destroy({
      filterByTk: Array.from(ids),
      individualHooks: true,
      transaction,
    });
    const StatsRepo = context.db.getRepository('workflowStats');
    await StatsRepo.destroy({
      filter: {
        key: Array.from(keysSet),
      },
      transaction,
    });

    context.body = deleted;
  });

  next();
}

export async function revision(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as WorkflowRepository;
  const { filterByTk, filter = {}, values = {} } = context.action.params;

  context.body = await repository.revision({
    filterByTk,
    filter,
    values,
    context,
  });

  await next();
}

export async function sync(context: Context, next) {
  const plugin = context.app.getPlugin(Plugin);
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, filter = {} } = context.action.params;

  const workflows = await repository.find({
    filterByTk,
    filter,
  });

  workflows.forEach((workflow) => {
    plugin.toggle(workflow, false);
    plugin.toggle(workflow);
  });

  context.status = 204;

  await next();
}

/**
 * @deprecated
 * Keep for action trigger compatibility
 */
// export async function trigger(context: Context, next) {
//   return next();
// }

export async function execute(context: Context, next) {
  const plugin = context.app.pm.get(Plugin) as Plugin;
  const { filterByTk, values, autoRevision } = context.action.params;
  if (!values) {
    return context.throw(400, 'values is required');
  }
  if (!filterByTk) {
    return context.throw(400, 'filterByTk is required');
  }
  const id = Number.parseInt(filterByTk, 10);
  if (Number.isNaN(id)) {
    return context.throw(400, 'filterByTk is invalid');
  }
  const repository = utils.getRepositoryFromParams(context) as WorkflowRepository;
  const workflow = plugin.enabledCache.get(id) || (await repository.findOne({ filterByTk }));
  if (!workflow) {
    return context.throw(404, 'workflow not found');
  }
  const { executed } = workflow;
  let processor;
  try {
    processor = (await plugin.execute(workflow, values, { manually: true })) as Processor;
    if (!processor) {
      return context.throw(400, 'workflow not triggered');
    }
  } catch (ex) {
    return context.throw(400, ex.message);
  }
  context.action.mergeParams({
    filter: { key: workflow.key },
  });
  let newVersion;
  if (executed == 0 && autoRevision) {
    newVersion = await repository.revision({
      filterByTk: workflow.id,
      filter: { key: workflow.key },
      values: {
        current: workflow.current,
        enabled: workflow.enabled,
      },
      context,
    });
  }

  context.body = {
    execution: {
      id: processor.execution.id,
      status: processor.execution.status,
    },
    newVersionId: newVersion?.id,
  };

  return next();
}
