/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { parseCollectionName } from '@nocobase/data-source-manager';
import type { DataSourceManager } from '@nocobase/data-source-manager';
import { EXECUTION_STATUS } from './constants';
import type { WorkflowModel } from './types';
import Processor from './Processor';

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
