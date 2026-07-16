/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { RemoteHttpRequestConfig, RemoteHttpRequester } from '../../../security/RemoteHttpClient';
import { GitHubApiClient, GITHUB_API_ORIGIN } from '../GitHubApiClient';

describe('GitHubApiClient', () => {
  it('uses the fixed GitHub origin, safe headers, anonymous reads, and encoded branch paths', async () => {
    const requests: RemoteHttpRequestConfig[] = [];
    const requester: RemoteHttpRequester = async <T>(config: RemoteHttpRequestConfig) => {
      requests.push(config);
      return {
        status: 200,
        data: { ref: 'refs/heads/feature/safe', object: { type: 'commit', sha: 'head1' } } as T,
      };
    };
    const client = new GitHubApiClient({ requester });

    await client.getRef('nocobase', 'repo', 'feature/safe', null);

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: `${GITHUB_API_ORIGIN}/repos/nocobase/repo/git/ref/heads/feature%2Fsafe`,
      method: 'GET',
      maxRedirects: 0,
    });
    expect(requests[0].headers).toMatchObject({
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    });
    expect(requests[0].headers).not.toHaveProperty('Authorization');
  });

  it('covers GitHub Git Data endpoints and sends credentials only as Authorization', async () => {
    const requests: RemoteHttpRequestConfig[] = [];
    const requester: RemoteHttpRequester = async <T>(config: RemoteHttpRequestConfig) => {
      requests.push(config);
      return { status: 200, data: { sha: 'created1', tree: [], truncated: false } as T };
    };
    const client = new GitHubApiClient({ requester });

    await client.getRepository('owner', 'repository', 'test-credential');
    await client.getCommit('owner', 'repository', 'commit1', 'test-credential');
    await client.getTree('owner', 'repository', 'tree1', true, 'test-credential');
    await client.getBlob('owner', 'repository', 'blob1', 'test-credential');
    await client.createBlob('owner', 'repository', 'hello\n', 'test-credential');
    await client.createTree(
      'owner',
      'repository',
      [{ path: 'src/index.ts', mode: '100644', type: 'blob', sha: 'blob2' }],
      'tree1',
      'test-credential',
    );
    await client.createCommit('owner', 'repository', 'tree2', ['commit1'], 'test-credential');
    await client.updateRef('owner', 'repository', 'main', 'commit2', 'test-credential');
    await client.createRef('owner', 'repository', 'new/branch', 'commit2', 'test-credential');

    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/repos/owner/repository',
      '/repos/owner/repository/git/commits/commit1',
      '/repos/owner/repository/git/trees/tree1',
      '/repos/owner/repository/git/blobs/blob1',
      '/repos/owner/repository/git/blobs',
      '/repos/owner/repository/git/trees',
      '/repos/owner/repository/git/commits',
      '/repos/owner/repository/git/refs/heads/main',
      '/repos/owner/repository/git/refs',
    ]);
    expect(new URL(requests[2].url).search).toBe('?recursive=1');
    expect(requests.every((request) => request.headers.Authorization === 'Bearer test-credential')).toBe(true);
    expect(requests.every((request) => !request.url.includes('test-credential'))).toBe(true);
    expect(requests[4].data).toEqual({ content: Buffer.from('hello\n').toString('base64'), encoding: 'base64' });
    expect(requests[5].data).toEqual({
      base_tree: 'tree1',
      tree: [{ path: 'src/index.ts', mode: '100644', type: 'blob', sha: 'blob2' }],
    });
    expect(requests[6].data).toEqual({ message: 'Sync VSC snapshot', tree: 'tree2', parents: ['commit1'] });
    expect(requests[7].data).toEqual({ sha: 'commit2', force: false });
    expect(requests[8].data).toEqual({ ref: 'refs/heads/new/branch', sha: 'commit2' });
  });

  it('treats a missing ref as revision null without hiding other errors', async () => {
    const requester = vi.fn(async () => {
      throw { response: { status: 404, data: { message: 'not found' }, headers: {} } };
    });
    const client = new GitHubApiClient({ requester });

    await expect(client.getRef('owner', 'repository', 'missing', null)).resolves.toBeNull();
    await expect(client.getRepository('owner', 'repository', null)).rejects.toMatchObject({
      code: 'REMOTE_NOT_FOUND',
    });
  });

  it.each([409, 422])('maps ref update status %s to a safe remote-changed error', async (status) => {
    const credential = 'github_pat_never-serialize-this-value';
    const requester = vi.fn(async () => {
      throw {
        message: credential,
        config: { headers: { Authorization: `Bearer ${credential}` } },
        response: {
          status,
          data: { message: credential },
          headers: { 'x-github-request-id': 'safe-request-id' },
        },
      };
    });
    const client = new GitHubApiClient({ requester });

    const error = await client
      .updateRef('owner', 'repository', 'main', 'commit2', credential)
      .catch((reason) => reason);

    expect(error).toMatchObject({
      code: 'REMOTE_CHANGED',
      details: { provider: 'github', operation: 'update-ref', requestId: 'safe-request-id' },
    });
    expect(error).not.toHaveProperty('cause');
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('request');
    expect(error).not.toHaveProperty('response');
    expect(JSON.stringify(error)).not.toContain(credential);

    await expect(client.createRef('owner', 'repository', 'main', 'commit2', credential)).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: { provider: 'github', operation: 'create-ref' },
    });
  });

  it('maps provider failures without retaining response bodies or request configuration', async () => {
    const credential = 'github_pat_another-never-serialize-value';
    const requester = vi.fn(async () => {
      throw {
        message: `Token ${credential}`,
        cause: new Error(credential),
        config: { headers: { Authorization: credential } },
        response: {
          status: 401,
          data: { documentation_url: credential },
          headers: { 'x-github-request-id': 'safe-id' },
        },
      };
    });
    const client = new GitHubApiClient({ requester });

    const error = await client.getRepository('owner', 'repository', credential).catch((reason) => reason);

    expect(error).toMatchObject({ code: 'AUTH_FAILED', details: { requestId: 'safe-id' } });
    expect(JSON.stringify(error)).not.toContain(credential);
    expect(error).not.toHaveProperty('cause');
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('response');
  });
});
