/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSRuntimeArtifact,
  RunJSSourceKind,
  RunJSSourceInitialSource,
  RunJSSourceImportZipInput,
  RunJSSourceImportZipResult,
  RunJSSourceLocator,
  RunJSSourceOpenResult,
  RunJSSourceRepositoryRecord,
  RunJSSourceSaveChangesInput,
  RunJSSourceSaveInput,
  RunJSSourceSaveResult,
} from '../../shared/runjs-source-contracts';
export type { RunJSCompileDiagnostic, RunJSSourceSaveResult } from '../../shared/runjs-source-contracts';
export type { RunJSSourceLocator } from '../../shared/runjs-source-contracts';
import type { VscCommitRecord, VscFileChange } from '../../shared/types';

export interface RunJSWorkspaceFile {
  path: string;
  content: string;
  blobHash?: string;
  size?: number;
  managed?: boolean;
  language?: string;
  mode?: string;
  revision?: number;
}

export type RunJSSourceHistoryItem = VscCommitRecord;

export type RunJSSourceOpenWorkspaceResult = RunJSSourceOpenResult;

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

export interface RunJSSourceRequestMap {
  open: {
    input: { locator: RunJSSourceLocator; initialSource?: RunJSSourceInitialSource };
    result: RunJSSourceOpenWorkspaceResult;
  };
  openLatest: {
    input: { locator: RunJSSourceLocator };
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
  saveChanges: {
    input: RunJSSourceSaveChangesInput;
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

export interface RunJSChangeSummary {
  files: number;
  additions: number;
  deletions: number;
}

export interface RunJSPathValidationResult {
  valid: boolean;
  message?: string;
}
