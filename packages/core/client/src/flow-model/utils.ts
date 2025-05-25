import type { FlowDefinition } from '../flow-engine/types';
import _ from 'lodash';
import { DeepPartial } from './types';

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
  patchFlow: DeepPartial<FlowDefinition>
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
      mergedFlow.steps[stepKey] = _.merge(
        flow.steps[stepKey], 
        stepDefinition
      );
    });
  }
  
  return mergedFlow;
} 