/**
 * The knowledge base in the browser (`/api/knowledge`, `server/routes/api.ts`): the queries of a space's view, a
 * document, its versions, search and proposals, and the writes. Every query key starts with `knowledge`, so one
 * invalidation (a write here, or the `knowledge` realtime announcement) refreshes every open view. Headless: an
 * application composes these hooks into pages of its own as well as the plugin's.
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
import { useEffect, useMemo } from 'react';

import {
  KNOWLEDGE_TOPIC,
  type AcceptKnowledgeProposalRequest,
  type CreateKnowledgeDocRequest,
  type KnowledgeChunking,
  type KnowledgeChunkingConfig,
  type KnowledgeDoc,
  type KnowledgeDocIndex,
  type KnowledgeEffectiveAccess,
  type KnowledgePermissions,
  type KnowledgeProposal,
  type KnowledgeProposalStatus,
  type KnowledgeSearchHit,
  type KnowledgeSubject,
  type KnowledgeSubjectType,
  type KnowledgeTree,
  type KnowledgeUnindexedDoc,
  type KnowledgeVersion,
  type MoveKnowledgeDocRequest,
  type ProposeKnowledgeRequest,
  type ReplaceKnowledgePermissionsRequest,
  type SpaceRef,
  type UpdateKnowledgeDocRequest,
} from '../shared/knowledge.js';

const spaceKey = (space: SpaceRef) => `${space.scope}:${space.scopeId}`;

/** A query key: every key of the knowledge base starts with `knowledge`. */
export type KnowledgeQueryKey = readonly unknown[];

export const knowledgeKeys: {
  readonly all: readonly ['knowledge'];
  tree(space: SpaceRef, archived: boolean): KnowledgeQueryKey;
  doc(id: string): KnowledgeQueryKey;
  versions(id: string): KnowledgeQueryKey;
  version(id: string, version: number): KnowledgeQueryKey;
  search(space: SpaceRef, q: string, explain?: boolean): KnowledgeQueryKey;
  docIndex(id: string): KnowledgeQueryKey;
  unindexed(space: SpaceRef): KnowledgeQueryKey;
  chunking(space: SpaceRef): KnowledgeQueryKey;
  proposals(
    space: SpaceRef | null,
    status?: KnowledgeProposalStatus,
  ): KnowledgeQueryKey;
  proposal(id: string): KnowledgeQueryKey;
  permissions(id: string): KnowledgeQueryKey;
  access(id: string): KnowledgeQueryKey;
  subjects(space: SpaceRef, q: string): KnowledgeQueryKey;
} = {
  all: ['knowledge'],
  tree: (space, archived) => ['knowledge', 'tree', spaceKey(space), archived],
  doc: (id) => ['knowledge', 'doc', id],
  versions: (id) => ['knowledge', 'versions', id],
  version: (id, version) => ['knowledge', 'version', id, version],
  search: (space, q, explain = false) => [
    'knowledge',
    'search',
    spaceKey(space),
    q,
    explain,
  ],
  docIndex: (id) => ['knowledge', 'index', id],
  unindexed: (space) => ['knowledge', 'unindexed', spaceKey(space)],
  chunking: (space) => ['knowledge', 'chunking', spaceKey(space)],
  proposals: (space, status = 'pending') => [
    'knowledge',
    'proposals',
    space ? spaceKey(space) : '*',
    status,
  ],
  proposal: (id) => ['knowledge', 'proposal', id],
  permissions: (id) => ['knowledge', 'permissions', id],
  access: (id) => ['knowledge', 'access', id],
  subjects: (space, q) => ['knowledge', 'subjects', spaceKey(space), q],
};

/** Subjects to grant, with the types the picker groups them by. */
export interface KnowledgeSubjectResults {
  readonly subjects: readonly KnowledgeSubject[];
  readonly types: readonly KnowledgeSubjectType[];
}

const base = 'knowledge';
const LIST_PAGE_SIZE = 100;
const docPath = (id: string) => `${base}/docs/${encodeURIComponent(id)}`;

export class KnowledgeApi {
  public constructor(private readonly api: ApiClient) {}

  private async data<T>(
    request: Parameters<ApiClient['request']>[0],
  ): Promise<T> {
    return (await this.api.request<{ readonly data: T }>(request)).data;
  }

  /** A paged list's first `pageSize` items: the views show at most the newest hundred. */
  private list<T>(request: Parameters<ApiClient['request']>[0]): Promise<T[]> {
    return this.data<T[]>({
      ...request,
      query: { ...request.query, pageSize: LIST_PAGE_SIZE },
    });
  }

