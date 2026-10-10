/**
 * Studio's pull requests in the browser (`/api/git`, `server/git/routes.ts`). The marks of many issues are read in
 * one request: each mark asks for its issue, and the asks of one moment are sent together.
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
  type ApiClient,
} from '@nocobase/app-client';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  STUDIO_GIT_TOPIC,
  MARKS_MAX,
  type CreatedGitRepo,
  type CreateGitRepoRequest,
  type GitAppManifestForm,
  type GitConnection,
  type GitConnectionReach,
  type GitConnectionUse,
  type GitPersonalAuthorizations,
  type GitProjectSettings,
  type GitRepoChoice,
  type GitRepoSettings,
  type GitStatus,
  type GitDeviceAuthorization,
  type GitDevicePoll,
  type GitPersonalAuthorization,
  type GitWorkflow,
  type SaveGitConnectionRequest,
  type StartGitAppManifestRequest,
  type IssuePullRequest,
  type IssuePullRequests,
  type PullRequestMark,
  type PullRequestMergePreflight,
  type UpdateGitRepoRequest,
} from '../../shared/git.js';

export const gitKeys = {
  all: ['studio', 'git'] as const,
  issue: (issueId: string) => ['studio', 'git', 'issue', issueId] as const,
  mark: (issueId: string) => ['studio', 'git', 'mark', issueId] as const,
  repo: (resourceId: string) => ['studio', 'git', 'repo', resourceId] as const,
  status: ['studio', 'git', 'status'] as const,
  connections: ['studio', 'git', 'connections'] as const,
  reach: (connectionId: string) =>
    ['studio', 'git', 'connections', connectionId, 'reach'] as const,
  uses: (connectionId: string) =>
    ['studio', 'git', 'connections', connectionId, 'uses'] as const,
  repos: (connectionId: string, query: string, pageToken: string | null) =>
    ['studio', 'git', 'repos', connectionId, query, pageToken] as const,
  templateRepos: (connectionId: string, query: string) =>
    ['studio', 'git', 'template-repos', connectionId, query] as const,
  templateRepo: (connectionId: string, fullName: string) =>
    ['studio', 'git', 'template-repo', connectionId, fullName] as const,
  workflows: (connectionId: string, repo: string) =>
    ['studio', 'git', 'workflows', connectionId, repo] as const,
  me: ['studio', 'git', 'me'] as const,
  project: (projectId: string) =>
    ['studio', 'git', 'project', projectId] as const,
  preflight: (issueId: string, pullRequestId: string) =>
    ['studio', 'git', 'preflight', issueId, pullRequestId] as const,
};

const prPath = (id: string) => `git/pullRequests/${encodeURIComponent(id)}`;

/** A page of a connection's repositories; `nextPageToken` asks for the next one. */
export interface GitRepoPage {
  readonly items: readonly GitRepoChoice[];
  readonly nextPageToken: string | null;
}

async function repoPage(
  api: ApiClient,
  path: string,
  query: Record<string, string>,
  signal?: AbortSignal,
): Promise<GitRepoPage> {
  const body = await api.request<{
    data: GitRepoChoice[];
    meta: { nextPageToken?: string };
  }>({ path, query, signal });
  return { items: body.data, nextPageToken: body.meta.nextPageToken ?? null };
}

export class GitApi {
  public constructor(private readonly api: ApiClient) {}

  public async list(
    issue: string,
    signal?: AbortSignal,
  ): Promise<IssuePullRequests> {
    const { data, meta } = await this.api.request<{
      data: IssuePullRequests['data'];
      meta: Omit<IssuePullRequests, 'data'>;
    }>({ path: 'git/pullRequests', query: { issueId: issue }, signal });
    return {
      data,
      suggestions: meta.suggestions,
      canMerge: meta.canMerge,
      canLink: meta.canLink,
      applicable: meta.applicable,
    };
  }

  public async link(issue: string, url: string): Promise<IssuePullRequest> {
    const body = await this.api.request<{ data: IssuePullRequest }>({
      method: 'POST',
      path: 'git/pullRequests',
      json: { issueId: issue, url },
    });
    return body.data;
  }

  public async unlink(issue: string, id: string): Promise<void> {
    await this.api.request({
      method: 'DELETE',
      path: prPath(id),
      query: { issueId: issue },
    });
  }

  public async setCounted(
    issue: string,
    id: string,
    counted: boolean,
  ): Promise<IssuePullRequest> {
    const body = await this.api.request<{ data: IssuePullRequest }>({
      method: 'PATCH',
      path: prPath(id),
      query: { issueId: issue },
      json: { autoCompleteDisabled: !counted },
    });
    return body.data;
  }

