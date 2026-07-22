/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { posix as pathPosix } from 'path';

export * from './typescript-library';
export * from './typescript-library-usage';
export * from './lodash-type-library';
export * from './type-packs/dayjs';
export * from './type-packs/antd';
export * from './type-packs/antd-icons';
export * from './type-packs/formulajs';
export * from './type-packs/mathjs';

const maxRunJSPathLength = 512;
const windowsDrivePrefix = /^[A-Za-z]:\//;
const utf8Bom = '\ufeff';

export type RunJSErrorCode = 'RUNJS_PATH_INVALID' | 'RUNJS_TEXT_INVALID';

export class RunJSError extends Error {
  constructor(
    readonly code: RunJSErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RunJSError';
  }
}

export type RunJSSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: string[];
      versionPath?: string[];
    }
  | {
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: string[];
    }
  | { kind: 'workflow.javascript'; nodeId: string | number }
  | { kind: 'chart.option'; modelUid: string }
  | { kind: 'chart.events'; modelUid: string };

export type RunJSSourceKind = RunJSSourceLocator['kind'];
export type RunJSSurfaceStyle = 'render' | 'action' | 'value' | 'workflow';
export type RunJSLanguage = 'typescript' | 'javascript' | 'tsx' | 'jsx';

export interface RunJSCompileDiagnostic {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  code?: string;
  ruleId?: string;
  path?: string;
  line?: number;
  column?: number;
  details?: Record<string, unknown>;
}

export interface RunJSSourceAuthoringLegacyInfo {
  version: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourceAuthoringInspectionInput {
  code: string;
  path: string;
  runtimeVersion: string;
  surfaceStyle: Exclude<RunJSSurfaceStyle, 'workflow'>;
  locator?: RunJSSourceLocator;
  legacy?: RunJSSourceAuthoringLegacyInfo;
}

export type RunJSSourceAuthoringInspector = (input: RunJSSourceAuthoringInspectionInput) => RunJSCompileDiagnostic[];

export interface RunJSRuntimeArtifact {
  code: string;
  version: string;
  sourceMap?: string;
  diagnostics: RunJSCompileDiagnostic[];
  filesHash: string;
  entryPath?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSCompileFile {
  path: string;
  content?: string;
  language?: string;
  operation?: 'upsert' | 'delete';
}

export type RunJSCompileFailureCode =
  | 'RUNJS_COMPILE_FAILED'
  | 'RUNJS_ENTRY_NOT_FOUND'
  | 'RUNJS_IMPORT_NOT_ALLOWED'
  | 'RUNJS_IMPORT_NOT_FOUND'
  | 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

export function buildRunJSFilesHash(files: RunJSCompileFile[]): string {
  return sha256Hex(stableSerialize(files));
}

export function buildRunJSRuntimeCodeHash(code: string): string {
  return sha256Hex(code);
}

export function buildRunJSArtifactHash(input: {
  code: string;
  sourceMap?: string | null;
  version: string;
  entryPath: string;
  runtimeContract: string;
}): string {
  return sha256Hex(stableSerialize(input));
}

export function normalizePath(value: string): string {
  if (typeof value !== 'string') {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must be a string');
  }
  const normalized = value.replace(/\\/g, '/');
  if (!normalized) {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must not be empty');
  }
  if (normalized.length > maxRunJSPathLength) {
    throw new RunJSError('RUNJS_PATH_INVALID', `Path length must not exceed ${maxRunJSPathLength}`);
  }
  if (normalized.includes('\0')) {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must not contain NUL');
  }
  if (normalized.startsWith('/') || windowsDrivePrefix.test(normalized)) {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must be relative');
  }
  if (normalized.endsWith('/')) {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must not end with a slash');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new RunJSError('RUNJS_PATH_INVALID', 'Path must not contain empty, current, or parent segments');
  }
  return pathPosix.normalize(normalized);
}

export function normalizeText(value: string): string {
  if (typeof value !== 'string') {
    throw new RunJSError('RUNJS_TEXT_INVALID', 'Text content must be a string');
  }
  const withoutBom = value.startsWith(utf8Bom) ? value.slice(1) : value;
  const normalized = withoutBom.replace(/\r\n?/g, '\n');
  if (normalized.includes('\0')) {
    throw new RunJSError('RUNJS_TEXT_INVALID', 'Text content must not contain NUL');
  }
  return normalized;
}