  public async tree(
    space: SpaceRef,
    archived: boolean,
    signal?: AbortSignal,
  ): Promise<KnowledgeTree> {
    const spaces = await this.data<KnowledgeTree['spaces']>({
      path: `${base}/spaces`,
      query: {
        scope: space.scope,
        scopeId: space.scopeId,
        ...(archived ? { archived: 'true' } : {}),
      },
      signal,
    });
    return { spaces };
  }

  public doc(id: string, signal?: AbortSignal): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({ path: docPath(id), signal });
  }

  public versions(
    id: string,
    signal?: AbortSignal,
  ): Promise<KnowledgeVersion[]> {
    return this.list<KnowledgeVersion>({
      path: `${docPath(id)}/versions`,
      signal,
    });
  }

  public version(
    id: string,
    version: number,
    signal?: AbortSignal,
  ): Promise<KnowledgeVersion> {
    return this.data<KnowledgeVersion>({
      path: `${docPath(id)}/versions/${version}`,
      signal,
    });
  }

  public search(
    space: SpaceRef,
    q: string,
    signal?: AbortSignal,
    explain = false,
  ): Promise<KnowledgeSearchHit[]> {
    return this.data<KnowledgeSearchHit[]>({
      path: `${base}/search`,
      query: {
        scope: space.scope,
        scopeId: space.scopeId,
        q,
        ...(explain ? { explain: 'true' } : {}),
      },
      signal,
    });
  }

  /** A document's sections and where they stand in the semantic index. */
  public docIndex(
    id: string,
    signal?: AbortSignal,
  ): Promise<KnowledgeDocIndex> {
    return this.data<KnowledgeDocIndex>({
      path: `${docPath(id)}/index`,
      signal,
    });
  }

  /** Queues a document's sections for the semantic index again. */
  public reindex(id: string): Promise<KnowledgeDocIndex> {
    return this.data<KnowledgeDocIndex>({
      method: 'POST',
      path: `${docPath(id)}/reindex`,
    });
  }

  /** The documents of a space whose sections are not all indexed; null while semantic search is off. */
  public async unindexed(
    space: SpaceRef,
    signal?: AbortSignal,
  ): Promise<KnowledgeUnindexedDoc[] | null> {
    const answer = await this.api.request<{
      readonly data: KnowledgeUnindexedDoc[];
      readonly meta: { readonly enabled: boolean };
    }>({
      path: `${base}/indexing`,
      query: { scope: space.scope, scopeId: space.scopeId },
      signal,
    });
    return answer.meta.enabled ? answer.data : null;
  }

  /** How a space is cut into sections. */
  public chunking(
    space: SpaceRef,
    signal?: AbortSignal,
  ): Promise<KnowledgeChunkingConfig> {
    return this.data<KnowledgeChunkingConfig>({
      path: `${base}/chunking`,
      query: { scope: space.scope, scopeId: space.scopeId },
      signal,
    });
  }

  /** Sets a space's own chunking, or follows the default again (`null`). */
  public setChunking(
    space: SpaceRef,
    override: KnowledgeChunking | null,
  ): Promise<KnowledgeChunkingConfig> {
    return this.data<KnowledgeChunkingConfig>({
      method: 'PUT',
      path: `${base}/chunking`,
      json: { scope: space.scope, scopeId: space.scopeId, override },
    });
  }

  public proposals(
    space: SpaceRef | null,
    signal?: AbortSignal,
    status: KnowledgeProposalStatus = 'pending',
  ): Promise<KnowledgeProposal[]> {
    return this.list<KnowledgeProposal>({
      path: `${base}/proposals`,
      query: {
        status,
        ...(space ? { scope: space.scope, scopeId: space.scopeId } : {}),
      },
      signal,
    });
  }

  public proposal(
    id: string,
    signal?: AbortSignal,
  ): Promise<KnowledgeProposal> {
    return this.data<KnowledgeProposal>({
      path: `${base}/proposals/${encodeURIComponent(id)}`,
      signal,
    });
  }

  public create(input: CreateKnowledgeDocRequest): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${base}/docs`,
      json: input,
    });
  }

  public update(
    id: string,
    input: UpdateKnowledgeDocRequest,
  ): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({
      method: 'PATCH',
      path: docPath(id),
      json: input,
    });
  }

  public move(
    id: string,
    input: MoveKnowledgeDocRequest,
  ): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${docPath(id)}/move`,
      json: input,
    });
  }

  /** A new file entry in `space` (under `parentId`); its text is extracted after. */
  public upload(
    space: SpaceRef,
    file: File,
    options: {
      readonly parentId?: string | null;
      readonly title?: string;
    } = {},
  ): Promise<KnowledgeDoc> {
    const form = new FormData();
    form.append('scope', space.scope);
    form.append('scopeId', space.scopeId);
    if (options.parentId) form.append('parentId', options.parentId);
    if (options.title) form.append('title', options.title);
    form.append('file', file);
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${base}/docs/upload`,
      body: form,
    });
  }

  /** A file entry's next version: another file, against the version read. */
  public replaceFile(
    id: string,
    file: File,
    expectedVersion: number,
  ): Promise<KnowledgeDoc> {
    const form = new FormData();
    form.append('expectedVersion', String(expectedVersion));
    form.append('file', file);
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${docPath(id)}/replaceFile`,
      body: form,
    });
  }

  /**
   * Proposes a file for someone who may edit to decide: a new file entry in `space` (under `parentId`), or the next
   * version of the file entry `docId`, written against `baseVersion`.
   */
  public proposeFile(
    input:
      | {
          readonly kind: 'create';
          readonly space: SpaceRef;
          readonly parentId?: string | null;
          readonly reason: string;
        }
      | {
          readonly kind: 'update';
          readonly docId: string;
          readonly baseVersion: number;
          readonly reason: string;
        },
    file: File,
  ): Promise<KnowledgeProposal> {
    const form = new FormData();
    form.append('kind', input.kind);
    form.append('reason', input.reason);
    if (input.kind === 'create') {
      form.append('scope', input.space.scope);
      form.append('scopeId', input.space.scopeId);
      if (input.parentId) form.append('parentId', input.parentId);
    } else {
      form.append('docId', input.docId);
      form.append('baseVersion', String(input.baseVersion));
    }
    form.append('file', file);
    return this.data<KnowledgeProposal>({
      method: 'POST',
      path: `${base}/proposals/upload`,
      body: form,
    });
  }

  /**
   * Proposes a change for someone who may edit to decide: an article's next version (`update`, written against
   * `baseVersion`), a new article (`create`), or that a document still holds (`verify`).
   */
  public propose(input: ProposeKnowledgeRequest): Promise<KnowledgeProposal> {
    return this.data<KnowledgeProposal>({
      method: 'POST',
      path: `${base}/proposals`,
      json: input,
    });
  }

  /** A node's mode, entries and what it inherits, for whoever manages it. */
  public permissions(
    id: string,
    signal?: AbortSignal,
  ): Promise<KnowledgePermissions> {
    return this.data<KnowledgePermissions>({
      path: `${docPath(id)}/permissions`,
      signal,
    });
  }

  /** Replaces a node's mode and entries. */
  public replacePermissions(
    id: string,
    input: ReplaceKnowledgePermissionsRequest,
  ): Promise<KnowledgePermissions> {
    return this.data<KnowledgePermissions>({
      method: 'PUT',
      path: `${docPath(id)}/permissions`,
      json: input,
    });
  }

  /** The viewer's access to a node, and where it comes from. */
  public access(
    id: string,
    signal?: AbortSignal,
  ): Promise<KnowledgeEffectiveAccess> {
    return this.data<KnowledgeEffectiveAccess>({
      path: `${docPath(id)}/access`,
      signal,
    });
  }

  /** Subjects to grant in a space, matching `q`. */
  public async subjects(
    space: SpaceRef,
    q: string,
    signal?: AbortSignal,
  ): Promise<KnowledgeSubjectResults> {
    const answer = await this.api.request<{
      readonly data: KnowledgeSubject[];
      readonly meta: { readonly types: KnowledgeSubjectType[] };
    }>({
      path: `${base}/subjects`,
      query: { scope: space.scope, scopeId: space.scopeId, q, pageSize: 20 },
      signal,
    });
    return { subjects: answer.data, types: answer.meta.types };
  }

  /** Extracts a file's text again, after it failed. */
  public reparse(id: string): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${docPath(id)}/reparse`,
      json: {},
    });
  }

  public act(
    id: string,
    action: 'archive' | 'restore' | 'verify',
  ): Promise<KnowledgeDoc> {
    return this.data<KnowledgeDoc>({
      method: 'POST',
      path: `${docPath(id)}/${action}`,
    });
  }

  public decide(
    id: string,
    decision: 'accept' | 'reject',
    input: AcceptKnowledgeProposalRequest = {},
  ): Promise<KnowledgeProposal> {
    return this.data<KnowledgeProposal>({
      method: 'POST',
      path: `${base}/proposals/${encodeURIComponent(id)}/${decision}`,
      json: input,
    });
  }
}

export function useKnowledgeApi(): KnowledgeApi {
  const api = useApiClient();
  return useMemo(() => new KnowledgeApi(api), [api]);
}

/** Refetches open knowledge views when the server announces a change. */
export function useKnowledgeRefresh(): void {
  const realtime = useService(realtimeClientToken);
  const queryClient = useQueryClient();
  useEffect(() => {
    const stop = realtime.subscribe<unknown>(KNOWLEDGE_TOPIC, () => {
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    });
    return () => stop?.();
  }, [realtime, queryClient]);
}

export function useKnowledgeTree(
  space: SpaceRef,
  archived = false,
): UseQueryResult<KnowledgeTree> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.tree(space, archived),
    queryFn: ({ signal }) => api.tree(space, archived, signal),
    retry: false,
  });
}

export function useKnowledgeDoc(
  id: string | null,
): UseQueryResult<KnowledgeDoc> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.doc(id ?? ''),
    queryFn: ({ signal }) => api.doc(id!, signal),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useKnowledgeVersions(
  id: string,
): UseQueryResult<KnowledgeVersion[]> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.versions(id),
    queryFn: ({ signal }) => api.versions(id, signal),
  });
}

export function useKnowledgeVersion(
  id: string,
  version: number | null,
): UseQueryResult<KnowledgeVersion> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.version(id, version ?? 0),
    queryFn: ({ signal }) => api.version(id, version!, signal),
    enabled: version !== null && version > 0,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useKnowledgeSearch(
  space: SpaceRef,
  q: string,
  explain = false,
): UseQueryResult<KnowledgeSearchHit[]> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.search(space, q, explain),
    queryFn: ({ signal }) => api.search(space, q, signal, explain),
    enabled: q.trim().length > 0,
  });
}

/** While sections wait for the semantic index, how often their state is read again. */
const INDEX_POLL_MS = 5000;

export function useKnowledgeDocIndex(
  id: string | null,
): UseQueryResult<KnowledgeDocIndex> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.docIndex(id ?? ''),
    queryFn: ({ signal }) => api.docIndex(id!, signal),
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.state === 'pending' ? INDEX_POLL_MS : false,
  });
}

export function useKnowledgeUnindexed(
  space: SpaceRef | null,
): UseQueryResult<KnowledgeUnindexedDoc[] | null> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.unindexed(space ?? { scope: '', scopeId: '' }),
    queryFn: ({ signal }) => api.unindexed(space!, signal),
    enabled: space !== null,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.some((doc) => doc.pending > 0) ? INDEX_POLL_MS : false,
  });
}

export function useKnowledgeChunking(
  space: SpaceRef | null,
): UseQueryResult<KnowledgeChunkingConfig> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.chunking(space ?? { scope: '', scopeId: '' }),
    queryFn: ({ signal }) => api.chunking(space!, signal),
    enabled: space !== null,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.rechunking ? INDEX_POLL_MS : false,
  });
}

export function useKnowledgeProposals(
  space: SpaceRef | null,
  status: KnowledgeProposalStatus = 'pending',
): UseQueryResult<KnowledgeProposal[]> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.proposals(space, status),
    queryFn: ({ signal }) => api.proposals(space, signal, status),
    retry: false,
  });
}

export function useKnowledgeProposal(
  id: string | null,
): UseQueryResult<KnowledgeProposal> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.proposal(id ?? ''),
    queryFn: ({ signal }) => api.proposal(id!, signal),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useKnowledgePermissions(
  id: string | null,
): UseQueryResult<KnowledgePermissions> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.permissions(id ?? ''),
    queryFn: ({ signal }) => api.permissions(id!, signal),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useKnowledgeAccess(
  id: string | null,
): UseQueryResult<KnowledgeEffectiveAccess> {
  const api = useKnowledgeApi();
  return useQuery({
    queryKey: knowledgeKeys.access(id ?? ''),
    queryFn: ({ signal }) => api.access(id!, signal),
    enabled: Boolean(id),
    retry: false,
  });
}
