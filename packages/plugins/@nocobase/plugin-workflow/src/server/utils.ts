/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { EXECUTION_STATUS } from './constants';
import type { WorkflowModel } from './types';
import Processor from './Processor';

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
