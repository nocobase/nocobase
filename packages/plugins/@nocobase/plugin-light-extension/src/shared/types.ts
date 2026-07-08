/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LIGHT_EXTENSION_ENABLED_KINDS,
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
} from '../constants';

export type LightExtensionRepoLifecycleStatus = (typeof LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES)[number];

export type LightExtensionRepoHealthStatus = (typeof LIGHT_EXTENSION_REPO_HEALTH_STATUSES)[number];

export type LightExtensionKind = (typeof LIGHT_EXTENSION_SUPPORTED_KINDS)[number];

export type LightExtensionEnabledKind = (typeof LIGHT_EXTENSION_ENABLED_KINDS)[number];

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
  version: number;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
  healthStatus: LightExtensionRepoHealthStatus;
  headCommitId: string | null;
  lastScannedCommitId?: string | null;
  lastError?: string | null;
  lastScannedAt?: string | null;
  lastPublishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionCreateRepoInput {
  name: string;
  title?: string | null;
  description?: string | null;
  initialFiles?: LightExtensionTreeEntryInput[];
  message?: string;
}

export interface LightExtensionChangeLifecycleInput {
  repoId: string;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
  expectedLifecycleStatus?: LightExtensionRepoLifecycleStatus;
  expectedVersion?: number;
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
  baseCommitId: string | null;
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
  activePublicationId: string | null;
  healthStatus: LightExtensionEntryHealthStatus;
  diagnostics: LightExtensionDiagnostic[];
  validatorVersion?: string | null;
  lastScannedCommitId?: string | null;
  lastScannedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  enabledKinds: LightExtensionEnabledKind[];
  validatorVersion: string;
  sdkTemplateVersion: string;
}

export interface LightExtensionScanEntryResult {
  entry: LightExtensionEntryRecord;
  created: boolean;
}

