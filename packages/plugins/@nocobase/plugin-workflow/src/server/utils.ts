/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transaction } from '@nocobase/database';
import { parseCollectionName } from '@nocobase/data-source-manager';
import type { DataSourceManager } from '@nocobase/data-source-manager';
import type PluginWorkflowServer from './Plugin';
import { EXECUTION_STATUS, JOB_STATUS } from './constants';
import type { ExecutionModel, JobModel, WorkflowModel } from './types';
import Processor from './Processor';

type AbortOptions = {
  transaction?: Transaction;
};

export function validateCollectionField(
  collection: string,
  dataSourceManager: DataSourceManager,
): Record<string, string> | null {
  const [dataSourceName, collectionName] = parseCollectionName(collection);
  if (collection.includes(':')) {
    const parts = collection.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { collection: `"collection" must be in the format "dataSourceName:collectionName"` };
    }
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
  const ownTransaction = !options.transaction;
  const transaction = options.transaction ?? (await plugin.useDataSourceTransaction('main', null, true));
  const ExecutionModelClass = plugin.db.getModel('executions');
  const JobRepo = plugin.db.getRepository('jobs');

  try {
    const [affected] = await ExecutionModelClass.update(
      {
        status: EXECUTION_STATUS.ABORTED,
      },
      {
        where: {
          id: execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        transaction,
      },
    );

    if (!affected) {
      if (ownTransaction) {
        await transaction.commit();
      }
      return false;
    }

    const pendingJobs = await JobRepo.find({
      filter: {
        executionId: execution.id,
        status: JOB_STATUS.PENDING,
      },
      transaction,
    });

    if (pendingJobs.length) {
      await JobRepo.update({
        values: {
          status: JOB_STATUS.ABORTED,
        },
        filter: {
          id: pendingJobs.map((job: JobModel) => job.id),
        },
        individualHooks: false,
        transaction,
      });
    }

    const childExecutions = await plugin.db.getRepository('executions').find({
      filter: {
        parentExecutionId: execution.id,
        status: EXECUTION_STATUS.STARTED,
      },
      transaction,
    });

    for (const child of childExecutions) {
      await abortExecution(plugin, child, { transaction });
    }

    execution.set('status', EXECUTION_STATUS.ABORTED);
    plugin.timeoutManager.clear(execution.id);
    plugin.abortRunningExecution(execution.id);

    logger.info(`execution (${execution.id}) aborted`, {
      workflowId: execution.workflowId,
      pendingJobs: pendingJobs.length,
    });

    if (ownTransaction) {
      await transaction.commit();
    }

    return true;
  } catch (error) {
    if (ownTransaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

export function toJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}
