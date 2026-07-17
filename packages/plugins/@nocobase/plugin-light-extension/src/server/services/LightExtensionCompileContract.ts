/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex, stableSerialize, type RunJSSurfaceStyle } from '@nocobase/runjs';
import { RUNJS_COMPILER_BUILD_IDENTITY, type RunJSCompilerBuildIdentity } from '@nocobase/runjs/compiler';
import sdkPackageJson from '@nocobase/light-extension-sdk/package.json';

import {
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  type LightExtensionKind,
} from '../../constants';
import { lightExtensionEntryV1SchemaSha256 } from '../lightExtensionEntrySchema';
import { LIGHT_EXTENSION_SDK_TEMPLATE_VERSION, LIGHT_EXTENSION_VALIDATOR_VERSION } from './LightExtensionValidator';

export type LightExtensionSurfaceStyle = 'render' | 'value' | 'action';

export interface LightExtensionAuthoringSurfaceSpec {
  kind: LightExtensionKind;
  surfaceStyle: LightExtensionSurfaceStyle;
  compilerSurfaceStyle: Exclude<RunJSSurfaceStyle, 'workflow'>;
  modelUse: string;
  surface: string;
}

export const LIGHT_EXTENSION_AUTHORING_SURFACES: Record<LightExtensionKind, LightExtensionAuthoringSurfaceSpec> = {
  'js-block': {
    kind: 'js-block',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSBlockModel',
    surface: 'js-model.render',
  },
  'js-field': {
    kind: 'js-field',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSEditableFieldModel',
    surface: 'js-model.render',
  },
  'js-action': {
    kind: 'js-action',
    surfaceStyle: 'action',
    compilerSurfaceStyle: 'action',
    modelUse: 'JSActionModel',
    surface: 'js-model.action',
  },
  'js-item': {
    kind: 'js-item',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSItemActionModel',
    surface: 'js-model.render',
  },
  runjs: {
    kind: 'runjs',
    surfaceStyle: 'value',
    compilerSurfaceStyle: 'value',
    modelUse: 'RunJSValue',
    surface: 'runjs.value',
  },
};

export const LIGHT_EXTENSION_COMPILER_BRIDGE_CONTRACT_VERSION = 'light-extension.compiler-bridge.v1';
export const LIGHT_EXTENSION_IMPORT_REWRITE_POLICY_VERSION = 'light-extension.import-rewrite.v1';
export const LIGHT_EXTENSION_IMPORT_SECURITY_POLICY_VERSION = 'light-extension.import-security.v1';
export const LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION = 'light-extension.runtime-surface.v1';

export interface LightExtensionCompilerBuildIdentityComponents {
  runjsCompilerBuildId: string;
  compilerBridgeContract: string;
  importRewritePolicy: string;
  importSecurityPolicy: string;
  runtimeArtifactContract: string;
  runtimeSurfaceContract: string;
  authoringSurfaceFingerprint: string;
  validatorVersion: string;
  sdkVersion: string;
  entrySchemaVersion: number;
  entrySchemaHash: string;
  sdkTemplateVersion: string;
}

export interface LightExtensionCompilerBuildIdentity {
  compilerBuildId: string;
  components: LightExtensionCompilerBuildIdentityComponents;
  runjs: RunJSCompilerBuildIdentity;
}

export const LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS: Readonly<LightExtensionCompilerBuildIdentityComponents> =
  Object.freeze({
    runjsCompilerBuildId: RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId,
    compilerBridgeContract: LIGHT_EXTENSION_COMPILER_BRIDGE_CONTRACT_VERSION,
    importRewritePolicy: LIGHT_EXTENSION_IMPORT_REWRITE_POLICY_VERSION,
    importSecurityPolicy: LIGHT_EXTENSION_IMPORT_SECURITY_POLICY_VERSION,
    runtimeArtifactContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    runtimeSurfaceContract: LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION,
    authoringSurfaceFingerprint: sha256Hex(stableSerialize(LIGHT_EXTENSION_AUTHORING_SURFACES)),
    validatorVersion: LIGHT_EXTENSION_VALIDATOR_VERSION,
    sdkVersion: sdkPackageJson.version,
    entrySchemaVersion: LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
    entrySchemaHash: lightExtensionEntryV1SchemaSha256,
    sdkTemplateVersion: LIGHT_EXTENSION_SDK_TEMPLATE_VERSION,
  });

export function buildLightExtensionCompilerBuildIdentity(
  components: LightExtensionCompilerBuildIdentityComponents = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
  runjs: RunJSCompilerBuildIdentity = RUNJS_COMPILER_BUILD_IDENTITY,
): LightExtensionCompilerBuildIdentity {
  const normalizedComponents = { ...components };
  return {
    compilerBuildId: sha256Hex(stableSerialize(normalizedComponents)),
    components: normalizedComponents,
    runjs,
  };
}

export const LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY = Object.freeze(buildLightExtensionCompilerBuildIdentity());
