import { useEffect } from 'react';
import { ApiClientError } from '@nocobase/app-client';
import { useQueryClient } from '@tanstack/react-query';
import { useCancel } from './api.js';
import { sessionMemoryKey, useSessionMemory } from './use-session-memory.js';
import type { TranscriptItem } from './transcript.js';

interface StopRequest {
  readonly promptId: string;
  readonly started: number;
  readonly phase: 'requesting' | 'waiting' | 'failed';
}

/** Shared across surfaces of a session, retaining the target through transport failures and remounts. */
export function useStop(
  sessionId: string,
  items: readonly TranscriptItem[] | undefined,
  fail: (error?: unknown) => void,
): { stop: () => void; pending: boolean; active: boolean } {
  const key = `stop:${sessionId}`;
  const client = useQueryClient();
  const [request, setRequest] = useSessionMemory<StopRequest | null>(key, null);
  const cancel = useCancel(sessionId);
  const target = items?.find(
    (item) => item.type === 'prompt' && item.promptId === request?.promptId,
  );
  const finished =
    request !== null &&
    request.phase !== 'requesting' &&
    target?.type === 'prompt' &&
    ['done', 'cancelled', 'failed'].includes(target.state) &&
    !items?.some(
      (item) =>
        item.type === 'prompt' &&
        (item.state === 'withdrawing' || item.state === 'queued'),
    );
  useEffect(() => {
    if (finished) setRequest(null);
  }, [finished, setRequest]);
  useEffect(() => {
    if (!request || request.phase === 'failed' || finished) return;
    const timer = setTimeout(
      () => {
        const latest = client.getQueryData<StopRequest | null>(
          sessionMemoryKey(key),
        );
        if (latest?.started !== request.started || latest.phase === 'failed')
          return;
        setRequest({ ...latest, phase: 'failed' });
        fail();
      },
      Math.max(0, 30_000 - (Date.now() - request.started)),
    );
    return () => clearTimeout(timer);
  }, [client, key, request, finished, setRequest, fail]);
  const stop = (): void => {
    const existing = client.getQueryData<StopRequest | null>(
      sessionMemoryKey(key),
    );
    if (existing && existing.phase !== 'failed') return;
    const running = items?.find(
      (item) => item.type === 'prompt' && item.state === 'running',
    );
    const promptId =
      existing?.promptId ??
      (running?.type === 'prompt' ? running.promptId : undefined);
    if (!promptId) return;
    const next: StopRequest = {
      promptId,
      started: Date.now(),
      phase: 'requesting',
    };
    setRequest(next);
    cancel.mutate(promptId, {
      onSuccess: () => {
        if (
          client.getQueryData<StopRequest | null>(sessionMemoryKey(key))
            ?.started === next.started
        )
          setRequest({ ...next, phase: 'waiting' });
      },
      onError: (error) => {
        if (
          client.getQueryData<StopRequest | null>(sessionMemoryKey(key))
            ?.started !== next.started
        )
          return;
        // A definitive race rejection did not accept this stop. Let a new explicit action select the
        // refreshed turn; transport failures instead retain the original target for a safe retry.
        setRequest(
          error instanceof ApiClientError &&
            error.reason === 'AGENT_SESSIONS_STOP_TARGET_CHANGED'
            ? null
            : { ...next, phase: 'failed' },
        );
        fail(error);
      },
    });
  };
  return {
    stop,
    pending: !!request && !finished && request.phase !== 'failed',
    active: !!request && !finished,
  };
}
