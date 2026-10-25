/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transaction, Transactionable } from '@nocobase/database';
import type { Context } from '@nocobase/actions';
import { parseCollectionName } from '@nocobase/data-source-manager';
import type { DataSourceManager } from '@nocobase/data-source-manager';
import type PluginWorkflowServer from './Plugin';
import { EXECUTION_REASON, EXECUTION_STATUS, JOB_STATUS } from './constants';
import type { ExecutionModel, WorkflowModel } from './types';
import Processor from './Processor';

export function sanitizeWorkflowTaskReadParams(context: Context) {
  const associations = {
    user: 'users',
    node: 'flow_nodes',
    job: 'jobs',
    workflow: 'workflows',
    'workflow.nodes': 'flow_nodes',
    execution: 'executions',
    'execution.jobs': 'jobs',
  };
  const allowed = new Set(Object.keys(context.db.getCollection(context.action.resourceName).model.rawAttributes));
  for (const [path, collectionName] of Object.entries(associations)) {
    allowed.add(path);
    for (const field of Object.keys(context.db.getCollection(collectionName).model.rawAttributes)) {
      allowed.add(`${path}.${field}`);
    }
  }

  // Restrict complete paths: allowing arbitrary descendants of workflow or execution exposes other executions.
  const { appends, fields } = context.action.params;
  const filteredAppends = Array.isArray(appends)
    ? appends.filter((path: unknown) => typeof path === 'string' && allowed.has(path))
    : [];
  if (Array.isArray(fields)) {
    const filtered = Array.from(
      new Set(fields.filter((path: unknown) => typeof path === 'string' && allowed.has(path))),
    );
    context.action.params.fields = filtered.length ? filtered : ['id'];
  }
  // Association fields also become appends in the repository; selecting a path twice fails with the MariaDB driver.
  const selectedFields = new Set(context.action.params.fields || []);
  context.action.params.appends = Array.from(new Set(filteredAppends)).filter((path) => !selectedFields.has(path));
}

type AbortOptions = Transactionable & {
  reason?: (typeof EXECUTION_REASON)[keyof typeof EXECUTION_REASON];
};

export function getExecutionLockKey(executionId: number | string) {
  return `workflow:execution:${executionId}`;
}

export function getJobLockKey(jobId: number | string) {
  return `workflow:job:${jobId}`;
}

export function isLockAcquireError(error: unknown) {
  return error instanceof Error && error.constructor.name === 'LockAcquireError';
}

function afterTransactionCommit(transaction: Transaction, callback: () => void) {
  if (typeof (transaction as any).afterCommit === 'function') {
    (transaction as any).afterCommit(callback);
    return;
  }

  callback();
}

export function validateCollectionField(
  collection: string,
  dataSourceManager: DataSourceManager,
): Record<string, string> | null {
  const [dataSourceName, collectionName] = parseCollectionName(collection);
  if (!dataSourceName || !collectionName) {
    return { collection: `"collection" must be in the format "dataSourceName:collectionName"` };
  }

  const dataSource = dataSourceManager.dataSources.get(dataSourceName);
  if (!dataSource) {
    return { collection: `Data source "${dataSourceName}" does not exist` };
  }

  if (!dataSource.collectionManager.getCollection(collectionName)) {
    return { collection: `Collection "${collectionName}" does not exist in data source "${dataSourceName}"` };
  }

  return null;
}

const EXECUTION_STATUS_NAMES = new Map(Object.entries(EXECUTION_STATUS).map(([name, value]) => [value, name]));

export function getExecutionStatusName(status: number | null | undefined) {
  if (typeof status === 'undefined') {
    return 'UNKNOWN';
  }

  return EXECUTION_STATUS_NAMES.get(status) ?? `${status}`;
}

