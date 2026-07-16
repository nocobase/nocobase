/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface GitHubRepository {
  default_branch: string | null;
  private: boolean;
  archived: boolean;
}

export interface GitHubReference {
  ref: string;
  object: {
    type: string;
    sha: string;
  };
}

export interface GitHubCommit {
  sha: string;
  tree: {
    sha: string;
  };
}

export type GitHubTreeEntryType = 'blob' | 'tree' | 'commit';

export interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: GitHubTreeEntryType;
  sha: string;
  size?: number;
}

export interface GitHubTree {
  sha: string;
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

export interface GitHubBlob {
  sha: string;
  content: string;
  encoding: string;
  size: number;
}

export interface GitHubCreatedObject {
  sha: string;
}

export interface GitHubCreateTreeEntry {
  path: string;
  mode: '100644' | '100755';
  type: 'blob';
  sha: string | null;
}

export interface GitHubApi {
  getRepository(owner: string, repository: string, credential: string | null): Promise<GitHubRepository>;
  getRef(owner: string, repository: string, branch: string, credential: string | null): Promise<GitHubReference | null>;
  getCommit(owner: string, repository: string, sha: string, credential: string | null): Promise<GitHubCommit>;
  getTree(
    owner: string,
    repository: string,
    sha: string,
    recursive: boolean,
    credential: string | null,
  ): Promise<GitHubTree>;
  getBlob(owner: string, repository: string, sha: string, credential: string | null): Promise<GitHubBlob>;
  createBlob(owner: string, repository: string, content: string, credential: string): Promise<GitHubCreatedObject>;
  createTree(
    owner: string,
    repository: string,
    entries: readonly GitHubCreateTreeEntry[],
    baseTree: string | null,
    credential: string,
  ): Promise<GitHubCreatedObject>;
  createCommit(
    owner: string,
    repository: string,
    tree: string,
    parents: readonly string[],
    credential: string,
  ): Promise<GitHubCreatedObject>;
  updateRef(owner: string, repository: string, branch: string, sha: string, credential: string): Promise<void>;
  createRef(owner: string, repository: string, branch: string, sha: string, credential: string): Promise<void>;
}
