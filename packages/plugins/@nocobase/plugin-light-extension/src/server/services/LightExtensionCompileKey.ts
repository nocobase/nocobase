/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath, sha256Hex, stableSerialize } from '@nocobase/runjs';
import { posix as pathPosix } from 'path';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT, type LightExtensionKind } from '../../constants';
import type { LightExtensionEntryRecord } from '../../shared/types';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';

export interface CompileInputManifestFile {
  path: string;
  blobHash: string;
  language: string;
  mode: string;
}

export interface CompileInputManifest {
  compilerBuildId: string;
  runtimeContract: string;
  target: 'client';
  kind: LightExtensionKind;
  entryPath: string;
  runtimeVersion: string;
  surfaceStyle: string;
  compilerSurfaceStyle: string;
  modelUse: string;
  files: CompileInputManifestFile[];
}

export interface CompileInputManifestSourceFile {
  path: string;
  blobHash: string;
  language?: string;
  mode?: string;
}

export interface LightExtensionCompileKeyResult {
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
}

export type CompileDecisionKind = 'compile' | 'reuse' | 'skip-runtime';

export type CompileDecision =
  | (LightExtensionCompileKeyResult & {
      entryId: string;
      decision: 'compile' | 'reuse';
      affected: boolean;
      reason: 'cache-hit' | 'cache-miss' | 'cache-corrupt' | 'cache-disabled';
    })
  | {
      entryId: string;
      decision: 'skip-runtime';
      affected: false;
      reason: 'runtime-unavailable';
    };

export function buildLightExtensionCompileKey(input: {
  entry: Pick<LightExtensionEntryRecord, 'kind' | 'entryPath' | 'descriptorPath' | 'target'>;
  files: readonly CompileInputManifestSourceFile[];
  runtimeVersion?: string;
  compilerBuildIdentity?: LightExtensionCompilerBuildIdentity;
}): LightExtensionCompileKeyResult {
  if (!isLightExtensionKind(input.entry.kind)) {
    throw new TypeError(`Unsupported light-extension kind: ${input.entry.kind}`);
  }
  const compilerBuildIdentity = input.compilerBuildIdentity || LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY;
  const surface = LIGHT_EXTENSION_AUTHORING_SURFACES[input.entry.kind];
  const entryPath = normalizePath(input.entry.entryPath);
  const descriptorPath = normalizePath(input.entry.descriptorPath);
  const entryRootPath = pathPosix.dirname(entryPath);
  const files = normalizeManifestFiles(input.files, entryRootPath, descriptorPath);
  const inputManifest: CompileInputManifest = {
    compilerBuildId: compilerBuildIdentity.compilerBuildId,
    runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    target: 'client',
    kind: input.entry.kind,
    entryPath,
    runtimeVersion: input.runtimeVersion || 'v2',
    surfaceStyle: surface.surfaceStyle,
    compilerSurfaceStyle: surface.compilerSurfaceStyle,
    modelUse: surface.modelUse,
    files,
  };
  return {
    compileKey: sha256Hex(stableSerialize(inputManifest)),
    filesHash: sha256Hex(stableSerialize(files)),
    inputManifest,
  };
}

function normalizeManifestFiles(
  files: readonly CompileInputManifestSourceFile[],
  entryRootPath: string,
  descriptorPath: string,
): CompileInputManifestFile[] {
  const byPath = new Map<string, CompileInputManifestFile>();
  for (const file of files) {
    const path = normalizePath(file.path);
    if (
      path === descriptorPath ||
      !(path === entryRootPath || path.startsWith(`${entryRootPath}/`) || path.startsWith('src/shared/'))
    ) {
      continue;
    }
    const normalized = {
      path,
      blobHash: normalizeRequiredString(file.blobHash, `Blob hash for ${path}`),
      language: normalizeRequiredString(file.language || inferLanguage(path), `Language for ${path}`),
      mode: normalizeRequiredString(file.mode || '100644', `Mode for ${path}`),
    };
    const existing = byPath.get(path);
    if (existing && stableSerialize(existing) !== stableSerialize(normalized)) {
      throw new TypeError(`Conflicting canonical compile metadata for path "${path}"`);
    }
    byPath.set(path, normalized);
  }
  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function normalizeRequiredString(value: string, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}

function inferLanguage(path: string): string {
  const extension = pathPosix.extname(path).slice(1).toLowerCase();
  return extension || 'text';
}

function isLightExtensionKind(kind: string): kind is LightExtensionKind {
  return Object.prototype.hasOwnProperty.call(LIGHT_EXTENSION_AUTHORING_SURFACES, kind);
}
