/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSCompileDiagnostic,
  RunJSLegacySource,
  RunJSRuntimeArtifact,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSourceOpenResult,
  RunJSSourcePublishInput,
  RunJSSourcePublishResult,
  RunJSSurfaceStyle,
} from '../../shared/runjs-source-types';
import type {
  VscCommitRecord,
  VscDraftFileRecord,
  VscDraftRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
} from '../../shared/types';
import type { VscFileRepoFileDiffResult } from '../hooks';

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

export interface RunJSSourceDraftRecord {
  id: string;
  baseCommitId: string | null;
  status: VscDraftRecord['status'];
  files: VscDraftFileRecord[];
}

export interface RunJSSourcePermissions {
  canRead: boolean;
  canWrite: boolean;
  canPublish: boolean;
}

export interface RunJSSourceHistoryItem extends VscCommitRecord {
  isPublished: boolean;
}

export interface RunJSSourceHistoryState {
  commits: RunJSSourceHistoryItem[];
  items: RunJSSourceHistoryItem[];
}

export interface RunJSSourceOpenWorkspaceResult extends RunJSSourceOpenResult {
  repositoryIdentity: VscRepositoryIdentity;
  repository: RunJSSourceRepositoryRecord;
  source: RunJSSourceInfo;
  files: RunJSWorkspaceFile[];
  draft: RunJSSourceDraftRecord | null;
  permissions: RunJSSourcePermissions;
  history: RunJSSourceHistoryState;
}

export interface RunJSSourceSaveDraftInput {
  locator: RunJSSourceLocator;
  repoId: string;
  baseCommitId: string | null;
  files: VscFileChange[];
}

export interface RunJSSourceDraftResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  draft: RunJSSourceDraftRecord;
  files: VscDraftFileRecord[];
}

export interface RunJSSourceDiscardDraftResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  draft: VscDraftRecord | null;
}

export interface RunJSSourceDiffDraftInput {
  locator: RunJSSourceLocator;
  repoId: string;
  baseCommitId?: string | null;
  files?: VscFileChange[];
}

export interface RunJSSourceDiffDraftResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  diff: VscFileRepoFileDiffResult;
}

export interface RunJSSourceCompilePreviewInput {
  locator: RunJSSourceLocator;
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
  commits: RunJSSourceHistoryItem[];
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

export interface RunJSSourceDiffVersionInput {
  locator: RunJSSourceLocator;
  repoId: string;
  commitId?: string;
  fromCommitId?: string;
  toCommitId?: string;
}

export interface RunJSSourceDiffVersionResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  fromCommitId: string | null;
  toCommitId: string;
  fromIsPublished: boolean;
  toIsPublished: boolean;
  diff: VscFileRepoFileDiffResult;
}

export interface RunJSSourceRestoreAsDraftInput {
  locator: RunJSSourceLocator;
  repoId: string;
  sourceCommitId: string;
  baseCommitId: string | null;
}

export interface RunJSSourceRequestMap {
  open: {
    input: { locator: RunJSSourceLocator };
    result: RunJSSourceOpenWorkspaceResult;
  };
  saveDraft: {
    input: RunJSSourceSaveDraftInput;
    result: RunJSSourceDraftResult;
  };
  rebaseDraft: {
    input: RunJSSourceSaveDraftInput;
    result: RunJSSourceDraftResult;
  };
  discardDraft: {
    input: { locator: RunJSSourceLocator; repoId: string };
    result: RunJSSourceDiscardDraftResult;
  };
  diffDraft: {
    input: RunJSSourceDiffDraftInput;
    result: RunJSSourceDiffDraftResult;
  };
  compilePreview: {
    input: RunJSSourceCompilePreviewInput;
    result: RunJSSourceCompilePreviewResult;
  };
  publish: {
    input: RunJSSourcePublishInput;
    result: RunJSSourcePublishResult;
  };
  listHistory: {
    input: RunJSSourceHistoryInput;
    result: RunJSSourceHistoryResult;
  };
  getVersion: {
    input: RunJSSourceGetVersionInput;
    result: RunJSSourceVersionResult;
  };
  diffVersion: {
    input: RunJSSourceDiffVersionInput;
    result: RunJSSourceDiffVersionResult;
  };
  restoreAsDraft: {
    input: RunJSSourceRestoreAsDraftInput;
    result: RunJSSourceDraftResult;
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
