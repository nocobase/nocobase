/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import type { FlowNodeModel, JobModel } from './types';

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

export function buildJob(
  node: FlowNodeModel,
  prevJob?: JobModel | null,
  payload: Record<string, any> = {},
): Record<string, any> {
  return {
    nodeId: node.id,
    nodeKey: node.key,
    upstreamId: prevJob?.id ?? null,
    ...payload,
  };
}
