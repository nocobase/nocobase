/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Per-model AutoFlow error storage with proper typing, avoiding ad-hoc properties.
 */
import type { FlowModel } from '../models';

export type AutoFlowError = Error | null;

const map = new WeakMap<FlowModel, AutoFlowError>();

export function setAutoFlowError(model: FlowModel, err: AutoFlowError) {
  map.set(model, err ?? null);
}

export function getAutoFlowError(model: FlowModel): AutoFlowError {
  return map.get(model) ?? null;
}

export function clearAutoFlowError(model: FlowModel) {
  map.delete(model);
}
