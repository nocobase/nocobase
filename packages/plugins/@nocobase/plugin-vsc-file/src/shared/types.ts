/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { defaultVscFileLimits } from './constants';
import type { VscErrorCode, VscErrorDetails } from './errors';

export type VscFileLimits = typeof defaultVscFileLimits;

export type VscRepositoryStatus = 'active' | 'archived';

export type VscRefName = 'head' | 'published' | string;

export type VscDraftStatus = 'active' | 'committed' | 'discarded';

export type VscDraftFileOperation = 'upsert' | 'delete';

export type VscFilePath = string;

export type VscSha256Hex = string;

export type VscFileMode = string;

export interface VscRepositoryOwner {
  ownerType: string;
  ownerId: string;
}

export interface VscRepositoryIdentity extends VscRepositoryOwner {
  name: string;
}

export interface VscRepositoryRecord extends VscRepositoryIdentity {
  id: string;
  status: VscRepositoryStatus;
  defaultRef: string;
  headCommitId: string | null;
  publishedCommitId: string | null;
  headSeq: number;
}

export interface VscCommitRecord {
  id: string;
  repoId: string;
  hash: VscSha256Hex;
  seq: number;
  parentCommitId: string | null;
  treeHash: VscSha256Hex;
  message: string;
  authorId: string | null;
  metadata: Record<string, unknown>;
}

export interface VscRefRecord {
  id: string;
  repoId: string;
  name: VscRefName;
  type: string;
  commitId: string | null;
}

export interface VscTreeEntryInput {
  path: VscFilePath;
  content?: string;
  blobHash?: VscSha256Hex;
  size?: number;
  language?: string;
  mode?: VscFileMode;
}

export interface VscStoredBlob {
  hash: VscSha256Hex;
  size: number;
  content: string;
}

export interface VscNormalizedTreeEntry {
  path: VscFilePath;
  pathHash: VscSha256Hex;
  pathLowerHash: VscSha256Hex;
  blobHash: VscSha256Hex;
  size: number;
  language: string;
  mode: VscFileMode;
}

export interface VscStoredTree {
  hash: VscSha256Hex;
  entryCount: number;
  byteSize: number;
}

export interface VscDraftRecord {
  id: string;
  repoId: string;
  userId: string;
  baseCommitId: string | null;
  status: VscDraftStatus;
  activeKey: string | null;
}

export interface VscDraftFileRecord {
  id: string;
  draftId: string;
  path: VscFilePath;
  pathHash: VscSha256Hex;
  pathLowerHash: VscSha256Hex;
  operation: VscDraftFileOperation;
  blobHash: VscSha256Hex | null;
}

export interface VscDraftFileChange {
  path: VscFilePath;
  operation: VscDraftFileOperation;
  content?: string;
}

export interface VscCommitInput {
  repoId: number | string;
  baseCommitId: number | string | null;
  message: string;
  files: VscTreeEntryInput[];
  allowEmptyCommit?: boolean;
}

export interface VscFileChange extends VscTreeEntryInput {
  operation?: VscDraftFileOperation;
}

export interface VscErrorResponseItem {
  code: VscErrorCode;
  message: string;
  status: number;
  details?: VscErrorDetails;
}
