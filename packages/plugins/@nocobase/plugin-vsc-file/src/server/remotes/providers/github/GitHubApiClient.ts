/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSyncError } from '../../RemoteSyncAdapter';
import { RemoteHttpClient, type RemoteHttpRequester } from '../../security/RemoteHttpClient';
import { githubObjectPath, githubRefPath, githubRepositoryPath } from './githubPath';
import type {
  GitHubApi,
  GitHubBlob,
  GitHubCommit,
  GitHubCreatedObject,
  GitHubCreateTreeEntry,
  GitHubReference,
  GitHubRepository,
  GitHubTree,
} from './githubTypes';

export const GITHUB_API_ORIGIN = 'https://api.github.com';

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

export interface GitHubApiClientOptions {
  requester?: RemoteHttpRequester;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxConcurrency?: number;
}

export class GitHubApiClient implements GitHubApi {
  private readonly http: RemoteHttpClient;

  constructor(options: GitHubApiClientOptions = {}) {
    this.http = new RemoteHttpClient({
      provider: 'github',
      allowedOrigin: GITHUB_API_ORIGIN,
      timeoutMs: options.timeoutMs,
      maxResponseBytes: options.maxResponseBytes,
      maxConcurrency: options.maxConcurrency,
      requester: options.requester,
    });
  }

  async getRepository(owner: string, repository: string, credential: string | null): Promise<GitHubRepository> {
    return this.get<GitHubRepository>(githubRepositoryPath(owner, repository), credential, 'get-repository');
  }

  async getRef(
    owner: string,
    repository: string,
    branch: string,
    credential: string | null,
  ): Promise<GitHubReference | null> {
    try {
      return await this.get<GitHubReference>(githubRefPath(owner, repository, branch), credential, 'get-ref');
    } catch (error) {
      if (error instanceof RemoteSyncError && error.code === 'REMOTE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  async getCommit(owner: string, repository: string, sha: string, credential: string | null): Promise<GitHubCommit> {
    return this.get<GitHubCommit>(githubObjectPath(owner, repository, 'commits', sha), credential, 'get-commit');
  }

  async getTree(
    owner: string,
    repository: string,
    sha: string,
    recursive: boolean,
    credential: string | null,
  ): Promise<GitHubTree> {
    const suffix = recursive ? '?recursive=1' : '';
    return this.get<GitHubTree>(
      `${githubObjectPath(owner, repository, 'trees', sha)}${suffix}`,
      credential,
      'get-tree',
    );
  }

  async getBlob(owner: string, repository: string, sha: string, credential: string | null): Promise<GitHubBlob> {
    return this.get<GitHubBlob>(githubObjectPath(owner, repository, 'blobs', sha), credential, 'get-blob');
  }

  async createBlob(
    owner: string,
    repository: string,
    content: string,
    credential: string,
  ): Promise<GitHubCreatedObject> {
    return this.post<GitHubCreatedObject>(
      `${githubRepositoryPath(owner, repository)}/git/blobs`,
      credential,
      {
        content: Buffer.from(content, 'utf8').toString('base64'),
        encoding: 'base64',
      },
      'create-blob',
    );
  }

  async createTree(
    owner: string,
    repository: string,
    entries: readonly GitHubCreateTreeEntry[],
    baseTree: string | null,
    credential: string,
  ): Promise<GitHubCreatedObject> {
    return this.post<GitHubCreatedObject>(
      `${githubRepositoryPath(owner, repository)}/git/trees`,
      credential,
      {
        ...(baseTree ? { base_tree: baseTree } : {}),
        tree: entries,
      },
      'create-tree',
    );
  }

  async createCommit(
    owner: string,
    repository: string,
    tree: string,
    parents: readonly string[],
    credential: string,
  ): Promise<GitHubCreatedObject> {
    return this.post<GitHubCreatedObject>(
      `${githubRepositoryPath(owner, repository)}/git/commits`,
      credential,
      {
        message: 'Sync VSC snapshot',
        tree,
        parents,
      },
      'create-commit',
    );
  }

  async updateRef(owner: string, repository: string, branch: string, sha: string, credential: string): Promise<void> {
    try {
      await this.http.request<unknown>({
        method: 'PATCH',
        path: `${githubRepositoryPath(owner, repository)}/git/refs/heads/${encodeURIComponent(branch)}`,
        credential,
        headers: githubHeaders,
        data: { sha, force: false },
        operation: 'update-ref',
      });
    } catch (error) {
      throw mapRefConflict(error, 'update-ref');
    }
  }

  async createRef(owner: string, repository: string, branch: string, sha: string, credential: string): Promise<void> {
    try {
      await this.http.request<unknown>({
        method: 'POST',
        path: `${githubRepositoryPath(owner, repository)}/git/refs`,
        credential,
        headers: githubHeaders,
        data: { ref: `refs/heads/${branch}`, sha },
        operation: 'create-ref',
      });
    } catch (error) {
      throw mapRefConflict(error, 'create-ref');
    }
  }

  private async get<T>(path: string, credential: string | null, operation: string): Promise<T> {
    const response = await this.http.request<T>({
      method: 'GET',
      path,
      credential,
      headers: githubHeaders,
      operation,
    });
    return response.data;
  }

  private async post<T>(path: string, credential: string, data: unknown, operation: string): Promise<T> {
    const response = await this.http.request<T>({
      method: 'POST',
      path,
      credential,
      headers: githubHeaders,
      data,
      operation,
    });
    return response.data;
  }
}

function mapRefConflict(error: unknown, operation: string): RemoteSyncError {
  if (!(error instanceof RemoteSyncError) || (error.code !== 'UNSAFE_CONTENT' && error.code !== 'REMOTE_CHANGED')) {
    throw error;
  }
  return new RemoteSyncError('REMOTE_CHANGED', 'GitHub branch changed before the operation completed', {
    details: {
      provider: 'github',
      operation,
      reasonCode: 'remote-changed',
      requestId: error.details?.requestId,
      rateLimitReset: error.details?.rateLimitReset,
    },
  });
}
