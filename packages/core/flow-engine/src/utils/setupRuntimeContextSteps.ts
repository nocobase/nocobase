/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowRuntimeContext } from '../flowContext';
import type { FlowDefinition } from '../types';
import { FlowModel } from '../models/flowModel';

/**
 * 为 FlowRuntimeContext 设置 steps 属性及其 meta 信息
 * @param flowContext FlowRuntimeContext 实例
 * @param flow 流定义
 * @param model FlowModel 实例
 * @param flowKey key
 */
export function setupRuntimeContextSteps(
  flowContext: FlowRuntimeContext<any>,
  flow: FlowDefinition,
  model: FlowModel,
  flowKey: string,
): void {
  const steps: Record<string, any> = {};
  const stepsMetaProperties: Record<string, any> = {};

  // 构建 meta 信息和步骤对象
  for (const stepKey in flow.steps) {
    if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
      const flowStep = flow.steps[stepKey];

      // 构建 meta 信息
      stepsMetaProperties[stepKey] = {
        type: 'object',
        title: flowStep.title || stepKey,
        properties: {
          params: {
            type: 'object',
            title: 'Parameters',
          },
          uiSchema: {
            type: 'object',
            title: 'UI Schema',
          },
          result: {
            type: 'any',
            title: 'Result',
          },
        },
      };

      steps[stepKey] = {
        get params() {
          return model.getStepParams(flowKey, stepKey) || {};
        },
        get uiSchema() {
          return flowStep.uiSchema;
        },
        result: undefined, // result 会在运行时被设置
      };
    }
  }

  // 定义 steps 属性
  flowContext.defineProperty('steps', {
    get: () => steps,
    meta: {
      type: 'object',
      title: 'Steps',
      properties: stepsMetaProperties,
    },
  });
}
