/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AgentTimelineEventRecord } from '../components/AgentTimeline';
import {
  AgentGatewayApi,
  AgentGatewayApiResponse,
  JsonRecord,
  getApiErrorMessage,
  getObjectRecord,
  getRequiredResponseData,
  getResponseData,
} from '../pages/AgentGatewayPageUtils';

const DEFAULT_CURSOR_PAGE_SIZE = 100;
const DEFAULT_DETAIL_PAGE_SIZE = 20;

type TFunction = (key: string, options?: Record<string, unknown>) => string;
type CursorRequestMode = 'initial' | 'before' | 'after';

export interface RunEventRecord {
  id: string;
  source?: string;
  sequence?: number;
  level?: string;
  eventType?: string;
  message?: string | null;
  payloadJson?: JsonRecord;
  emittedAt?: string;
  createdAt?: string;
}

export interface RunArtifactRecord {
  id: string;
  artifactKey?: string | null;
  artifactType?: string;
  mimeType?: string | null;
  sizeBytes?: number | string | null;
  originalSizeBytes?: number | string | null;
  previewBytes?: number | string | null;
  truncated?: boolean | null;
  storageMode?: string | null;
  contentSha256?: string | null;
  contentText?: string | null;
  metadataJson?: JsonRecord;
}

export interface RunSnapshotRecord {
  id: string;
  snapshotType?: string;
  snapshotJson?: JsonRecord;
  metadataJson?: JsonRecord;
  capturedAt?: string;
}

export interface ApiCallLogRecord {
  id: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  requestSummaryJson?: JsonRecord;
  responseSummaryJson?: JsonRecord;
  errorSummary?: string | null;
  createdAt?: string;
}

export interface DetailPageMeta {
  count: number;
  page: number;
  pageSize: number;
  totalPage: number;
}

export interface ArtifactContentEntry {
  loaded: boolean;
  loading: boolean;
  contentText?: string | null;
  warning?: string;
}

interface CursorPageMeta {
  pageSize: number;
  beforeCursor?: string;
  afterCursor?: string;
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
}

interface ConversationEventsState extends CursorPageMeta {
  runId: string;
  events: AgentTimelineEventRecord[];
  scope: 'run' | 'session';
  warning?: string;
}

interface ConversationEventsPage extends ConversationEventsState {
  mode: CursorRequestMode;
}

interface RunEventsDetailsState extends CursorPageMeta {
  runId: string;
  events: RunEventRecord[];
  warning?: string;
}

interface RunArtifactsDetailsState {
  runId: string;
  artifacts: RunArtifactRecord[];
  artifactMeta: DetailPageMeta;
  snapshots: RunSnapshotRecord[];
  snapshotMeta: DetailPageMeta;
  warnings: {
    artifacts?: string;
    snapshots?: string;
  };
}

interface RunApiLogsDetailsState {
  runId: string;
  apiCallLogs: ApiCallLogRecord[];
  meta: DetailPageMeta;
  warning?: string;
}

interface ArtifactContentState {
  runId: string;
  entries: Record<string, ArtifactContentEntry>;
}

interface ArtifactContentResponse {
  id: string;
  contentText?: string | null;
}

interface RunObservabilityRecord {
  id: string;
  agentSessionId?: string | null;
}

interface UseRunObservabilityDetailsOptions {
  api: AgentGatewayApi;
  t: TFunction;
  selectedRunId?: string;
  run?: RunObservabilityRecord;
  enabled: boolean;
  activeTab: string;
  conversationEnabled: boolean;
  conversationDisabledWarning?: string;
  rawLogsWarning?: string;
  artifactsWarning?: string;
}

interface PageSelection {
  current: number;
  pageSize: number;
}

interface RequestScope {
  runId: string;
  generation: number;
}

interface ConversationEventsRequest extends RequestScope {
  agentSessionId?: string | null;
  requestedMode: 'before' | 'after';
}

