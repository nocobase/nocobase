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
};

export type RuntimeFlowSettingDiagnostic = {
  code: string;
  flowKey: string;
  stepKey: string;
  message: string;
  error: unknown;
  details?: Record<string, unknown>;
};

export type RuntimeFlowSettingDiagnosticPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

const runtimeFlowSettingDiagnostics = new WeakMap<FlowModel, Map<string, RuntimeFlowSettingDiagnostic>>();

function diagnosticKey(flowKey: string, stepKey: string): string {
  return `${flowKey}:${stepKey}`;
}

export function isRuntimeFlowSettingDiagnosticError(error: unknown): boolean {
  return Boolean(getRuntimeFlowSettingDiagnosticPayload(error));
}

function getRuntimeFlowSettingDiagnosticPayload(error: unknown): RuntimeFlowSettingDiagnosticPayload | undefined {
  if (!isRecord(error) || !isRecord(error.flowSettingsDiagnostic)) {
    return undefined;
  }
  const payload = error.flowSettingsDiagnostic;
  if (typeof payload.code !== 'string' || typeof payload.message !== 'string') {
    return undefined;
  }
  return {
    code: payload.code,
    message: payload.message,
    ...(isRecord(payload.details) ? { details: payload.details } : {}),
  };
}

export function getRuntimeFlowSettingDiagnostics(model: FlowModel): RuntimeFlowSettingDiagnostic[] {
  return Array.from(runtimeFlowSettingDiagnostics.get(model)?.values() || []);
}

export function clearRuntimeFlowSettingDiagnostic(model: FlowModel, flowKey: string, stepKey: string): void {
  const diagnostics = runtimeFlowSettingDiagnostics.get(model);
  if (!diagnostics) {
    return;
  }
  diagnostics.delete(diagnosticKey(flowKey, stepKey));
  if (diagnostics.size === 0) {
    runtimeFlowSettingDiagnostics.delete(model);
  }
}

export function recordRuntimeFlowSettingDiagnostic(
  model: FlowModel,
  flowKey: string,
  stepKey: string,
  error: unknown,
): RuntimeFlowSettingDiagnostic {
  const key = diagnosticKey(flowKey, stepKey);
  const current = runtimeFlowSettingDiagnostics.get(model) || new Map<string, RuntimeFlowSettingDiagnostic>();
  const payload = getRuntimeFlowSettingDiagnosticPayload(error);
  if (!payload) {
    throw new Error('Runtime flow setting diagnostic payload is required.');
  }
  const diagnostic: RuntimeFlowSettingDiagnostic = {
    code: payload.code,
    flowKey,
    stepKey,
    message: payload.message,
    error,
    ...(payload.details ? { details: payload.details } : {}),
  };
  current.set(key, diagnostic);
  runtimeFlowSettingDiagnostics.set(model, current);
  return diagnostic;
}

export function applyRuntimeFlowSettingDiagnosticStep(
  model: FlowModel,
  step: StepDefinition,
  diagnostic: RuntimeFlowSettingDiagnostic,
): void {
  const t = typeof model.context?.t === 'function' ? model.context.t.bind(model.context) : (value: string) => value;
  const originalTitle = String(step.title || step.key || diagnostic.stepKey);
  step.title = `${originalTitle} (${t('Unavailable')})`;
  step.hideInSettings = false;
  step.disabledInSettings = false;
  step.persistParams = false;
  step.use = undefined;
  step.uiMode = 'dialog';
  step.uiSchema = {
    diagnostic: {
      type: 'string',
      title: t('Settings diagnostic'),
      description: diagnostic.message,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        disabled: true,
        autoSize: { minRows: 4, maxRows: 10 },
      },
    },
  };
  step.defaultParams = () => ({ diagnostic: diagnostic.message });
  step.beforeParamsSave = undefined;
  step.afterParamsSave = undefined;
}

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