  public async act(
    issue: string,
    id: string,
    action: 'refresh' | 'markMerged',
  ): Promise<IssuePullRequest> {
    const body = await this.api.request<{ data: IssuePullRequest }>({
      method: 'POST',
      path: `${prPath(id)}/${action}`,
      query: { issueId: issue },
    });
    return body.data;
  }

  /** Whether and how it may be merged, read from GitHub now (and stored, so a `POST`). */
  public async preflight(
    issue: string,
    id: string,
    signal?: AbortSignal,
  ): Promise<PullRequestMergePreflight> {
    const body = await this.api.request<{ data: PullRequestMergePreflight }>({
      method: 'POST',
      path: `${prPath(id)}/checkMerge`,
      query: { issueId: issue },
      signal,
    });
    return body.data;
  }

  /** Squash-merges the head the person confirmed. */
  public async merge(
    issue: string,
    id: string,
    expectedHeadSha: string,
  ): Promise<IssuePullRequest> {
    const body = await this.api.request<{ data: IssuePullRequest }>({
      method: 'POST',
      path: `${prPath(id)}/merge`,
      query: { issueId: issue },
      json: { expectedHeadSha },
    });
    return body.data;
  }

  public async marks(
    issueIds: readonly string[],
  ): Promise<Record<string, PullRequestMark>> {
    const body = await this.api.request<{
      data: Record<string, PullRequestMark>;
    }>({ path: 'git/marks', query: { issueIds: issueIds.join(',') } });
    return body.data;
  }

  public async repo(resourceId: string): Promise<GitRepoSettings> {
    const body = await this.api.request<{ data: GitRepoSettings }>({
      path: `git/resources/${encodeURIComponent(resourceId)}`,
    });
    return body.data;
  }

  public async status(signal?: AbortSignal): Promise<GitStatus> {
    return (
      await this.api.request<{ data: GitStatus }>({
        path: 'git/status',
        signal,
      })
    ).data;
  }

  public async connections(signal?: AbortSignal): Promise<GitConnection[]> {
    return (
      await this.api.request<{ data: GitConnection[] }>({
        path: 'git/connections',
        signal,
      })
    ).data;
  }

  /** Adds a connection (no `id`) or changes one; credentials left out stay. */
  public async saveConnection(
    id: string | null,
    input: SaveGitConnectionRequest,
  ): Promise<GitConnection> {
    return (
      await this.api.request<{ data: GitConnection }>({
        method: id ? 'PATCH' : 'POST',
        path: id
          ? `git/connections/${encodeURIComponent(id)}`
          : 'git/connections',
        json: input,
      })
    ).data;
  }

  /** The form that creates an app on the host from Studio's manifest, for the browser to post. */
  public async startAppManifest(
    input: StartGitAppManifestRequest,
  ): Promise<GitAppManifestForm> {
    return (
      await this.api.request<{ data: GitAppManifestForm }>({
        method: 'POST',
        path: 'git/connections/startAppManifest',
        json: input,
      })
    ).data;
  }

  /** How many repositories it reaches now, read live from the host. */
  public async reach(
    id: string,
    signal?: AbortSignal,
  ): Promise<GitConnectionReach> {
    return (
      await this.api.request<{ data: GitConnectionReach }>({
        path: `git/connections/${encodeURIComponent(id)}/reach`,
        signal,
      })
    ).data;
  }

  /** The projects' working directories that link a repository through it. */
  public async uses(
    id: string,
    signal?: AbortSignal,
  ): Promise<GitConnectionUse[]> {
    return (
      await this.api.request<{ data: GitConnectionUse[] }>({
        path: `git/connections/${encodeURIComponent(id)}/usage`,
        signal,
      })
    ).data;
  }

  public async removeConnection(id: string): Promise<void> {
    await this.api.request({
      method: 'DELETE',
      path: `git/connections/${encodeURIComponent(id)}`,
    });
  }

  public repos(
    connectionId: string,
    query: string,
    pageToken: string | null,
    signal?: AbortSignal,
  ): Promise<GitRepoPage> {
    return repoPage(
      this.api,
      `git/connections/${encodeURIComponent(connectionId)}/repositories`,
      { q: query, ...(pageToken ? { pageToken } : {}) },
      signal,
    );
  }

  /**
   * The template repositories among one page of those a connection reaches, whose name holds `query` (the new-project
   * wizard); a page may hold none while `nextPageToken` says there are more.
   */
  public templateRepos(
    connectionId: string,
    pageToken: string | null,
    query: string,
    signal?: AbortSignal,
  ): Promise<GitRepoPage> {
    return repoPage(
      this.api,
      `git/connections/${encodeURIComponent(connectionId)}/templateRepositories`,
      { ...(query ? { q: query } : {}), ...(pageToken ? { pageToken } : {}) },
      signal,
    );
  }