export function getWorkflowExecutionLogMeta(workflow: WorkflowModel, processor?: Processor) {
  const lastSavedJob = processor?.lastSavedJob;
  const lastNode = processor?.nodesMap?.get(lastSavedJob?.nodeId);

  return {
    workflowId: workflow.id,
    workflowKey: workflow.key,
    workflowTitle: workflow.title,
    executionId: processor?.execution?.id ?? null,
    executionStatus: processor?.execution?.status ?? null,
    executionStatusName: getExecutionStatusName(processor?.execution?.status),
    lastNodeId: lastNode?.id ?? lastSavedJob?.nodeId ?? null,
    lastNodeType: lastNode?.type ?? null,
    lastJobId: lastSavedJob?.id ?? null,
    lastJobStatus: lastSavedJob?.status ?? null,
  };
}

export async function abortExecution(
  plugin: PluginWorkflowServer,
  execution: ExecutionModel,
  options: AbortOptions = {},
): Promise<boolean> {
  const logger = plugin.getLogger(execution.workflowId);
  const transaction = options.transaction ?? undefined;
  const ExecutionRepo = plugin.db.getRepository('executions');
  const JobRepo = plugin.db.getRepository('jobs');

  try {
    if (!transaction) {
      return plugin.db.sequelize.transaction((transaction) =>
        abortExecution(plugin, execution, {
          ...options,
          transaction,
        }),
      );
    }

    const abortValues = {
      status: EXECUTION_STATUS.ABORTED,
      ...(options.reason
        ? {
            reason: options.reason,
          }
        : {}),
    };

    const expectedStatus =
      typeof execution.status === 'undefined' ? EXECUTION_STATUS.STARTED : (execution.status as number | null);

    if (![EXECUTION_STATUS.QUEUEING, EXECUTION_STATUS.STARTED].includes(expectedStatus)) {
      return false;
    }

    const [affected] = await ExecutionRepo.model.update(abortValues, {
      where: {
        id: execution.id,
        status: expectedStatus,
      },
      individualHooks: true,
      transaction,
    });

    if (!affected) {
      return false;
    }

    const updated = await JobRepo.update({
      values: {
        status: JOB_STATUS.ABORTED,
      },
      filter: {
        executionId: execution.id,
        status: JOB_STATUS.PENDING,
      },
      individualHooks: false,
      transaction,
    });

    const childExecutions = await plugin.db.getRepository('executions').find({
      filter: {
        parentExecutionId: execution.id,
        status: [EXECUTION_STATUS.QUEUEING, EXECUTION_STATUS.STARTED],
      },
      transaction,
    });

    for (const child of childExecutions) {
      if (![EXECUTION_STATUS.QUEUEING, EXECUTION_STATUS.STARTED].includes(child.status)) {
        continue;
      }
      await abortExecution(plugin, child, { transaction, reason: EXECUTION_REASON.PARENT_ABORTED });
    }

    const updateLocalState = () => {
      execution.set('status', EXECUTION_STATUS.ABORTED);
      execution.set('reason', options.reason ?? null);
      plugin.timeoutManager.clear(execution.id);
      plugin.abortRunningExecution(execution.id, options.reason);
    };
    afterTransactionCommit(transaction, updateLocalState);

    logger.info(`execution (${execution.id}) aborted`, {
      workflowId: execution.workflowId,
      pendingJobs: Array.isArray(updated) ? updated.length : updated,
    });

    return true;
  } catch (error) {
    throw error;
  }
}

function getHiddenFieldNames(model: Model) {
  const { collection } = model.constructor as typeof Model;
  if (!collection?.fields) {
    return [];
  }

  return Array.from(collection.fields.values())
    .filter((field) => field?.options?.hidden)
    .map((field) => field.options.name)
    .filter((name): name is string => typeof name === 'string');
}

export function toJSON<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(toJSON) as T;
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }

  const result = { ...(data.get() as Record<string, unknown>) };
  for (const fieldName of getHiddenFieldNames(data)) {
    delete result[fieldName];
  }

  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result as T;
}
