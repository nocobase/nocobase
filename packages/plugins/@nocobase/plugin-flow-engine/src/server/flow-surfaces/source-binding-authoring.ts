/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';

export type RunJsSourceBindingKind = 'js-block' | 'js-field' | 'js-action' | 'js-item' | 'runjs';

export interface RunJsSourceBindingAuthoringError {
  path: string;
  ruleId: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RunJsSourceBindingValidationResult {
  errors: RunJsSourceBindingAuthoringError[];
  hasLightExtensionSourceInput: boolean;
  hasRunnableLightExtensionSource: boolean;
}

interface ValidateRunJsSourceBindingInput {
  source: unknown;
  currentSource?: unknown;
  path: string;
  expectedKind: RunJsSourceBindingKind;
  requireExplicitSourceModeForBinding: boolean;
  ruleIdPrefix?: 'jsBlock' | 'runjs';
  surfaceLabel?: string;
}

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
const LIGHT_EXTENSION_BINDING_TYPE = 'light-extension-entry';
const REQUIRED_BINDING_STRING_KEYS = ['type', 'repoId', 'entryId', 'kind'] as const;

type PlainRecord = Record<string, unknown>;

function asPlainRecord(value: unknown): PlainRecord | undefined {
  return _.isPlainObject(value) ? (value as PlainRecord) : undefined;
}

function hasOwn(value: PlainRecord | undefined, key: string) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim();
}

export function validateRunJsSourceBinding(input: ValidateRunJsSourceBindingInput): RunJsSourceBindingValidationResult {
  const errors: RunJsSourceBindingAuthoringError[] = [];
  const source = asPlainRecord(input.source);
  const currentSource = asPlainRecord(input.currentSource);
  if (!source) {
    return {
      errors,
      hasLightExtensionSourceInput: false,
      hasRunnableLightExtensionSource: false,
    };
  }

  const ruleIdPrefix = input.ruleIdPrefix || 'runjs';
  const surfaceLabel = input.surfaceLabel || 'RunJS surface';
  const hasSourceModeInput = hasOwn(source, 'sourceMode');
  const hasSourceBindingInput = hasOwn(source, 'sourceBinding');
  const currentBinding = asPlainRecord(currentSource?.sourceBinding);
  const submittedBinding = asPlainRecord(source.sourceBinding);
  const effectiveBinding = hasSourceBindingInput
    ? submittedBinding && currentBinding
      ? { ...currentBinding, ...submittedBinding }
      : source.sourceBinding
    : currentSource?.sourceBinding;
  const declaredSourceMode = hasSourceModeInput ? source.sourceMode : currentSource?.sourceMode;
  const hasEffectiveBinding = typeof effectiveBinding !== 'undefined' && effectiveBinding !== null;
  const effectiveSourceMode =
    typeof declaredSourceMode === 'undefined' && hasEffectiveBinding ? LIGHT_EXTENSION_SOURCE_MODE : declaredSourceMode;
  const hasLightExtensionSourceInput =
    effectiveSourceMode === LIGHT_EXTENSION_SOURCE_MODE || hasSourceBindingInput || hasEffectiveBinding;

  if (
    hasSourceModeInput &&
    source.sourceMode !== INLINE_SOURCE_MODE &&
    source.sourceMode !== LIGHT_EXTENSION_SOURCE_MODE
  ) {
    errors.push({
      path: `${input.path}.sourceMode`,
      ruleId: `${ruleIdPrefix}-sourceMode-invalid`,
      message: `flowSurfaces authoring ${input.path}.sourceMode must be "inline" or "light-extension"`,
      details: {
        allowedValues: [INLINE_SOURCE_MODE, LIGHT_EXTENSION_SOURCE_MODE],
      },
    });
  }

  if (effectiveSourceMode === INLINE_SOURCE_MODE && hasEffectiveBinding) {
    errors.push({
      path: `${input.path}.sourceBinding`,
      ruleId: `${ruleIdPrefix}-inline-sourceBinding-unsupported`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding requires ${input.path}.sourceMode="light-extension"; inline ${surfaceLabel} source uses code or source`,
    });
  }

  if (
    hasSourceBindingInput &&
    input.requireExplicitSourceModeForBinding &&
    source.sourceMode !== LIGHT_EXTENSION_SOURCE_MODE
  ) {
    errors.push({
      path: `${input.path}.sourceMode`,
      ruleId: `${ruleIdPrefix}-sourceMode-required-for-sourceBinding`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding requires ${input.path}.sourceMode="light-extension"`,
    });
  }

  if (effectiveSourceMode === LIGHT_EXTENSION_SOURCE_MODE && !hasEffectiveBinding) {
    errors.push({
      path: `${input.path}.sourceBinding`,
      ruleId: `${ruleIdPrefix}-sourceBinding-required`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding is required when ${input.path}.sourceMode="light-extension"`,
    });
    return {
      errors,
      hasLightExtensionSourceInput,
      hasRunnableLightExtensionSource: false,
    };
  }

  if (!hasEffectiveBinding) {
    return {
      errors,
      hasLightExtensionSourceInput,
      hasRunnableLightExtensionSource: false,
    };
  }

  const binding = asPlainRecord(effectiveBinding);
  if (!binding) {
    errors.push({
      path: `${input.path}.sourceBinding`,
      ruleId: `${ruleIdPrefix}-sourceBinding-invalid`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding must be an object`,
    });
    return {
      errors,
      hasLightExtensionSourceInput,
      hasRunnableLightExtensionSource: false,
    };
  }

  REQUIRED_BINDING_STRING_KEYS.forEach((key) => {
    if (nonEmptyString(binding[key])) {
      return;
    }
    errors.push({
      path: `${input.path}.sourceBinding.${key}`,
      ruleId: `${ruleIdPrefix}-sourceBinding-required-key`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding.${key} must be a non-empty string`,
      details: {
        key,
        requiredKeys: [...REQUIRED_BINDING_STRING_KEYS],
      },
    });
  });

  if (nonEmptyString(binding.type) && binding.type !== LIGHT_EXTENSION_BINDING_TYPE) {
    errors.push({
      path: `${input.path}.sourceBinding.type`,
      ruleId: `${ruleIdPrefix}-sourceBinding-type-invalid`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding.type must be "${LIGHT_EXTENSION_BINDING_TYPE}"`,
      details: {
        expectedType: LIGHT_EXTENSION_BINDING_TYPE,
      },
    });
  }

  if (nonEmptyString(binding.kind) && binding.kind !== input.expectedKind) {
    errors.push({
      path: `${input.path}.sourceBinding.kind`,
      ruleId: `${ruleIdPrefix}-sourceBinding-kind-invalid`,
      message: `flowSurfaces authoring ${input.path}.sourceBinding.kind must be "${input.expectedKind}"`,
      details: {
        expectedKind: input.expectedKind,
      },
    });
  }

  const bindingIsValid =
    REQUIRED_BINDING_STRING_KEYS.every((key) => nonEmptyString(binding[key])) &&
    binding.type === LIGHT_EXTENSION_BINDING_TYPE &&
    binding.kind === input.expectedKind;

  return {
    errors,
    hasLightExtensionSourceInput,
    hasRunnableLightExtensionSource: effectiveSourceMode === LIGHT_EXTENSION_SOURCE_MODE && bindingIsValid,
  };
}
