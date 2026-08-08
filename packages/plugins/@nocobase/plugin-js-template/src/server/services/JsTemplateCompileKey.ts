/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath, stableSerialize } from '@nocobase/runjs';
import { sha256Hex } from '@nocobase/runjs/server';
import { isClientSettingsTypegenDescriptorPath } from '@nocobase/js-template-sdk/typegen';
import { posix as pathPosix } from 'path';

import { JS_TEMPLATE_ARTIFACT_CONTRACT, type JsTemplateKind } from '../../constants';
import type { JsTemplate } from '../../shared/types';
import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  type JsTemplateCompilerBuildIdentity,
} from './JsTemplateCompileContract';

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
  kind: JsTemplateKind;
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

export interface JsTemplateCompileKeyResult {
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
}

export function buildJsTemplateCompileKey(input: {
  template: Pick<JsTemplate, 'kind' | 'entryPath' | 'descriptorPath' | 'target'>;
  files: readonly CompileInputManifestSourceFile[];
  runtimeVersion?: string;
  compilerBuildIdentity?: JsTemplateCompilerBuildIdentity;
}): JsTemplateCompileKeyResult {
  if (!isJsTemplateKind(input.template.kind)) {
    throw new TypeError(`Unsupported js-template kind: ${input.template.kind}`);
  }
  const compilerBuildIdentity = input.compilerBuildIdentity || JS_TEMPLATE_COMPILER_BUILD_IDENTITY;
  const surface = JS_TEMPLATE_AUTHORING_SURFACES[input.template.kind];
  const entryPath = normalizePath(input.template.entryPath);
  const entryRootPath = pathPosix.dirname(entryPath);
  const files = normalizeManifestFiles(input.files, entryRootPath);
  const inputManifest: CompileInputManifest = {
    compilerBuildId: compilerBuildIdentity.compilerBuildId,
    runtimeContract: JS_TEMPLATE_ARTIFACT_CONTRACT,
    target: 'client',
    kind: input.template.kind,
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
): CompileInputManifestFile[] {
  const byPath = new Map<string, CompileInputManifestFile>();
  for (const file of files) {
    const path = normalizePath(file.path);
    if (
      !(
        path === entryRootPath ||
        path.startsWith(`${entryRootPath}/`) ||
        path.startsWith('src/shared/') ||
        isClientSettingsTypegenDescriptorPath(path)
      )
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

function isJsTemplateKind(kind: string): kind is JsTemplateKind {
  return Object.prototype.hasOwnProperty.call(JS_TEMPLATE_AUTHORING_SURFACES, kind);
}
