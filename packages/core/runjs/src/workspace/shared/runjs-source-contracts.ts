/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  VscCommitDiffResult,
  VscCommitRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
} from './types';
import type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSRuntimeArtifact,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSurfaceStyle,
} from '../../index';

export type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSRuntimeArtifact,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSurfaceStyle,
} from '../../index';

export interface RunJSSourcePermissionCheck {
  resource: string;
  action: string;
  rawResourceName?: string;
}

export interface RunJSSourcePermissionResult {
  params?: {
    filter?: unknown;
    whitelist?: string[];
    blacklist?: string[];
    fields?: string[];
    [key: string]: unknown;
  };
}

export interface RunJSSourceAdapterContext {
  userId?: string | null;
  request?: Record<string, unknown>;
  state?: Record<string, unknown>;
  currentUser?: unknown;
  timezone?: string;
  transaction?: unknown;
  can?: (input: RunJSSourcePermissionCheck) => RunJSSourcePermissionResult | null;
  sourceTransition?: 'external-to-inline' | 'external-binding-replay';
}

export interface RunJSLegacySource {
  code: string;
  version: string;
  label: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  entryPath?: string;
  entry?: string;
  ownerFingerprint: string;
  uninitialized?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RunJSRuntimeWriteResult {
  ownerFingerprint?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSExternalSourceBinding {
  sourceMode: string;
  sourceBinding: Record<string, unknown>;
}

export interface RunJSSourceAdapter<TLocator extends RunJSSourceLocator = RunJSSourceLocator> {
  kind: TLocator['kind'];
  readLegacy(input: {
    locator: TLocator;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSLegacySource> | RunJSLegacySource;
  writeRuntime(input: {
    locator: TLocator;
    artifact: RunJSRuntimeArtifact;
    commitId: string;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
  writeExternalBinding?(input: {
    locator: TLocator;
    binding: RunJSExternalSourceBinding;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
  getFingerprint(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<string> | string;
  assertCanRead(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
  assertCanWrite(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
}

export type RunJSWorkspaceDiagnosticSeverity = 'error' | 'warning';

export interface RunJSWorkspaceDiagnostic {
  code: string;
  severity: RunJSWorkspaceDiagnosticSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  kind?: string;
  entryName?: string;
  details?: Record<string, unknown>;
}

export interface RunJSSourceOpenResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  ownerFingerprint: string;
  source: RunJSSourceInfo;
  repository: RunJSSourceRepositoryRecord;
  files: RunJSSourceWorkspaceFile[];
  permissions: RunJSSourcePermissions;
  history: RunJSSourceHistoryState;
  settingsDescriptor: RunJSSourceOpenSettingsDescriptor;
}

export interface RunJSSourceOpenSettingsDescriptor {
  descriptorPath: string;
  entryId: string | null;
  key: string | null;
  schema: Record<string, unknown> | null;
  defaults: Record<string, unknown>;
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  diagnostics: RunJSWorkspaceDiagnostic[];
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

export interface RunJSSourceRepositoryRecord extends VscRepositoryRecord {
  repoId: string;
}

export interface RunJSSourceWorkspaceFile {
  path: string;
  content?: string;
  blobHash: string;
  size: number;
  managed: boolean;
  language?: string;
  mode?: string;
}

export interface RunJSSourcePermissions {
  canRead: boolean;
  canWrite: boolean;
  canSave: boolean;
}

export interface RunJSSourceHistoryState {
  items: VscCommitRecord[];
}

export interface RunJSSourceInitialSource {
  code: string;
  version: string;
}

export interface RunJSSourceSaveResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  artifact: {
    entryPath: string | null;
    filesHash: string;
    runtimeCodeHash: string;
    diagnostics: RunJSCompileDiagnostic[];
  };
  ownerFingerprint: string;
  writeResult: RunJSRuntimeWriteResult;
}

export interface RunJSSourceSaveInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  baseCommitId: string | null;
  baseOwnerFingerprint: string;
  message: string;
  files: VscFileChange[];
  entryPath?: string;
  version?: string;
}

export interface RunJSSourceFileChange extends VscFileChange {
  operation: 'upsert' | 'delete';
  expectedBlobHash: string | null;
}

export interface RunJSSourceSaveChangesInput {
  locator: RunJSSourceLocator;
  repoId: string;
  baseCommitId: string | null;
  baseOwnerFingerprint: string;
  message: string;
  changes: RunJSSourceFileChange[];
  entryPath?: string;
  version?: string;
}

export interface RunJSSourceImportZipInput {
  locator: RunJSSourceLocator;
  zipBase64: string;
}

export interface RunJSSourceImportZipResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  files: Array<{
    path: string;
    content: string;
    language?: string;
    mode?: string;
  }>;
  manifest: {
    entryPath: string | null;
    runtimeVersion: string | null;
  };
  entryPath: string;
  fileCount: number;
  diagnostics: RunJSWorkspaceDiagnostic[];
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
  items: VscCommitRecord[];
  nextBeforeSeq: number | null;
}

export interface RunJSSourceDiffInput {
  locator: RunJSSourceLocator;
  repoId: string;
  fromCommitId: string;
  toCommitId: string;
}

export interface RunJSSourceDiffResult extends VscCommitDiffResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  fromCommitId: string;
  toCommitId: string;
}

export interface RunJSSourceGetVersionInput {
  locator: RunJSSourceLocator;
  repoId: string;
  commitId: string;
  includeFiles?: boolean;
}

export type RunJSSourceVersionFile = Omit<RunJSSourceWorkspaceFile, 'managed'> & { managed?: boolean };

export interface RunJSSourceVersionResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryRecord;
  commit: VscCommitRecord;
  files: RunJSSourceVersionFile[];
}

export interface RunJSSourceExportZipInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  commitId?: string;
}

export interface RunJSSourceRequestMap<TExportZipResult = unknown> {
  open: {
    input: { locator: RunJSSourceLocator; initialSource?: RunJSSourceInitialSource };
    result: RunJSSourceOpenResult;
  };
  openLatest: {
    input: { locator: RunJSSourceLocator };
    result: RunJSSourceOpenResult;
  };
  restoreFromCode: {
    input: { locator: RunJSSourceLocator };
    result: RunJSSourceOpenResult;
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
    result: TExportZipResult;
  };
  importZip: {
    input: RunJSSourceImportZipInput;
    result: RunJSSourceImportZipResult;
  };
  listHistory: {
    input: RunJSSourceHistoryInput;
    result: RunJSSourceHistoryResult;
  };
  diff: {
    input: RunJSSourceDiffInput;
    result: RunJSSourceDiffResult;
  };
  getVersion: {
    input: RunJSSourceGetVersionInput;
    result: RunJSSourceVersionResult;
  };
}

export const runJSSourceRequestActionNames = [
  'open',
  'openLatest',
  'restoreFromCode',
  'compilePreview',
  'save',
  'saveChanges',
  'exportZip',
  'importZip',
  'listHistory',
  'diff',
  'getVersion',
] as const satisfies readonly (keyof RunJSSourceRequestMap)[];

export type RunJSSourceRequestActionName = (typeof runJSSourceRequestActionNames)[number];

export type RunJSSourceRequestActionInput<
  TAction extends RunJSSourceRequestActionName,
  TExportZipResult = unknown,
> = RunJSSourceRequestMap<TExportZipResult>[TAction]['input'];

export type RunJSSourceRequestActionResult<
  TAction extends RunJSSourceRequestActionName,
  TExportZipResult = unknown,
> = RunJSSourceRequestMap<TExportZipResult>[TAction]['result'];
