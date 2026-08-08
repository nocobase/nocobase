/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SOURCE_BINDING_TYPE, JS_TEMPLATE_SOURCE_MODE, JS_TEMPLATE_SUPPORTED_KINDS } from '../constants';
import type { JsTemplateRuntimeSourceBinding } from './types';

const JS_TEMPLATE_SOURCE_BINDING_KEYS = new Set(['type', 'projectId', 'templateId', 'kind']);

export interface JsTemplateRunJSPersistence {
  sourceMode: typeof JS_TEMPLATE_SOURCE_MODE;
  sourceBinding: JsTemplateRuntimeSourceBinding;
}

export function isJsTemplateRuntimeSourceBinding(value: unknown): value is JsTemplateRuntimeSourceBinding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const binding = value as Record<string, unknown>;
  const keys = Object.keys(binding);
  return (
    keys.length === JS_TEMPLATE_SOURCE_BINDING_KEYS.size &&
    keys.every((key) => JS_TEMPLATE_SOURCE_BINDING_KEYS.has(key)) &&
    binding.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    isNonEmptyString(binding.projectId) &&
    isNonEmptyString(binding.templateId) &&
    typeof binding.kind === 'string' &&
    (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(binding.kind)
  );
}

export function createJsTemplateRuntimeSourceBinding(
  input: Omit<JsTemplateRuntimeSourceBinding, 'type'>,
): JsTemplateRuntimeSourceBinding {
  const sourceBinding: JsTemplateRuntimeSourceBinding = {
    type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
    projectId: input.projectId,
    templateId: input.templateId,
    kind: input.kind,
  };
  if (!isJsTemplateRuntimeSourceBinding(sourceBinding)) {
    throw new TypeError('JS Template source binding must use the persisted js-template-entry identity');
  }
  return sourceBinding;
}

export function serializeJsTemplateRunJSPersistence(sourceBinding: unknown): JsTemplateRunJSPersistence {
  if (!isJsTemplateRuntimeSourceBinding(sourceBinding)) {
    throw new TypeError('JS Template source binding must use the persisted js-template-entry identity');
  }
  return {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    sourceBinding: {
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
      projectId: sourceBinding.projectId,
      templateId: sourceBinding.templateId,
      kind: sourceBinding.kind,
    },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}
