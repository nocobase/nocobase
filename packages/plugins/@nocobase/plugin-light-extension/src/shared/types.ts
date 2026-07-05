/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LIGHT_EXTENSION_REPO_HEALTH_STATUSES, LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES } from '../constants';

export type LightExtensionRepoLifecycleStatus = (typeof LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES)[number];

export type LightExtensionRepoHealthStatus = (typeof LIGHT_EXTENSION_REPO_HEALTH_STATUSES)[number];

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
