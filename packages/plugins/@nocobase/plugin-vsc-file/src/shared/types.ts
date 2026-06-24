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

export interface VscErrorResponseItem {
  code: VscErrorCode;
  message: string;
  status: number;
  details?: VscErrorDetails;
}
