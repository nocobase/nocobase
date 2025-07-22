/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { FlowDefinition, DeepPartial, ActionDefinition } from '../types';
import { FlowModel } from '../models/flowModel';

/**
 * 合并两个流程定义
 * 用于处理流程的部分覆盖（patch）场景
 *
 * @param originalFlow 原始流程定义
 * @param patchFlow 覆盖流程定义
 * @returns 合并后的流程定义
 */
export function mergeFlowDefinitions(
  originalFlow: FlowDefinition,
  patchFlow: DeepPartial<FlowDefinition>,
): FlowDefinition {
  // 创建新的流程定义，合并原始流程和覆盖配置
  const flow = _.cloneDeep(originalFlow);
  const mergedFlow = {
    ...flow,
    title: patchFlow.title ?? flow.title,
    ...(patchFlow.on && { on: patchFlow.on as { eventName: string } }),
    ...flow.steps,
  } as FlowDefinition;

  // 覆盖特定步骤
  if (patchFlow.steps) {
    Object.entries(patchFlow.steps).forEach(([stepKey, stepDefinition]) => {
      mergedFlow.steps[stepKey] = _.merge(flow.steps[stepKey], stepDefinition);
    });
  }

  return mergedFlow;
}

export function defineAction<TModel extends FlowModel = FlowModel>(options: ActionDefinition<TModel>) {
  return options;
}