  /** A template repository the connection can read (`owner/name`), public ones of other accounts included. */
  public async templateRepo(
    connectionId: string,
    repo: string,
    signal?: AbortSignal,
  ): Promise<GitRepoChoice> {
    const [owner = '', name = ''] = repo.split('/');
    return (
      await this.api.request<{ data: GitRepoChoice }>({
        path: `git/connections/${encodeURIComponent(connectionId)}/templateRepositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
        signal,
      })
    ).data;
  }

  /** A repository's workflows (`owner/name`), one of which may initialize a new project. */
  public async workflows(
    connectionId: string,
    repo: string,
    signal?: AbortSignal,
  ): Promise<GitWorkflow[]> {
    const [owner = '', name = ''] = repo.split('/');
    return (
      await this.api.request<{ data: GitWorkflow[] }>({
        path: `git/connections/${encodeURIComponent(connectionId)}/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/workflows`,
        signal,
      })
    ).data;
  }

  public async createRepo(
    connectionId: string,
    input: CreateGitRepoRequest,
  ): Promise<CreatedGitRepo> {
    return (
      await this.api.request<{ data: CreatedGitRepo }>({
        method: 'POST',
        path: `git/connections/${encodeURIComponent(connectionId)}/repositories`,
        json: input,
      })
    ).data;
  }

  public async me(signal?: AbortSignal): Promise<GitPersonalAuthorizations> {
    return (
      await this.api.request<{ data: GitPersonalAuthorizations }>({
        path: 'git/authorizations',
        signal,
      })
    ).data;
  }

  /** Starts the device flow of the connection's app: the code to enter on the host. */
  public async startDeviceFlow(
    connectionId: string,
  ): Promise<GitDeviceAuthorization> {
    return (
      await this.api.request<{ data: GitDeviceAuthorization }>({
        method: 'POST',
        path: `git/authorizations/${encodeURIComponent(connectionId)}/startDeviceFlow`,
      })
    ).data;
  }

  public async pollDeviceFlow(
    connectionId: string,
    handle: string,
  ): Promise<GitDevicePoll> {
    return (
      await this.api.request<{ data: GitDevicePoll }>({
        method: 'POST',
        path: `git/authorizations/${encodeURIComponent(connectionId)}/pollDeviceFlow`,
        json: { handle },
      })
    ).data;
  }

  /** Checks and stores the person's own personal access token. */
  public async savePersonalToken(
    connectionId: string,
    token: string,
  ): Promise<GitPersonalAuthorization> {
    return (
      await this.api.request<{ data: GitPersonalAuthorization }>({
        method: 'POST',
        path: `git/authorizations/${encodeURIComponent(connectionId)}/useToken`,
        json: { token },
      })
    ).data;
  }

  /** Where to send the person to authorize the connection's app. */
  public async authorize(connectionId: string): Promise<string> {
    return (
      await this.api.request<{ data: { url: string } }>({
        method: 'POST',
        path: `git/authorizations/${encodeURIComponent(connectionId)}/authorize`,
      })
    ).data.url;
  }

  public async disconnect(connectionId: string): Promise<void> {
    await this.api.request({
      method: 'DELETE',
      path: `git/authorizations/${encodeURIComponent(connectionId)}`,
    });
  }

  public async projectSettings(
    projectId: string,
    signal?: AbortSignal,
  ): Promise<GitProjectSettings> {
    return (
      await this.api.request<{ data: GitProjectSettings }>({
        path: `git/projects/${encodeURIComponent(projectId)}`,
        signal,
      })
    ).data;
  }

  public async saveProjectSettings(
    projectId: string,
    input: GitProjectSettings,
  ): Promise<GitProjectSettings> {
    return (
      await this.api.request<{ data: GitProjectSettings }>({
        method: 'PUT',
        path: `git/projects/${encodeURIComponent(projectId)}`,
        json: input,
      })
    ).data;
  }

  public async dismissSuggestion(
    issue: string,
    pullRequestId: string,
  ): Promise<void> {
    await this.api.request({
      method: 'DELETE',
      path: `${prPath(pullRequestId)}/suggestion`,
      query: { issueId: issue },
    });
  }

  public async updateRepo(
    resourceId: string,
    input: UpdateGitRepoRequest,
  ): Promise<GitRepoSettings> {
    const body = await this.api.request<{ data: GitRepoSettings }>({
      method: 'PATCH',
      path: `git/resources/${encodeURIComponent(resourceId)}`,
      json: input,
    });
    return body.data;
  }
}

export function useGitApi(): GitApi {
  return new GitApi(useApiClient());
}

/**
 * Follows `STUDIO_GIT_TOPIC` while mounted: when the server stores something new about a pull request (a webhook
 * delivery, a poll, a merge), the pull requests are read again at once. An open merge confirmation keeps its own read
 * of GitHub.
 */
export function useGitRealtime(): void {
  const realtime = useService(realtimeClientToken);
  const queryClient = useQueryClient();
  useEffect(
    () =>
      realtime.subscribe<unknown>(STUDIO_GIT_TOPIC, () => {
        void queryClient.invalidateQueries({
          queryKey: gitKeys.all,
          predicate: (query) => query.queryKey[2] !== 'preflight',
        });
      }),
    [realtime, queryClient],
  );
}

export function useIssuePullRequests(
  issueId: string,
  revision: number,
): UseQueryResult<IssuePullRequests> {
  const api = useGitApi();
  useGitRealtime();
  return useQuery({
    queryKey: [...gitKeys.issue(issueId), revision],
    queryFn: ({ signal }) => api.list(issueId, signal),
    staleTime: 15_000,
  });
}

/** Collects the marks asked for within one moment into one request per API client. */
const batches = new WeakMap<
  ApiClient,
  {
    ids: Set<string>;
    waiting: Promise<Record<string, PullRequestMark>> | null;
  }
>();

function loadMark(
  api: ApiClient,
  issueId: string,
): Promise<PullRequestMark | null> {
  let batch = batches.get(api);
  if (!batch) {
    batch = { ids: new Set(), waiting: null };
    batches.set(api, batch);
  }
  const current = batch;
  current.ids.add(issueId);
  current.waiting ??= new Promise<Record<string, PullRequestMark>>(
    (resolve, reject) => {
      setTimeout(() => {
        const ids = [...current.ids];
        current.ids = new Set();
        current.waiting = null;
        const chunks: string[][] = [];
        for (let index = 0; index < ids.length; index += MARKS_MAX)
          chunks.push(ids.slice(index, index + MARKS_MAX));
        Promise.all(chunks.map((chunk) => new GitApi(api).marks(chunk)))
          .then((parts) =>
            resolve(
              parts.reduce<Record<string, PullRequestMark>>(
                (all, part) => ({ ...all, ...part }),
                {},
              ),
            ),
          )
          .catch(reject);
      }, 20);
    },
  );
  return current.waiting.then((marks) => marks[issueId] ?? null);
}

export function usePullRequestMark(
  issueId: string,
  revision: number,
): UseQueryResult<PullRequestMark | null> {
  const api = useApiClient();
  return useQuery({
    queryKey: [...gitKeys.mark(issueId), revision],
    queryFn: () => loadMark(api, issueId),
    staleTime: 30_000,
  });
}

/** A repository's settings; `watch` reads them every few seconds, while the webhook wizard waits for GitHub's ping. */
export function useRepoSettings(
  resourceId: string,
  watch = false,
): UseQueryResult<GitRepoSettings> {
  const api = useGitApi();
  useGitRealtime();
  return useQuery({
    queryKey: gitKeys.repo(resourceId),
    queryFn: () => api.repo(resourceId),
    refetchInterval: watch ? 3000 : false,
  });
}

/**
 * Whether git shows at all (a connection exists) and the connections a picker offers. Every git entry point reads it,
 * so without a connection nothing about git shows.
 */
export function useGitStatus(): UseQueryResult<GitStatus> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.status,
    queryFn: ({ signal }) => api.status(signal),
    staleTime: 60_000,
  });
}

/** The workspace's connections, for whoever may read them. */
export function useGitConnections(
  enabled = true,
): UseQueryResult<GitConnection[]> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.connections,
    queryFn: ({ signal }) => api.connections(signal),
    enabled,
  });
}

/** How many repositories a connection reaches, read live once per page view (a host call). */
export function useGitConnectionReach(
  connectionId: string,
): UseQueryResult<GitConnectionReach> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.reach(connectionId),
    queryFn: ({ signal }) => api.reach(connectionId, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** The working directories that link a repository through a connection, read once it is asked for. */
export function useGitConnectionUses(
  connectionId: string,
  enabled: boolean,
): UseQueryResult<GitConnectionUse[]> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.uses(connectionId),
    queryFn: ({ signal }) => api.uses(connectionId, signal),
    enabled,
  });
}

/** The repositories a connection reaches, read live and searched by name. */
export function useGitRepos(
  connectionId: string | null,
  query: string,
  pageToken: string | null,
): UseQueryResult<GitRepoPage> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.repos(connectionId ?? '', query, pageToken),
    queryFn: ({ signal }) =>
      api.repos(connectionId ?? '', query, pageToken, signal),
    enabled: connectionId !== null,
    staleTime: 30_000,
  });
}

/** The viewer's own authorizations. */
export function useGitMe(): UseQueryResult<GitPersonalAuthorizations> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.me,
    queryFn: ({ signal }) => api.me(signal),
  });
}

export function useGitProjectSettings(
  projectId: string,
): UseQueryResult<GitProjectSettings> {
  const api = useGitApi();
  return useQuery({
    queryKey: gitKeys.project(projectId),
    queryFn: ({ signal }) => api.projectSettings(projectId, signal),
  });
}
