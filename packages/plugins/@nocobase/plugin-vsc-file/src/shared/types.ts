/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type VscRepositoryStatus = 'active' | 'archived';

export type VscRefName = 'head';

export type VscFileOperation = 'upsert' | 'delete';

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
  defaultRef: VscRefName;
  headCommitId: string | null;
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
  createdAt?: string;
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

export interface VscFileChange extends VscTreeEntryInput {
  operation?: VscFileOperation;
}
