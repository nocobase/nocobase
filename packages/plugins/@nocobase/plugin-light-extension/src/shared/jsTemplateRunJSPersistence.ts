/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_COLLECTIONS,
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT,
  LIGHT_EXTENSION_OWNER_TYPE,
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  LIGHT_EXTENSION_SOURCE_BINDING_TYPE,
  LIGHT_EXTENSION_SOURCE_MODE,
} from '../constants';
import type { LightExtensionRuntimeSourceBinding } from './types';

/**
 * Canonical TypeScript names for JS Template code. Their values intentionally remain the legacy wire identities used
 * by existing FlowModels, VSC repositories, runtime artifacts, and database records.
 */
export const JS_TEMPLATE_SOURCE_MODE = LIGHT_EXTENSION_SOURCE_MODE;
export const JS_TEMPLATE_SOURCE_BINDING_TYPE = LIGHT_EXTENSION_SOURCE_BINDING_TYPE;
export const JS_TEMPLATE_COLLECTIONS = LIGHT_EXTENSION_COLLECTIONS;
export const JS_TEMPLATE_VSC_OWNER_TYPE = LIGHT_EXTENSION_OWNER_TYPE;
export const JS_TEMPLATE_RUNTIME_ARTIFACT_CONTRACT = LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT;
export const JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.runtimeSurfaceContract;
export const JS_TEMPLATE_ENTRY_SCHEMA_URI = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.sdk.schemaUri;
export const JS_TEMPLATE_ENTRY_DESCRIPTOR_FILE = LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE;
export const JS_TEMPLATE_ERROR_CODE_PREFIX = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.errorCodePrefix;

export const JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT = Object.freeze({
  sourceMode: JS_TEMPLATE_SOURCE_MODE,
  sourceBindingType: JS_TEMPLATE_SOURCE_BINDING_TYPE,
  collectionNames: Object.freeze(Object.values(JS_TEMPLATE_COLLECTIONS)),
  vscOwnerType: JS_TEMPLATE_VSC_OWNER_TYPE,
  runtimeArtifactContract: JS_TEMPLATE_RUNTIME_ARTIFACT_CONTRACT,
  runtimeSurfaceContract: JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT,
  entrySchemaUri: JS_TEMPLATE_ENTRY_SCHEMA_URI,
  entryDescriptorFile: JS_TEMPLATE_ENTRY_DESCRIPTOR_FILE,
  errorCodePrefix: JS_TEMPLATE_ERROR_CODE_PREFIX,
});

export interface JsTemplateRunJSPersistence {
  sourceMode: typeof JS_TEMPLATE_SOURCE_MODE;
  sourceBinding: LightExtensionRuntimeSourceBinding;
}

export function isJsTemplateRuntimeSourceBinding(value: unknown): value is LightExtensionRuntimeSourceBinding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const binding = value as Record<string, unknown>;
  return (
    binding.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    isNonEmptyString(binding.repoId) &&
    isNonEmptyString(binding.entryId) &&
    isNonEmptyString(binding.kind)
  );
}

export function createJsTemplateRuntimeSourceBinding(
  input: Omit<LightExtensionRuntimeSourceBinding, 'type'>,
): LightExtensionRuntimeSourceBinding {
  return {
    ...input,
    type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
  };
}

/** Serializes canonical domain data without introducing a new JS Template wire token. */
export function serializeJsTemplateRunJSPersistence(sourceBinding: unknown): JsTemplateRunJSPersistence {
  if (!isJsTemplateRuntimeSourceBinding(sourceBinding)) {
    throw new TypeError('JS Template source binding must use the persisted light-extension-entry identity');
  }
  return {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    sourceBinding: {
      ...sourceBinding,
      type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
    },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}