export interface LightExtensionScanResult {
  repo: LightExtensionRepoRecord;
  commitId: string | null;
  accepted: boolean;
  diagnostics: LightExtensionDiagnostic[];
  entries: LightExtensionScanEntryResult[];
  capabilities: LightExtensionCapabilities;
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
  activePublicationId?: string | null;
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

export interface LightExtensionPublicationArtifactMetadata {
  version: string;
  entryPath: string;
  filesHash?: string;
  metadata?: Record<string, unknown>;
  diagnostics?: LightExtensionDiagnostic[];
}

export interface LightExtensionPublicationMetadataRecord {
  id: string;
  repoId: string;
  entryId: string;
  commitId: string;
  entryPath: string;
  target: 'client';
  kind: string;
  surfaceStyle: string;
  runtimeVersion: string;
  artifact: LightExtensionPublicationArtifactMetadata;
  settingsSchemaSnapshot: Record<string, unknown> | null;
  settingsDefaultsSnapshot: unknown;
  settingsSchemaHash: string;
  settingsDefaultsHash: string;
  filesHash: string;
  runtimeCodeHash: string;
  diagnostics: LightExtensionDiagnostic[];
  createdById?: string | null;
  createdFromRequestSource?: string | null;
  createdAt?: string | null;
}

export interface LightExtensionSelectableEntryRecord extends Omit<LightExtensionEntryRecord, 'settingsSchema'> {
  activePublicationId: string;
  activePublication: LightExtensionPublicationMetadataRecord;
}

export interface LightExtensionEntryPublicationsSelectorResult {
  entryId: string;
  activePublicationId: string | null;
  publications: LightExtensionPublicationMetadataRecord[];
}

export interface LightExtensionSelectableEntriesInput {
  repoId?: string;
  kind?: LightExtensionKind;
}

export type LightExtensionSourceBindingVersionPolicy = 'pinned' | 'follow-active';

export interface LightExtensionRuntimeSourceBinding {
  type: 'light-extension-entry';
  repoId: string;
  repoTitle?: string | null;
  entryId: string;
  entryTitle?: string | null;
  entryName?: string | null;
  kind: string;
  publicationId: string;
  versionPolicy?: LightExtensionSourceBindingVersionPolicy;
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
  publicationId: string;
  entryId: string;
  runtimeCodeHash: string;
  code: string;
  version: string;
  sourceMap?: string;
  settings: Record<string, unknown>;
  cache: LightExtensionRuntimeCacheMetadata;
}

export type LightExtensionReferenceOwnerKind =
  | 'flowModel.step'
  | 'flowModel.fieldSettings'
  | 'flowModel.actionSettings'
  | 'flowModel.itemSettings'
  | 'flowModel.runjsHost'
  | 'flowModel.eventSettings';

export interface LightExtensionFlowModelOwnerLocator {
  kind: 'flowModel.step';
  modelUid: string;
  use: 'JSBlockModel';
  stepPath: ['stepParams', 'jsSettings'];
}

export interface LightExtensionPlaceholderOwnerLocator {
  kind: Exclude<LightExtensionReferenceOwnerKind, 'flowModel.step'>;
  modelUid?: string;
  use?: string;
  stepPath?: string[];
  hostPath?: string[];
  descriptor?: string;
}

export type LightExtensionReferenceOwnerLocator =
  | LightExtensionFlowModelOwnerLocator
  | LightExtensionPlaceholderOwnerLocator;

export type LightExtensionReferenceOwnerAdapterStatus = 'active' | 'placeholder';

export interface LightExtensionReferenceOwnerAdapterContract {
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  title: string;
  status: LightExtensionReferenceOwnerAdapterStatus;
  locatorContract: string;
  modelUse?: string;
  implementationTask?: string;
  message: string;
  supportsVersionPolicy: boolean;
  supportsImpact: boolean;
  supportsBulkUpgrade: boolean;
  supportsRebuild: boolean;
}

export interface LightExtensionReferenceRecord {
  id: string;
  repoId: string;
  entryId: string;
  publicationId: string | null;
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  ownerLocatorHash: string;
  versionPolicy: LightExtensionSourceBindingVersionPolicy;
  settingsHash: string;
  resolvedStatus: LightExtensionReferenceResolvedStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionReferenceListInput {
  repoId?: string;
  entryId?: string;
  publicationId?: string;
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
  publicationId?: string | null;
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

export type LightExtensionReferenceContractDiagnosticsInput = LightExtensionReferenceRebuildInput;

export interface LightExtensionReferenceContractDiagnosticsResult {
  ownerAdapters: LightExtensionReferenceOwnerAdapterContract[];
  rebuild?: LightExtensionReferenceRebuildResult;
}

export interface LightExtensionSettingsValidationIssue {
  path: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionReferenceImpactInput extends LightExtensionReferenceListInput {
  toPublicationId: string;
  referenceIds?: string[];
}

export interface LightExtensionReferenceImpactItem {
  reference: LightExtensionReferenceRecord;
  targetPublicationId: string;
  settingsValidation: {
    compatible: boolean;
    settingsHash?: string;
    issues: LightExtensionSettingsValidationIssue[];
  };
  upgradeBlockedReason?: string;
}

export interface LightExtensionReferenceImpactResult {
  toPublication: LightExtensionPublicationMetadataRecord;
  references: LightExtensionReferenceImpactItem[];
  summary: {
    total: number;
    upgradable: number;
    incompatible: number;
    skipped: number;
  };
}

export interface LightExtensionBulkUpgradeInput {
  toPublicationId: string;
  referenceIds: string[];
  expectedPublicationIdByReference?: Record<string, string | null>;
  expectedSettingsHashByReference?: Record<string, string>;
}

export type LightExtensionBulkUpgradeItemStatus = 'upgraded' | 'conflict' | 'incompatible' | 'skipped' | 'missing';

export interface LightExtensionBulkUpgradeItemResult {
  referenceId: string;
  status: LightExtensionBulkUpgradeItemStatus;
  publicationId?: string | null;
  settingsHash?: string;
  reasonCode?: string;
  issues?: LightExtensionSettingsValidationIssue[];
}

export interface LightExtensionBulkUpgradeResult {
  toPublication: LightExtensionPublicationMetadataRecord;
  items: LightExtensionBulkUpgradeItemResult[];
  summary: Record<LightExtensionBulkUpgradeItemStatus, number>;
}

export type LightExtensionPublishEntryStatus = 'created' | 'reused' | 'failed' | 'conflict' | 'skipped';

export interface LightExtensionPublishEntryResult {
  entryId: string;
  entryName: string;
  kind: string;
  status: LightExtensionPublishEntryStatus;
  publication?: LightExtensionPublicationMetadataRecord;
  diagnostics: LightExtensionDiagnostic[];
  reasonCode?: string;
}

export interface LightExtensionPublishResult {
  repo: LightExtensionRepoRecord;
  commitId: string;
  clientRequestId: string;
  status: 'success' | 'partial_success' | 'failed';
  httpStatus: 200 | 207 | 422;
  entryResults: LightExtensionPublishEntryResult[];
  diagnostics: LightExtensionDiagnostic[];
}
