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
  LIGHT_EXTENSION_SUPPORTED_KINDS,
} from '../constants';

export type LightExtensionRepoLifecycleStatus = (typeof LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES)[number];

export type LightExtensionRepoHealthStatus = (typeof LIGHT_EXTENSION_REPO_HEALTH_STATUSES)[number];

export type LightExtensionKind = (typeof LIGHT_EXTENSION_SUPPORTED_KINDS)[number];

export type LightExtensionEnabledKind = (typeof LIGHT_EXTENSION_ENABLED_KINDS)[number];

export type LightExtensionEntryHealthStatus = (typeof LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES)[number];

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
