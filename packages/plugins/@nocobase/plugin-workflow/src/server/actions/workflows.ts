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

export class WorkflowValidationError extends Error {
  status = 400;
  errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super('Workflow validation failed');
    this.name = 'WorkflowValidationError';
    this.errors = errors;
  }
}

const LEGACY_APPROVAL_UI_APPEND = 'legacyApprovalUi';

type WorkflowRowLike = {
  config?: Record<string, unknown>;
  get?: (key: string) => unknown;
  id?: number | string;
  setDataValue?: (key: string, value: unknown) => void;
  type?: string;
};

function normalizeAppends(appends: unknown): string[] {
  if (Array.isArray(appends)) {
    return appends.filter((append): append is string => typeof append === 'string');
  }
  return typeof appends === 'string' ? [appends] : [];
}

function removeLegacyApprovalUiAppend(context: Context) {
  const appends = normalizeAppends(context.action.params?.appends);
  if (!appends.includes(LEGACY_APPROVAL_UI_APPEND)) {
    return false;
  }

  context.action.mergeParams({
    appends: appends.filter((append) => append !== LEGACY_APPROVAL_UI_APPEND),
  });

  return true;
}

function getListRows(context: Context): WorkflowRowLike[] {
  if (Array.isArray(context.body)) {
    return context.body;
  }
  if (Array.isArray(context.body?.rows)) {
    return context.body.rows;
  }
  return [];
}

function getRecordValue(record: WorkflowRowLike, key: string) {
  return typeof record.get === 'function' ? record.get(key) : record[key];
}

function setRecordValue(record: WorkflowRowLike, key: string, value: unknown) {
  if (typeof record.setDataValue === 'function') {
    record.setDataValue(key, value);
    return;
  }
  record[key] = value;
}

function getRecordId(record: WorkflowRowLike) {
  const id = getRecordValue(record, 'id');
  return typeof id === 'number' || typeof id === 'string' ? id : null;
}

function hasConfigValue(config: unknown, key: string) {
  return Boolean(config && typeof config === 'object' && !Array.isArray(config) && config[key]);
}

async function appendLegacyApprovalUi(context: Context) {
  const rows = getListRows(context);
  rows.forEach((row) => {
    setRecordValue(row, LEGACY_APPROVAL_UI_APPEND, {
      initiator: false,
      approver: false,
    });
  });

  const workflowIds = rows.map(getRecordId).filter((id): id is number | string => id != null);
  if (!workflowIds.length) {
    return;
  }

  const workflows = await context.db.getRepository('workflows').find({
    fields: ['id', 'type', 'config'],
    filter: {
      id: {
        $in: workflowIds,
      },
    },
  });
  const initiatorWorkflowIds = new Set<string>();
  const approvalWorkflowIds = new Set<number | string>();

  workflows.forEach((workflow: WorkflowRowLike) => {
    const workflowId = getRecordId(workflow);
    if (workflowId == null || getRecordValue(workflow, 'type') !== 'approval') {
      return;
    }
    approvalWorkflowIds.add(workflowId);
    if (hasConfigValue(getRecordValue(workflow, 'config'), 'applyForm')) {
      initiatorWorkflowIds.add(String(workflowId));
    }
  });

  const approverWorkflowIds = new Set<string>();
  if (approvalWorkflowIds.size) {
    const nodes = await context.db.getRepository('flow_nodes').find({
      fields: ['workflowId', 'config'],
      filter: {
        type: 'approval',
        workflowId: {
          $in: Array.from(approvalWorkflowIds),
        },
      },
    });

    nodes.forEach((node: WorkflowRowLike & { workflowId?: number | string }) => {
      const workflowId = getRecordValue(node, 'workflowId');
      if (
        (typeof workflowId === 'number' || typeof workflowId === 'string') &&
        hasConfigValue(getRecordValue(node, 'config'), 'applyDetail')
      ) {
        approverWorkflowIds.add(String(workflowId));
      }
    });
  }

  rows.forEach((row) => {
    const workflowId = getRecordId(row);
    setRecordValue(row, LEGACY_APPROVAL_UI_APPEND, {
      initiator: workflowId == null ? false : initiatorWorkflowIds.has(String(workflowId)),
      approver: workflowId == null ? false : approverWorkflowIds.has(String(workflowId)),
    });
  });
}

function validateWorkflow(
  context: Context,
  plugin: Plugin,
  { type, config }: { type?: string; config?: Record<string, any> },
) {
  if (!type) {
    context.throw(400, 'Trigger type is required');
  }
  const trigger = plugin.triggers.get(type);
  if (!trigger) {
    context.throw(400, `Trigger type "${type}" is not registered`);
  }
  if (config && typeof trigger.validateConfig === 'function') {
    const errors = trigger.validateConfig(config);
    if (errors) {
      throw new WorkflowValidationError(errors);
    }
  }
}

export async function list(context: Context, next) {
  const shouldAppendLegacyApprovalUi = removeLegacyApprovalUiAppend(context);

  await actions.list(context, async () => {});

  if (shouldAppendLegacyApprovalUi) {
    await appendLegacyApprovalUi(context);
  }

  await next();
}

export async function create(context: Context, next) {
  const plugin = context.app.pm.get(Plugin) as Plugin;
  const { values } = context.action.params;

  validateWorkflow(context, plugin, values);

  return actions.create(context, next);
}

export async function update(context: Context, next) {
  const plugin = context.app.pm.get(Plugin) as Plugin;
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

    const type = values.type ?? workflow.type;
    const config = values.config ?? workflow.config;
    validateWorkflow(context, plugin, { type, config });
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
