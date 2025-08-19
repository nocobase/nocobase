/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowRuntimeContext } from '../flowContext';
import { FlowModel } from '../models/flowModel';
import type { FlowDefinition } from '../types';
import { escapeT } from './translation';

/**
 * 为 FlowRuntimeContext 设置 steps 属性及其 meta 信息
 * @param ctx FlowRuntimeContext 实例
 * @param flow 流定义
 * @param model FlowModel 实例
 * @param flowKey key
 */
export function setupRuntimeContextSteps(
  ctx: FlowRuntimeContext<any>,
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
      const stepParams = model.getStepParams(flowKey, stepKey) || {};

      // 根据 uiSchema 构建细化的 params meta
      const paramsProperties: Record<string, any> = {};

      if (flowStep.uiSchema && typeof flowStep.uiSchema === 'object') {
        for (const [paramKey, paramSchema] of Object.entries(flowStep.uiSchema)) {
          if (paramSchema && typeof paramSchema === 'object') {
            const schema = paramSchema as any;
            paramsProperties[paramKey] = {
              type: schema.type || 'any',
              title: schema.title || schema['x-decorator-props']?.label || paramKey,
              interface: schema['x-component'],
              uiSchema: schema,
            };
          }
        }
      }

      // 如果没有参数属性，则隐藏整个step
      const hasParams = Object.keys(paramsProperties).length > 0;

      stepsMetaProperties[stepKey] = {
        type: 'object',
        title: ctx.t(flowStep.title) || stepKey,
        display: hasParams ? 'default' : 'none',
        properties: hasParams
          ? {
              params: {
                type: 'object',
                title: 'Parameters',
                display: 'flatten',
                properties: paramsProperties,
              },
            }
          : undefined,
      };

      // 始终创建步骤对象，确保运行时能够访问
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
  ctx.defineProperty('steps', {
    get: () => steps,
    meta: {
      type: 'object',
      title: escapeT('Settings'),
      properties: stepsMetaProperties,
    },
  });
}