interface RunEventsRequest extends RequestScope {
  rawLogsWarning?: string;
  requestedMode: 'initial' | 'before';
}

interface DetailPageRequest extends RequestScope, PageSelection {
  warning?: string;
}

function getNumberMetaValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getStringMetaValue(value: unknown) {
  return typeof value === 'string' && value ? value : undefined;
}

function getResponseMeta<T>(response: AgentGatewayApiResponse<T>) {
  return getObjectRecord(response.data?.meta);
}

function getCursorPageMeta<T>(response: AgentGatewayApiResponse<T[]>): CursorPageMeta {
  const meta = getResponseMeta(response);
  return {
    pageSize: getNumberMetaValue(meta.pageSize) || DEFAULT_CURSOR_PAGE_SIZE,
    beforeCursor: getStringMetaValue(meta.beforeCursor),
    afterCursor: getStringMetaValue(meta.afterCursor),
    hasMoreBefore: meta.hasMoreBefore === true,
    hasMoreAfter: meta.hasMoreAfter === true,
  };
}

function getDetailPageMeta<T>(response: AgentGatewayApiResponse<T[]>, fallback: PageSelection): DetailPageMeta {
  const meta = getResponseMeta(response);
  const rows = getResponseData(response, []);
  const count = getNumberMetaValue(meta.count) ?? rows.length;
  const page = getNumberMetaValue(meta.page) || fallback.current;
  const pageSize = getNumberMetaValue(meta.pageSize) || fallback.pageSize;
  return {
    count,
    page,
    pageSize,
    totalPage: getNumberMetaValue(meta.totalPage) ?? Math.ceil(count / pageSize),
  };
}

export function createDetailPageMeta(page = 1, pageSize = DEFAULT_DETAIL_PAGE_SIZE): DetailPageMeta {
  return {
    count: 0,
    page,
    pageSize,
    totalPage: 0,
  };
}

function getDetailWarning(error: unknown, fallback: string) {
  const detail = getApiErrorMessage(error, '');
  return detail ? `${fallback}: ${detail}` : fallback;
}

function mergeRowsById<Row extends { id: string }>(
  previous: Row[],
  next: Row[],
  mode: Exclude<CursorRequestMode, 'initial'>,
) {
  const rowsById = new Map<string, Row>();
  const orderedRows = mode === 'before' ? [...next, ...previous] : [...previous, ...next];
  for (const row of orderedRows) {
    rowsById.set(row.id, row);
  }
  return [...rowsById.values()];
}

function getDetailRequestKey(kind: 'artifacts' | 'snapshots' | 'api-logs', runId: string, page: PageSelection) {
  return `${kind}:${runId}:${page.current}:${page.pageSize}`;
}

function mergeConversationEventsState(
  previous: ConversationEventsState | null,
  next: ConversationEventsPage,
): ConversationEventsState {
  const { mode, ...nextState } = next;
  if (previous?.runId !== next.runId || previous.scope !== next.scope) {
    return nextState;
  }
  if (mode === 'initial') {
    return previous.events.length > next.events.length ? previous : nextState;
  }
  const events = mergeRowsById(previous.events, next.events, mode);
  if (mode === 'before') {
    return {
      ...previous,
      events,
      beforeCursor: next.beforeCursor,
      hasMoreBefore: next.hasMoreBefore,
      warning: next.warning,
    };
  }
  return {
    ...previous,
    events,
    afterCursor: next.afterCursor,
    hasMoreAfter: next.hasMoreAfter,
    warning: next.warning,
  };
}

function createArtifactsDetailsState(runId: string): RunArtifactsDetailsState {
  return {
    runId,
    artifacts: [],
    artifactMeta: createDetailPageMeta(),
    snapshots: [],
    snapshotMeta: createDetailPageMeta(),
    warnings: {},
  };
}

