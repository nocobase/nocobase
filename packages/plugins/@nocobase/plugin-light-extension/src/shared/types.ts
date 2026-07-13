/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LightExtensionKind,
} from '../constants';
import type { RunJSSourceLocator } from '@nocobase/plugin-vsc-file';

export type { LightExtensionKind } from '../constants';

export type LightExtensionRepoLifecycleStatus = (typeof LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES)[number];

export type LightExtensionRepoHealthStatus = (typeof LIGHT_EXTENSION_REPO_HEALTH_STATUSES)[number];

export type LightExtensionEntryHealthStatus = (typeof LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES)[number];

export type LightExtensionReferenceResolvedStatus = (typeof LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES)[number];

export type LightExtensionFileOperation = 'upsert' | 'delete';

export type LightExtensionIncludeContentMode = 'none' | 'selected' | 'all';

export interface LightExtensionRepoRecord {
  id: string;
  name: string;
  normalizedName: string;
  title?: string | null;
  description?: string | null;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
  healthStatus: LightExtensionRepoHealthStatus;
  headCommitId: string | null;
  lastCompiledAt?: string | null;
  entryCount?: number;
  entryKinds?: Partial<Record<LightExtensionKind, number>>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionCreateRepoInput {
  name: string;
  title?: string | null;
  description?: string | null;
  zipBase64?: string;
  initialFiles?: LightExtensionTreeEntryInput[];
  message?: string;
}

export interface LightExtensionInspectSourceArchiveInput {
  repoId: string;
  zipBase64: string;
}

export interface LightExtensionInspectSourceArchiveResult {
  files: LightExtensionTreeEntryInput[];
}

export interface LightExtensionChangeLifecycleInput {
  repoId: string;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
}

export interface LightExtensionDeleteRepoInput {
  repoId: string;
}

export interface LightExtensionTreeEntryInput {
  path: string;
  content?: string;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

export interface LightExtensionFileChange extends LightExtensionTreeEntryInput {
  operation?: LightExtensionFileOperation;
}

export interface LightExtensionCommitRecord {
  id: string;
  repoId: string;
  hash: string;
  seq: number;
  parentCommitId: string | null;
  treeHash: string;
  message: string;
  authorId: string | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface LightExtensionPulledFile {
  path: string;
  pathHash: string;
  pathLowerHash: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
  content?: string;
}

export interface LightExtensionStoredTree {
  hash: string;
  entryCount: number;
  byteSize: number;
}

export interface LightExtensionPullResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord | null;
  tree: LightExtensionStoredTree | null;
  unchanged: boolean;
  files?: LightExtensionPulledFile[];
}

export interface LightExtensionFileResult extends LightExtensionPulledFile {
  content: string;
}

export interface LightExtensionPushInput {
  repoId: string;
  message: string;
  files: LightExtensionFileChange[];
  allowEmptyCommit?: boolean;
}

export interface LightExtensionPushResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord;
  tree: LightExtensionStoredTree;
}

export type LightExtensionDiagnosticSeverity = 'error' | 'warning';

export interface LightExtensionDiagnostic {
  code: string;
  severity: LightExtensionDiagnosticSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  kind?: string;
  entryName?: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionEntryRuntimeArtifact {
  code: string;
  sourceMap?: string;
  version: string;
  entryPath: string;
  filesHash?: string;
  diagnostics?: LightExtensionDiagnostic[];
  metadata?: Record<string, unknown>;
}

export interface LightExtensionEntryRecord {
  id: string;
  repoId: string;
  target: 'client';
  kind: string;
  entryName: string;
  entryPath: string;
  metaPath: string | null;
  settingsPath: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
  compiledCommitId: string | null;
  runtimeArtifact: LightExtensionEntryRuntimeArtifact | null;
  runtimeVersion: string | null;
  surfaceStyle: string | null;
  runtimeCodeHash: string | null;
  artifactHash: string | null;
  filesHash: string | null;
  settingsDefaultsHash: string | null;
  compiledAt: string | null;
  healthStatus: LightExtensionEntryHealthStatus;
  diagnostics: LightExtensionDiagnostic[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type LightExtensionSaveSourceInput = Omit<LightExtensionPushInput, 'allowEmptyCommit'>;

export type LightExtensionCompileEntryStatus = 'success' | 'failed' | 'skipped';

export interface LightExtensionSaveSourceCompileEntryResult {
  entryId: string;
  entryName: string;
  kind: string;
  entryPath: string;
  status: LightExtensionCompileEntryStatus;
  diagnostics: LightExtensionDiagnostic[];
  artifact?: LightExtensionCompilePreviewArtifactSummary;
  failureCode?: string;
}

export interface LightExtensionSaveSourceResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord;
  tree: LightExtensionStoredTree;
  compile: {
    status: 'success' | 'skipped';
    entries: LightExtensionSaveSourceCompileEntryResult[];
  };
  diagnostics: LightExtensionDiagnostic[];
}

export interface LightExtensionValidationLimits {
  maxRepoFiles: number;
  maxEntryFiles: number;
  maxFileBytes: number;
  maxRepoBytes: number;
  maxEntries: number;
  maxSyncBatchFiles: number;
  maxZipBytes: number;
  maxZipCompressionRatio: number;
  maxJsonBytes: number;
  maxSettingsSchemaDepth: number;
}

export interface LightExtensionCapabilities {
  allowedPaths: {
    repo: string[];
    entries: Record<string, string[]>;
  };
  schemaSubset: {
    allowedTypes: string[];
    allowedKeywords: string[];
    maxDepth: number;
  };
  xComponentWhitelist: string[];
  limits: LightExtensionValidationLimits;
  writePolicy: {
    validateFinalWorkspaceOnPush: boolean;
    allowDeleteExistingInvalidPaths: boolean;
  };
  supportedKinds: LightExtensionKind[];
  validatorVersion: string;
  sdkTemplateVersion: string;
}

export interface LightExtensionCompilePreviewArtifactSummary {
  version: string;
  entryPath: string;
  filesHash?: string;
  metadata?: Record<string, unknown>;
}

export type LightExtensionCompilePreviewEntryStatus = 'success' | 'failed' | 'skipped';

export interface LightExtensionCompilePreviewEntryResult {
  entryId: string | null;
  repoId: string;
  target: 'client';
  kind: string;
  entryName: string;
  entryPath: string | null;
  status: LightExtensionCompilePreviewEntryStatus;
  accepted: boolean;
  diagnostics: LightExtensionDiagnostic[];
  failureCode?: string;
  artifact?: LightExtensionCompilePreviewArtifactSummary;
}

export interface LightExtensionCompilePreviewResult {
  repo: LightExtensionRepoRecord;
  commitId: string | null;
  accepted: boolean;
  diagnostics: LightExtensionDiagnostic[];
  entries: LightExtensionCompilePreviewEntryResult[];
}

export interface LightExtensionWorkspacePreviewFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export interface LightExtensionWorkspacePreviewInput {
  repoId: string;
  entryId?: string | null;
  kind: LightExtensionKind;
  entryPath: string;
  runtimeVersion?: string;
  files: LightExtensionWorkspacePreviewFile[];
}

export interface LightExtensionWorkspacePreviewResult {
  accepted: boolean;
  diagnostics: LightExtensionDiagnostic[];
  failureCode?: string;
  artifact?: LightExtensionEntryRuntimeArtifact;
}

export interface LightExtensionSelectableEntrySummary {
  id: string;
  repoId: string;
  kind: string;
  entryName: string;
  entryPath: string;
  title: string | null;
  settingsSchema: Record<string, unknown> | null;
  settingsDefaultsHash: string;
  artifactHash?: string;
  runtimeCodeHash: string;
  runtimeAvailable: true;
}

export type LightExtensionSelectableEntryRecord = LightExtensionSelectableEntrySummary;

export interface LightExtensionSelectableEntriesInput {
  repoId?: string;
  kind?: LightExtensionKind;
}

export interface LightExtensionRuntimeSourceBinding extends Record<string, unknown> {
  type: 'light-extension-entry';
  repoId: string;
  repoTitle?: string | null;
  entryId: string;
  entryTitle?: string | null;
  entryName?: string | null;
  entryPath?: string | null;
  kind: string;
}

export interface LightExtensionMoveSourceWorkspaceFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export type LightExtensionMoveSourceDestination =
  | {
      type: 'existing';
      repoId: string;
    }
  | {
      type: 'new';
      name: string;
      title?: string | null;
      description?: string | null;
    };

export interface LightExtensionMoveSourceInput {
  locator: RunJSSourceLocator;
  expectedOwnerFingerprint: string;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  entryPath: string;
  version: string;
  files: LightExtensionMoveSourceWorkspaceFile[];
  destination: LightExtensionMoveSourceDestination;
  entryName: string;
  entryTitle?: string | null;
}

export interface LightExtensionMoveSourceResult {
  repo: LightExtensionRepoRecord;
  entry: LightExtensionEntryRecord;
  binding: LightExtensionRuntimeSourceBinding;
  ownerFingerprint: string;
}

export interface LightExtensionMoveToInlineInput {
  locator: RunJSSourceLocator;
  repoId: string;
  entryId: string;
  entryPath: string;
  kind: LightExtensionKind;
  version: string;
  files: LightExtensionMoveSourceWorkspaceFile[];
}

export interface LightExtensionMoveToInlineResult {
  runJSRepoId: string;
  commitId: string;
  ownerFingerprint: string;
  code: string;
  version: string;
  entryPath: string;
  filesHash?: string;
  sourceRef: {
    type: 'vsc-file';
    repoId: string;
    commitId: string;
    entry: string;
  };
}

export interface LightExtensionRuntimeResolveInput {
  sourceMode: 'light-extension';
  sourceBinding: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown> | null;
}

export interface LightExtensionRuntimeCacheMetadata {
  etag: string;
  immutable: boolean;
}

export interface LightExtensionRuntimeResolveResult {
  entryId: string;
  entryPath: string;
  artifactHash: string;
  artifactUrl: string;
  runtimeCodeHash: string;
  version: string;
  settings: Record<string, unknown>;
  settingsHash: string;
}

export interface LightExtensionRuntimeArtifactRecord {
  artifactHash: string;
  runtimeCodeHash: string;
  code: string;
  sourceMap?: string;
  version: string;
  entryPath: string;
  runtimeContract: string;
  byteSize: number;
}

export type LightExtensionReferenceOwnerKind =
  | 'flowModel.step'
  | 'flowModel.fieldSettings'
  | 'flowModel.actionSettings'
  | 'flowModel.itemSettings'
  | 'flowModel.runjsHost';

export interface LightExtensionFlowModelOwnerLocator {
  kind: 'flowModel.step';
  modelUid: string;
  use: 'JSBlockModel';
  stepPath: ['stepParams', 'jsSettings'];
}

export interface LightExtensionModelOwnerLocator {
  kind: Exclude<LightExtensionReferenceOwnerKind, 'flowModel.step'>;
  modelUid?: string;
  use?: string;
  stepPath?: string[];
  hostPath?: string[];
  descriptor?: string;
}

export type LightExtensionReferenceOwnerLocator = LightExtensionFlowModelOwnerLocator | LightExtensionModelOwnerLocator;

export interface LightExtensionReferenceOwnerAdapterContract {
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  title: string;
  locatorContract: string;
  modelUse?: string;
}

export interface LightExtensionReferenceRecord {
  id: string;
  repoId: string;
  entryId: string;
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  ownerLocatorHash: string;
  settingsHash: string;
  resolvedStatus: LightExtensionReferenceResolvedStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionReferenceListInput {
  repoId?: string;
  entryId?: string;
  ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
}

export interface LightExtensionReferenceRebuildInput {
  rootUid?: string;
  ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
  repoId?: string;
  dryRun?: boolean;
}

export type LightExtensionReferenceRebuildItemAction = 'upsert' | 'remove' | 'owner_missing';

export interface LightExtensionReferenceRebuildItem {
  action: LightExtensionReferenceRebuildItemAction;
  kind?: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocatorHash: string;
  repoId?: string;
  entryId?: string;
  resolvedStatus?: LightExtensionReferenceResolvedStatus;
  reasonCode?: string;
}

export interface LightExtensionReferenceRebuildResult {
  dryRun?: boolean;
  scanned: number;
  upserted: number;
  removed: number;
  ownerMissing: number;
  statusCounts: Partial<Record<LightExtensionReferenceResolvedStatus, number>>;
  items?: LightExtensionReferenceRebuildItem[];
}
