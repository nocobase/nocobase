/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { version as esbuildVersion } from 'esbuild';
import ts from 'typescript';

import { stableSerialize } from '..';
import { sha256Hex } from '../server';
import {
  RUNJS_BUILTIN_MODULES,
  RUNJS_PORTABLE_COMPILER_CONTRACT_VERSION,
  RUNJS_RESOLVABLE_EXTENSIONS,
} from './portable';

export const RUNJS_COMPILER_CONTRACT_VERSION = 'runjs.compiler.v2';
export const RUNJS_COMPILER_ENTRY_ADAPTER_CONTRACT_VERSION = 'runjs.entry-adapter.v2';
export const RUNJS_COMPILER_SOURCE_MAP_CONTRACT_VERSION = 'runjs.source-map.v1';
export const RUNJS_COMPILER_SOURCE_INSPECTION_POLICY_VERSION = 'runjs.source-inspection.v5';

export interface RunJSCompilerBuildIdentityComponents {
  compilerContract: string;
  entryAdapterContract: string;
  sourceMapContract: string;
  sourceInspectionPolicy: string;
  portableCompilerContract: number;
  importResolutionFingerprint: string;
  esbuildVersion: string;
  typescriptVersion: string;
}

export interface RunJSCompilerBuildIdentity {
  compilerBuildId: string;
  components: RunJSCompilerBuildIdentityComponents;
}

export const RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS: Readonly<RunJSCompilerBuildIdentityComponents> = Object.freeze({
  compilerContract: RUNJS_COMPILER_CONTRACT_VERSION,
  entryAdapterContract: RUNJS_COMPILER_ENTRY_ADAPTER_CONTRACT_VERSION,
  sourceMapContract: RUNJS_COMPILER_SOURCE_MAP_CONTRACT_VERSION,
  sourceInspectionPolicy: RUNJS_COMPILER_SOURCE_INSPECTION_POLICY_VERSION,
  portableCompilerContract: RUNJS_PORTABLE_COMPILER_CONTRACT_VERSION,
  importResolutionFingerprint: sha256Hex(
    stableSerialize({
      builtInModules: RUNJS_BUILTIN_MODULES,
      resolvableExtensions: RUNJS_RESOLVABLE_EXTENSIONS,
    }),
  ),
  esbuildVersion,
  typescriptVersion: ts.version,
});

export function buildRunJSCompilerBuildIdentity(
  components: RunJSCompilerBuildIdentityComponents = RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS,
): RunJSCompilerBuildIdentity {
  const normalizedComponents = { ...components };
  return {
    compilerBuildId: sha256Hex(stableSerialize(normalizedComponents)),
    components: normalizedComponents,
  };
}

export const RUNJS_COMPILER_BUILD_IDENTITY = Object.freeze(buildRunJSCompilerBuildIdentity());