export function useRunObservabilityDetails({
  api,
  t,
  selectedRunId,
  run,
  enabled,
  activeTab,
  conversationEnabled,
  conversationDisabledWarning,
  rawLogsWarning,
  artifactsWarning,
}: UseRunObservabilityDetailsOptions) {
  const [conversationEventsState, setConversationEventsState] = useState<ConversationEventsState | null>(null);
  const [conversationEventsWarning, setConversationEventsWarning] = useState<string>();
  const [runEventsDetailsState, setRunEventsDetailsState] = useState<RunEventsDetailsState | null>(null);
  const [runArtifactsDetailsState, setRunArtifactsDetailsState] = useState<RunArtifactsDetailsState | null>(null);
  const [runApiLogsDetailsState, setRunApiLogsDetailsState] = useState<RunApiLogsDetailsState | null>(null);
  const [artifactPagination, setArtifactPagination] = useState<PageSelection>({
    current: 1,
    pageSize: DEFAULT_DETAIL_PAGE_SIZE,
  });
  const [snapshotPagination, setSnapshotPagination] = useState<PageSelection>({
    current: 1,
    pageSize: DEFAULT_DETAIL_PAGE_SIZE,
  });
  const [apiLogPagination, setApiLogPagination] = useState<PageSelection>({
    current: 1,
    pageSize: DEFAULT_DETAIL_PAGE_SIZE,
  });
  const [artifactContentState, setArtifactContentState] = useState<ArtifactContentState | null>(null);
  const selectedRunIdRef = useRef(selectedRunId);
  const requestGenerationRef = useRef(0);
  const cancelRequestsRef = useRef<() => void>(() => undefined);
  const conversationEventsStateRef = useRef<ConversationEventsState | null>(null);
  const runEventsDetailsStateRef = useRef<RunEventsDetailsState | null>(null);
  const artifactContentStateRef = useRef<ArtifactContentState | null>(null);
  const artifactContentRequestsRef = useRef(new Set<string>());
  const failedDetailRequestsRef = useRef(new Set<string>());

  selectedRunIdRef.current = selectedRunId;

  useEffect(() => {
    conversationEventsStateRef.current = conversationEventsState;
  }, [conversationEventsState]);

  useEffect(() => {
    runEventsDetailsStateRef.current = runEventsDetailsState;
  }, [runEventsDetailsState]);

  useEffect(() => {
    artifactContentStateRef.current = artifactContentState;
  }, [artifactContentState]);

  const isCurrentRequest = useCallback((request: RequestScope) => {
    return request.runId === selectedRunIdRef.current && request.generation === requestGenerationRef.current;
  }, []);

  const reset = useCallback(() => {
    requestGenerationRef.current += 1;
    cancelRequestsRef.current();
    setConversationEventsState(null);
    setConversationEventsWarning(undefined);
    setRunEventsDetailsState(null);
    setRunArtifactsDetailsState(null);
    setRunApiLogsDetailsState(null);
    setArtifactPagination({ current: 1, pageSize: DEFAULT_DETAIL_PAGE_SIZE });
    setSnapshotPagination({ current: 1, pageSize: DEFAULT_DETAIL_PAGE_SIZE });
    setApiLogPagination({ current: 1, pageSize: DEFAULT_DETAIL_PAGE_SIZE });
    setArtifactContentState(null);
    artifactContentRequestsRef.current.clear();
    failedDetailRequestsRef.current.clear();
  }, []);

  useEffect(() => {
    reset();
  }, [reset, selectedRunId]);

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    reset();
  }, [artifactsWarning, conversationEnabled, enabled, rawLogsWarning, reset]);

  const conversationEventsRequest = useRequest(
    async (request: ConversationEventsRequest): Promise<ConversationEventsPage> => {
      const currentState =
        conversationEventsStateRef.current?.runId === request.runId ? conversationEventsStateRef.current : null;
      const requestedCursor =
        request.requestedMode === 'before' ? currentState?.beforeCursor : currentState?.afterCursor;
      const mode: CursorRequestMode = currentState && requestedCursor ? request.requestedMode : 'initial';
      const params = {
        pageSize: DEFAULT_CURSOR_PAGE_SIZE,
        ...(mode === 'before' && requestedCursor ? { beforeCursor: requestedCursor } : {}),
        ...(mode === 'after' && requestedCursor ? { afterCursor: requestedCursor } : {}),
      };
      const requestPage = async (scope: ConversationEventsState['scope']) => {
        const targetId = scope === 'session' ? request.agentSessionId : request.runId;
        if (!targetId) {
          throw new Error(t('No agent session'));
        }
        const response = await api.request<AgentTimelineEventRecord[]>({
          url:
            scope === 'session'
              ? `agent-gateway/agent-sessions/${encodeURIComponent(targetId)}/conversation-events:list`
              : `agent-gateway/runs/${encodeURIComponent(targetId)}/conversation-events:list`,
          method: 'get',
          params,
        });
        return {
          events: getResponseData(response, []),
          meta: getCursorPageMeta(response),
          scope,
        };
      };

      const initialScope = mode === 'initial' ? 'run' : currentState?.scope || 'run';
      let page = await requestPage(initialScope);
      if (mode === 'initial' && !page.events.length && request.agentSessionId) {
        page = await requestPage('session');
      }
      return {
        runId: request.runId,
        events: page.events,
        scope: page.scope,
        ...page.meta,
        mode,
      };
    },
    {
      manual: true,
      onSuccess(data, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        setConversationEventsState((previous) => mergeConversationEventsState(previous, data));
        setConversationEventsWarning(undefined);
      },
      onError(error, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        setConversationEventsState((previous) => (previous?.runId === request.runId ? previous : null));
        setConversationEventsWarning(getDetailWarning(error, t('Agent timeline unavailable')));
      },
    },
  );
  const runConversationEventsRequest = conversationEventsRequest.run;
  const conversationEventsLoading = conversationEventsRequest.loading;
  const requestConversationEvents = useCallback(
    (requestedMode: 'before' | 'after' = 'after') => {
      if (!enabled || !conversationEnabled || !selectedRunId || run?.id !== selectedRunId) {
        return;
      }
      runConversationEventsRequest({
        runId: run.id,
        generation: requestGenerationRef.current,
        agentSessionId: run.agentSessionId,
        requestedMode,
      });
    },
    [conversationEnabled, enabled, run, runConversationEventsRequest, selectedRunId],
  );
  const refreshConversationEvents = useCallback(() => requestConversationEvents('after'), [requestConversationEvents]);
  const loadOlderConversationEvents = useCallback(
    () => requestConversationEvents('before'),
    [requestConversationEvents],
  );

  const runEventsDetailsRequest = useRequest(
    async (request: RunEventsRequest) => {
      const currentState =
        runEventsDetailsStateRef.current?.runId === request.runId ? runEventsDetailsStateRef.current : null;
      const mode = request.requestedMode === 'before' && currentState?.beforeCursor ? 'before' : 'initial';
      if (request.rawLogsWarning) {
        return {
          runId: request.runId,
          events: [],
          pageSize: DEFAULT_CURSOR_PAGE_SIZE,
          beforeCursor: undefined,
          afterCursor: undefined,
          hasMoreBefore: false,
          hasMoreAfter: false,
          warning: request.rawLogsWarning,
          mode,
        };
      }
      const response = await api.request<RunEventRecord[]>({
        url: `agent-gateway/runs/${encodeURIComponent(request.runId)}/events:list`,
        method: 'get',
        params: {
          pageSize: DEFAULT_CURSOR_PAGE_SIZE,
          ...(mode === 'before' && currentState?.beforeCursor ? { beforeCursor: currentState.beforeCursor } : {}),
        },
      });
      return {
        runId: request.runId,
        events: getResponseData(response, []),
        ...getCursorPageMeta(response),
        mode,
      };
    },
    {
      manual: true,
      onSuccess(data, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        const { mode, ...nextState } = data;
        setRunEventsDetailsState((previous) =>
          mode === 'before' && previous?.runId === nextState.runId
            ? {
                ...previous,
                events: mergeRowsById(previous.events, nextState.events, 'before'),
                beforeCursor: nextState.beforeCursor,
                hasMoreBefore: nextState.hasMoreBefore,
                warning: nextState.warning,
              }
            : nextState,
        );
      },
      onError(error, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        setRunEventsDetailsState((previous) => ({
          ...(previous?.runId === request.runId
            ? previous
            : {
                runId: request.runId,
                events: [],
                pageSize: DEFAULT_CURSOR_PAGE_SIZE,
                hasMoreBefore: false,
                hasMoreAfter: false,
              }),
          warning: getDetailWarning(error, t('Events unavailable')),
        }));
      },
    },
  );
  const runRunEventsRequest = runEventsDetailsRequest.run;
  const runEventsLoading = runEventsDetailsRequest.loading;
  const requestRunEvents = useCallback(
    (requestedMode: 'initial' | 'before' = 'initial') => {
      if (!enabled || !selectedRunId || run?.id !== selectedRunId) {
        return;
      }
      runRunEventsRequest({
        runId: run.id,
        generation: requestGenerationRef.current,
        rawLogsWarning,
        requestedMode,
      });
    },
    [enabled, rawLogsWarning, run, runRunEventsRequest, selectedRunId],
  );
  const loadOlderRunEvents = useCallback(() => requestRunEvents('before'), [requestRunEvents]);

  const runArtifactsDetailsRequest = useRequest(
    async (request: DetailPageRequest) => {
      if (request.warning) {
        return {
          runId: request.runId,
          artifacts: [],
          meta: createDetailPageMeta(request.current, request.pageSize),
          warning: request.warning,
        };
      }
      const response = await api.request<RunArtifactRecord[]>({
        url: `agent-gateway/runs/${encodeURIComponent(request.runId)}/artifacts:list`,
        method: 'get',
        params: {
          page: request.current,
          pageSize: request.pageSize,
        },
      });
      return {
        runId: request.runId,
        artifacts: getResponseData(response, []),
        meta: getDetailPageMeta(response, request),
        warning: undefined,
      };
    },
    {
      manual: true,
      onSuccess(data, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.delete(getDetailRequestKey('artifacts', request.runId, request));
        setRunArtifactsDetailsState((previous) => {
          const current = previous?.runId === data.runId ? previous : createArtifactsDetailsState(data.runId);
          return {
            ...current,
            artifacts: data.artifacts,
            artifactMeta: data.meta,
            warnings: {
              ...current.warnings,
              artifacts: data.warning,
            },
          };
        });
      },
      onError(error, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.add(getDetailRequestKey('artifacts', request.runId, request));
        setRunArtifactsDetailsState((previous) => {
          const current = previous?.runId === request.runId ? previous : createArtifactsDetailsState(request.runId);
          return {
            ...current,
            artifactMeta:
              previous?.runId === request.runId
                ? current.artifactMeta
                : createDetailPageMeta(request.current, request.pageSize),
            warnings: {
              ...current.warnings,
              artifacts: getDetailWarning(error, t('Artifacts unavailable')),
            },
          };
        });
      },
    },
  );
  const runRunArtifactsRequest = runArtifactsDetailsRequest.run;
  const runArtifactsLoading = runArtifactsDetailsRequest.loading;
  const requestRunArtifacts = useCallback(() => {
    if (!enabled || !selectedRunId || run?.id !== selectedRunId) {
      return;
    }
    runRunArtifactsRequest({
      runId: run.id,
      generation: requestGenerationRef.current,
      current: artifactPagination.current,
      pageSize: artifactPagination.pageSize,
      warning: artifactsWarning,
    });
  }, [artifactPagination, artifactsWarning, enabled, run, runRunArtifactsRequest, selectedRunId]);

  const runSnapshotsDetailsRequest = useRequest(
    async (request: DetailPageRequest) => {
      if (request.warning) {
        return {
          runId: request.runId,
          snapshots: [],
          meta: createDetailPageMeta(request.current, request.pageSize),
          warning: request.warning,
        };
      }
      const response = await api.request<RunSnapshotRecord[]>({
        url: `agent-gateway/runs/${encodeURIComponent(request.runId)}/snapshots:list`,
        method: 'get',
        params: {
          page: request.current,
          pageSize: request.pageSize,
        },
      });
      return {
        runId: request.runId,
        snapshots: getResponseData(response, []),
        meta: getDetailPageMeta(response, request),
        warning: undefined,
      };
    },
    {
      manual: true,
      onSuccess(data, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.delete(getDetailRequestKey('snapshots', request.runId, request));
        setRunArtifactsDetailsState((previous) => {
          const current = previous?.runId === data.runId ? previous : createArtifactsDetailsState(data.runId);
          return {
            ...current,
            snapshots: data.snapshots,
            snapshotMeta: data.meta,
            warnings: {
              ...current.warnings,
              snapshots: data.warning,
            },
          };
        });
      },
      onError(error, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.add(getDetailRequestKey('snapshots', request.runId, request));
        setRunArtifactsDetailsState((previous) => {
          const current = previous?.runId === request.runId ? previous : createArtifactsDetailsState(request.runId);
          return {
            ...current,
            snapshotMeta:
              previous?.runId === request.runId
                ? current.snapshotMeta
                : createDetailPageMeta(request.current, request.pageSize),
            warnings: {
              ...current.warnings,
              snapshots: getDetailWarning(error, t('Snapshots unavailable')),
            },
          };
        });
      },
    },
  );
  const runRunSnapshotsRequest = runSnapshotsDetailsRequest.run;
  const runSnapshotsLoading = runSnapshotsDetailsRequest.loading;
  const requestRunSnapshots = useCallback(() => {
    if (!enabled || !selectedRunId || run?.id !== selectedRunId) {
      return;
    }
    runRunSnapshotsRequest({
      runId: run.id,
      generation: requestGenerationRef.current,
      current: snapshotPagination.current,
      pageSize: snapshotPagination.pageSize,
      warning: artifactsWarning,
    });
  }, [artifactsWarning, enabled, run, runRunSnapshotsRequest, selectedRunId, snapshotPagination]);

  const runApiLogsDetailsRequest = useRequest(
    async (request: DetailPageRequest) => {
      if (request.warning) {
        return {
          runId: request.runId,
          apiCallLogs: [],
          meta: createDetailPageMeta(request.current, request.pageSize),
          warning: request.warning,
        } satisfies RunApiLogsDetailsState;
      }
      const response = await api.request<ApiCallLogRecord[]>({
        url: `agent-gateway/runs/${encodeURIComponent(request.runId)}/api-call-logs:list`,
        method: 'get',
        params: {
          page: request.current,
          pageSize: request.pageSize,
        },
      });
      return {
        runId: request.runId,
        apiCallLogs: getResponseData(response, []),
        meta: getDetailPageMeta(response, request),
        warning: undefined,
      } satisfies RunApiLogsDetailsState;
    },
    {
      manual: true,
      onSuccess(data, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.delete(getDetailRequestKey('api-logs', request.runId, request));
        setRunApiLogsDetailsState(data);
      },
      onError(error, [request]) {
        if (!isCurrentRequest(request)) {
          return;
        }
        failedDetailRequestsRef.current.add(getDetailRequestKey('api-logs', request.runId, request));
        setRunApiLogsDetailsState((previous) => ({
          ...(previous?.runId === request.runId
            ? previous
            : {
                runId: request.runId,
                apiCallLogs: [],
                meta: createDetailPageMeta(request.current, request.pageSize),
              }),
          warning: getDetailWarning(error, t('API logs unavailable')),
        }));
      },
    },
  );
  const runRunApiLogsRequest = runApiLogsDetailsRequest.run;
  const runApiLogsLoading = runApiLogsDetailsRequest.loading;
  const requestRunApiLogs = useCallback(() => {
    if (!enabled || !selectedRunId || run?.id !== selectedRunId) {
      return;
    }
    runRunApiLogsRequest({
      runId: run.id,
      generation: requestGenerationRef.current,
      current: apiLogPagination.current,
      pageSize: apiLogPagination.pageSize,
      warning: rawLogsWarning,
    });
  }, [apiLogPagination, enabled, rawLogsWarning, run, runRunApiLogsRequest, selectedRunId]);

  cancelRequestsRef.current = () => {
    conversationEventsRequest.cancel();
    runEventsDetailsRequest.cancel();
    runArtifactsDetailsRequest.cancel();
    runSnapshotsDetailsRequest.cancel();
    runApiLogsDetailsRequest.cancel();
  };

  useEffect(
    () => () => {
      requestGenerationRef.current += 1;
      artifactContentRequestsRef.current.clear();
    },
    [],
  );

  const loadArtifactContent = useCallback(
    async (artifact: RunArtifactRecord, force = false) => {
      const runId = selectedRunIdRef.current;
      if (!runId) {
        return;
      }
      const request = {
        runId,
        generation: requestGenerationRef.current,
      } satisfies RequestScope;
      const currentState = artifactContentStateRef.current;
      const currentEntry = currentState?.runId === runId ? currentState.entries[artifact.id] : undefined;
      if (!force && (currentEntry?.loaded || artifact.contentText !== undefined)) {
        return;
      }
      const requestKey = `${request.generation}:${runId}:${artifact.id}`;
      if (artifactContentRequestsRef.current.has(requestKey)) {
        return;
      }
      artifactContentRequestsRef.current.add(requestKey);
      setArtifactContentState((previous) => ({
        runId,
        entries: {
          ...(previous?.runId === runId ? previous.entries : {}),
          [artifact.id]: {
            loaded: false,
            loading: true,
          },
        },
      }));
      try {
        const response = await api.request<ArtifactContentResponse>({
          url: `agent-gateway/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifact.id)}:content`,
          method: 'get',
        });
        const content = getRequiredResponseData(response, t('Artifact content unavailable'));
        if (!isCurrentRequest(request) || content.id !== artifact.id) {
          return;
        }
        setArtifactContentState((previous) => ({
          runId,
          entries: {
            ...(previous?.runId === runId ? previous.entries : {}),
            [artifact.id]: {
              loaded: true,
              loading: false,
              contentText: content.contentText ?? null,
            },
          },
        }));
      } catch (error) {
        if (!isCurrentRequest(request)) {
          return;
        }
        setArtifactContentState((previous) => ({
          runId,
          entries: {
            ...(previous?.runId === runId ? previous.entries : {}),
            [artifact.id]: {
              loaded: false,
              loading: false,
              warning: getDetailWarning(error, t('Artifact content unavailable')),
            },
          },
        }));
      } finally {
        artifactContentRequestsRef.current.delete(requestKey);
      }
    },
    [api, isCurrentRequest, t],
  );

  useEffect(() => {
    if (!enabled || !selectedRunId || run?.id !== selectedRunId) {
      return;
    }
    if (activeTab === 'logs' && runEventsDetailsState?.runId !== selectedRunId && !runEventsLoading) {
      requestRunEvents();
    }
    if (
      activeTab === 'artifacts' &&
      (runArtifactsDetailsState?.runId !== selectedRunId ||
        runArtifactsDetailsState.artifactMeta.page !== artifactPagination.current ||
        runArtifactsDetailsState.artifactMeta.pageSize !== artifactPagination.pageSize) &&
      !failedDetailRequestsRef.current.has(getDetailRequestKey('artifacts', selectedRunId, artifactPagination)) &&
      !runArtifactsLoading
    ) {
      requestRunArtifacts();
    }
    if (
      activeTab === 'artifacts' &&
      (runArtifactsDetailsState?.runId !== selectedRunId ||
        runArtifactsDetailsState.snapshotMeta.page !== snapshotPagination.current ||
        runArtifactsDetailsState.snapshotMeta.pageSize !== snapshotPagination.pageSize) &&
      !failedDetailRequestsRef.current.has(getDetailRequestKey('snapshots', selectedRunId, snapshotPagination)) &&
      !runSnapshotsLoading
    ) {
      requestRunSnapshots();
    }
    if (
      activeTab === 'api-logs' &&
      (runApiLogsDetailsState?.runId !== selectedRunId ||
        runApiLogsDetailsState.meta.page !== apiLogPagination.current ||
        runApiLogsDetailsState.meta.pageSize !== apiLogPagination.pageSize) &&
      !failedDetailRequestsRef.current.has(getDetailRequestKey('api-logs', selectedRunId, apiLogPagination)) &&
      !runApiLogsLoading
    ) {
      requestRunApiLogs();
    }
  }, [
    activeTab,
    apiLogPagination,
    artifactPagination,
    enabled,
    requestRunApiLogs,
    requestRunArtifacts,
    requestRunEvents,
    requestRunSnapshots,
    run,
    runApiLogsLoading,
    runApiLogsDetailsState,
    runArtifactsLoading,
    runArtifactsDetailsState,
    runEventsLoading,
    runEventsDetailsState?.runId,
    runSnapshotsLoading,
    selectedRunId,
    snapshotPagination,
  ]);

  const activeConversationState = conversationEventsState?.runId === selectedRunId ? conversationEventsState : null;
  const activeRunEventsState = runEventsDetailsState?.runId === selectedRunId ? runEventsDetailsState : null;
  const activeArtifactsState = runArtifactsDetailsState?.runId === selectedRunId ? runArtifactsDetailsState : null;
  const activeApiLogsState = runApiLogsDetailsState?.runId === selectedRunId ? runApiLogsDetailsState : null;
  const artifactContentEntries =
    artifactContentState && artifactContentState.runId === selectedRunId ? artifactContentState.entries : {};

  return {
    reset,
    conversation: {
      state: activeConversationState,
      warning: conversationEnabled ? conversationEventsWarning : conversationDisabledWarning,
      loading: conversationEventsLoading,
      refresh: refreshConversationEvents,
      loadOlder: loadOlderConversationEvents,
    },
    events: {
      state: activeRunEventsState,
      loading: runEventsLoading,
      loadOlder: loadOlderRunEvents,
    },
    artifacts: {
      state: activeArtifactsState,
      artifactLoading: runArtifactsLoading,
      snapshotLoading: runSnapshotsLoading,
      contentEntries: artifactContentEntries,
      changeArtifactPage: (page: number, pageSize: number) => {
        if (selectedRunId) {
          failedDetailRequestsRef.current.delete(
            getDetailRequestKey('artifacts', selectedRunId, { current: page, pageSize }),
          );
        }
        setArtifactPagination({ current: page, pageSize });
      },
      changeSnapshotPage: (page: number, pageSize: number) => {
        if (selectedRunId) {
          failedDetailRequestsRef.current.delete(
            getDetailRequestKey('snapshots', selectedRunId, { current: page, pageSize }),
          );
        }
        setSnapshotPagination({ current: page, pageSize });
      },
      loadContent: loadArtifactContent,
    },
    apiLogs: {
      state: activeApiLogsState,
      loading: runApiLogsLoading,
      changePage: (page: number, pageSize: number) => {
        if (selectedRunId) {
          failedDetailRequestsRef.current.delete(
            getDetailRequestKey('api-logs', selectedRunId, { current: page, pageSize }),
          );
        }
        setApiLogPagination({ current: page, pageSize });
      },
    },
  };
}
