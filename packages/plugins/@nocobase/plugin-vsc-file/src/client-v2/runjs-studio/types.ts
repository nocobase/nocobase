/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSLegacySource,
  RunJSRuntimeArtifact,
  RunJSSourceKind,
  RunJSSourceInitialSource,
  RunJSSourceLocator,
  RunJSSourceOpenResult,
  RunJSSourceSaveInput,
  RunJSSourceSaveResult,
  RunJSSurfaceStyle,
} from '../../shared/runjs-source-contracts';
export type { RunJSCompileDiagnostic } from '../../shared/runjs-source-contracts';
export type { RunJSSourceLocator } from '../../shared/runjs-source-contracts';
import type { VscCommitRecord, VscFileChange, VscRepositoryIdentity, VscRepositoryRecord } from '../../shared/types';

export interface RunJSWorkspaceFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export interface RunJSSourceRepositoryRecord extends VscRepositoryRecord {
  repoId: string;
}

export interface RunJSSourceInfo {
  label: string;
  kind: RunJSSourceKind;
  surfaceStyle: RunJSSurfaceStyle;
  runtimeVersion: string;
  language: RunJSLegacySource['language'];
  ownerFingerprint: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourcePermissions {
  canRead: boolean;
  canWrite: boolean;
  canSave: boolean;
}

export type RunJSSourceHistoryItem = VscCommitRecord;

export interface RunJSSourceHistoryState {
  items: RunJSSourceHistoryItem[];
}

export interface RunJSSourceOpenWorkspaceResult extends RunJSSourceOpenResult {
  repositoryIdentity: VscRepositoryIdentity;
  repository: RunJSSourceRepositoryRecord;
  source: RunJSSourceInfo;
  files: RunJSWorkspaceFile[];
  permissions: RunJSSourcePermissions;
  history: RunJSSourceHistoryState;
}

export interface RunJSSourceCompilePreviewInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  baseCommitId?: string | null;
  files: VscFileChange[];
  entryPath?: string;
  entry?: string;
  version?: string;
}

export interface RunJSSourceCompilePreviewResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  artifact: RunJSRuntimeArtifact;
}

export interface RunJSSourceHistoryInput {
  locator: RunJSSourceLocator;
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface RunJSSourceHistoryResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  items: RunJSSourceHistoryItem[];
  nextBeforeSeq: number | null;
}

export interface RunJSSourceGetVersionInput {
  locator: RunJSSourceLocator;
  repoId: string;
  commitId: string;
  includeFiles: boolean;
}

export interface RunJSSourceVersionResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  commit: RunJSSourceHistoryItem;
  files: RunJSWorkspaceFile[];
}

export interface RunJSSourceExportZipInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  commitId?: string;
}

export interface RunJSSourceImportZipInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  message: string;
  zipBase64: string;
  entryPath?: string;
  version?: string;
}

export interface RunJSSourceImportZipResult extends RunJSSourceSaveResult {
  import: {
    fileCount: number;
    filesHash: string;
  };
}

export interface RunJSSourceRequestMap {
  open: {
    input: { locator: RunJSSourceLocator; initialSource?: RunJSSourceInitialSource };
    result: RunJSSourceOpenWorkspaceResult;
  };
  restoreFromCode: {
    input: { locator: RunJSSourceLocator };
    result: RunJSSourceOpenWorkspaceResult;
  };
  compilePreview: {
    input: RunJSSourceCompilePreviewInput;
    result: RunJSSourceCompilePreviewResult;
  };
  save: {
    input: RunJSSourceSaveInput;
    result: RunJSSourceSaveResult;
  };
  exportZip: {
    input: RunJSSourceExportZipInput;
    result: Blob;
  };
  importZip: {
    input: RunJSSourceImportZipInput;
    result: RunJSSourceImportZipResult;
  };
  listHistory: {
    input: RunJSSourceHistoryInput;
    result: RunJSSourceHistoryResult;
  };
  getVersion: {
    input: RunJSSourceGetVersionInput;
    result: RunJSSourceVersionResult;
  };
}

export type RunJSSourceActionName = keyof RunJSSourceRequestMap;

export type RunJSSourceActionInput<TAction extends RunJSSourceActionName> = RunJSSourceRequestMap[TAction]['input'];

export type RunJSSourceActionResult<TAction extends RunJSSourceActionName> = RunJSSourceRequestMap[TAction]['result'];

export interface RunJSConsoleEntry {
  id: number;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  path?: string;
  line?: number;
  column?: number;
}

export interface RunJSLineDiffRow {
  key: string;
  type: 'context' | 'delete' | 'insert';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface RunJSChangeSummary {
  files: number;
  additions: number;
  deletions: number;
}

export interface RunJSPathValidationResult {
  valid: boolean;
  message?: string;
}
