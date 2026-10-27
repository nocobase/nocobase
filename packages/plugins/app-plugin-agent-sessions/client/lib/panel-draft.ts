import { useContext, useMemo } from 'react';
import {
  ApplicationCacheContext,
  agentSessionsQueryClient,
} from '../query-cache.js';
import { sessionMemoryKey } from '../use-session-memory.js';
import type { AgentSessionsPanelView } from '../components/sessions-panel.js';
import { mentionText, type Attachment } from './attachments.js';
import type { Reference } from '../../shared/api.js';

/** Portable text and context; each transport retains its own pending images and submissions. */
export interface AgentSessionDraft {
  readonly text: string;
  readonly attachments: readonly Attachment[];
  /** Selected inline references still present in the draft text. */
  readonly mentions?: readonly Reference[];
}

/** Read or replace a panel draft in the authenticated application's existing memory cache. */
export interface AgentSessionDraftController {
  readonly read: (view: AgentSessionsPanelView) => AgentSessionDraft | null;
  readonly write: (
    view: AgentSessionsPanelView,
    draft: AgentSessionDraft,
  ) => boolean;
}
export function useAgentSessionDraft(): AgentSessionDraftController {
  const client =
    useContext(ApplicationCacheContext) ?? agentSessionsQueryClient();
  return useMemo(() => {
    const keyOf = (view: AgentSessionsPanelView) =>
      view.kind === 'new'
        ? 'new-session'
        : view.kind === 'session'
          ? `session:${view.sessionId}`
          : null;
    return {
      read(view: AgentSessionsPanelView): AgentSessionDraft | null {
        const key = keyOf(view);
        if (!key) return null;
        const text =
          client.getQueryData<string>(sessionMemoryKey(`text:${key}`)) ?? '';
        return {
          text,
          attachments:
            client.getQueryData<Attachment[]>(
              sessionMemoryKey(`attached:${key}`),
            ) ?? [],
          mentions: (
            client.getQueryData<Reference[]>(
              sessionMemoryKey(`mentions:${key}`),
            ) ?? []
          ).filter((reference) => text.includes(mentionText(reference))),
        };
      },
      /** An unresolved submission owns its draft; it cannot be replaced. */
      write(view: AgentSessionsPanelView, draft: AgentSessionDraft): boolean {
        const key = keyOf(view);
        if (!key || client.getQueryData(sessionMemoryKey(`submission:${key}`)))
          return false;
        client.setQueryData(sessionMemoryKey(`text:${key}`), draft.text);
        client.setQueryData(sessionMemoryKey(`attached:${key}`), [
          ...draft.attachments,
        ]);
        client.setQueryData(sessionMemoryKey(`mentions:${key}`), [
          ...(draft.mentions ?? []),
        ]);
        return true;
      },
    };
  }, [client]);
}
