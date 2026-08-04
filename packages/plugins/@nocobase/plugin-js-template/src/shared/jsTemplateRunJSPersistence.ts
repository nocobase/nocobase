/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_ARTIFACT_CONTRACT as ARTIFACT_CONTRACT,
  JS_TEMPLATE_COLLECTIONS as COLLECTIONS,
  JS_TEMPLATE_DESCRIPTOR_FILE as DESCRIPTOR_FILE,
  JS_TEMPLATE_ERROR_CODE_PREFIX as ERROR_CODE_PREFIX,
  JS_TEMPLATE_OWNER_TYPE as OWNER_TYPE,
  JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT as RUNTIME_SURFACE_CONTRACT,
  JS_TEMPLATE_SOURCE_BINDING_TYPE as SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE as SOURCE_MODE,
} from '../constants';
import { JS_TEMPLATE_SCHEMA_URI as SCHEMA_URI } from '@nocobase/js-template-sdk/schema';
import type { JsTemplateRuntimeSourceBinding } from './types';

export const JS_TEMPLATE_SOURCE_MODE = SOURCE_MODE;
export const JS_TEMPLATE_SOURCE_BINDING_TYPE = SOURCE_BINDING_TYPE;
export const JS_TEMPLATE_COLLECTIONS = COLLECTIONS;
export const JS_TEMPLATE_VSC_OWNER_TYPE = OWNER_TYPE;
export const JS_TEMPLATE_ARTIFACT_CONTRACT = ARTIFACT_CONTRACT;
export const JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT = RUNTIME_SURFACE_CONTRACT;
export const JS_TEMPLATE_SCHEMA_URI = SCHEMA_URI;
export const JS_TEMPLATE_DESCRIPTOR_FILE = DESCRIPTOR_FILE;
export const JS_TEMPLATE_ERROR_CODE_PREFIX = ERROR_CODE_PREFIX;

export const JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT = Object.freeze({
  sourceMode: JS_TEMPLATE_SOURCE_MODE,
  sourceBindingType: JS_TEMPLATE_SOURCE_BINDING_TYPE,
  collectionNames: Object.freeze(Object.values(JS_TEMPLATE_COLLECTIONS)),
  vscOwnerType: JS_TEMPLATE_VSC_OWNER_TYPE,
  runtimeArtifactContract: JS_TEMPLATE_ARTIFACT_CONTRACT,
  runtimeSurfaceContract: JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT,
  entrySchemaUri: JS_TEMPLATE_SCHEMA_URI,
  entryDescriptorFile: JS_TEMPLATE_DESCRIPTOR_FILE,
  errorCodePrefix: JS_TEMPLATE_ERROR_CODE_PREFIX,
});

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
    keys.length === 4 &&
    keys.every((key) => ['type', 'projectId', 'templateId', 'kind'].includes(key)) &&
    binding.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    isNonEmptyString(binding.projectId) &&
    isNonEmptyString(binding.templateId) &&
    isNonEmptyString(binding.kind)
  );
}

export function createJsTemplateRuntimeSourceBinding(
  input: Omit<JsTemplateRuntimeSourceBinding, 'type'>,
): JsTemplateRuntimeSourceBinding {
  return {
    type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
    projectId: input.projectId,
    templateId: input.templateId,
    kind: input.kind,
  };
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
