/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '../models';
import type { StepDefinition } from '../types';

type FlowLike = {
  key?: string;
  title?: string;
  sort?: number;
  on?: unknown;
  manual?: boolean;
  defaultParams?: unknown;
  steps?: Record<string, StepDefinition>;
  options?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSteps(value: unknown): Record<string, StepDefinition> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value).filter(([, step]) => isRecord(step))) as Record<
    string,
    StepDefinition
  >;
}

export async function resolveRuntimeFlowSettingSteps(
  model: FlowModel,
  flowKey: string,
): Promise<Record<string, StepDefinition>> {
  try {
    const steps = await model.getRuntimeFlowSettingSteps?.(flowKey);
    return normalizeSteps(steps);
  } catch (error) {
    console.warn(`FlowSettings: failed to resolve runtime setting steps for flow '${flowKey}'.`, error);
    return {};
  }
}

export function mergeFlowSettingSteps(
  staticSteps: Record<string, StepDefinition> | undefined,
  runtimeSteps: Record<string, StepDefinition> | undefined,
): Record<string, StepDefinition> {
  const staticEntries = Object.entries(staticSteps || {});
  const staticKeys = new Set(staticEntries.map(([key]) => key));
  const runtimeEntries = Object.entries(runtimeSteps || {}).filter(([key]) => !staticKeys.has(key));

  return Object.fromEntries(
    [...staticEntries, ...runtimeEntries]
      .map(([key, step], index) => ({ key, step, index }))
      .sort((a, b) => (a.step.sort ?? 0) - (b.step.sort ?? 0) || a.index - b.index)
      .map(({ key, step }) => [key, step]),
  );
}

export async function getFlowSettingSteps(
  model: FlowModel,
  flow: FlowLike,
  fallbackFlowKey?: string,
): Promise<Record<string, StepDefinition>> {
  const flowKey = flow.key || fallbackFlowKey;
  const runtimeSteps = flowKey ? await resolveRuntimeFlowSettingSteps(model, flowKey) : {};
  return mergeFlowSettingSteps(flow.steps, runtimeSteps);
}

export function createFlowWithSettingSteps(
  flow: FlowLike,
  steps: Record<string, StepDefinition>,
  fallbackFlowKey?: string,
): FlowLike {
  return {
    ...flow,
    key: flow.key || fallbackFlowKey,
    steps,
  };
}
