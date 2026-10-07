/**
 * Headless helpers a chat UI needs besides the conversation hooks: a run's transcript kept current while it runs (the
 * live steps under the last message, a consultation's steps), and the places a conversation can start from, in the
 * viewer's language (the history's filter).
 */
import type { RunEvent } from '@nocobase/agent-protocol';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { runTopic } from '../../shared/realtime.js';
import type { AgentsVocabulary } from '../../shared/vocabulary.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { useText } from '../hooks/use-vocabulary.js';
import { agentsQueryClient } from '../query.js';
import { useRunEvents } from '../runs/use-run-events.js';

/** A run's transcript so far, fetched as the run's topic announces more and polled meanwhile. */
export function useLiveRunEvents(runId: string): readonly RunEvent[] {
  const api = useAgentsApi();
  const events = useRunEvents(api, runId, true);
  useRealtimeTopic(runTopic(runId), () => events.fetchMore());
  return events.events;
}

/** A place a conversation starts from, other than the chat panel (`panel`). */
export interface ConversationSourceOption {
  readonly key: string;
  readonly label: string;
}

const NO_SOURCES: readonly ConversationSourceOption[] = [];

/** The sources the application registered (`GET agents/admin/vocabulary`), translated; empty while they load. */
export function useConversationSources(): readonly ConversationSourceOption[] {
  const api = useAgentsApi();
  const text = useText();
  const vocabulary = useQuery<AgentsVocabulary>(
    {
      queryKey: agentsKeys.vocabulary,
      queryFn: () => api.vocabulary(),
      staleTime: 5 * 60_000,
    },
    agentsQueryClient(),
  );
  const sources = vocabulary.data?.sources;
  return useMemo(
    () =>
      sources
        ? sources.map((source) => ({
            key: source.key,
            label: text(source.title, source.key),
          }))
        : NO_SOURCES,
    [sources, text],
  );
}
