import { useContext, useMemo } from 'react';
import {
  ApplicationCacheContext,
  agentSessionsQueryClient,
} from '../query-cache.js';
import { sessionMemoryKey } from '../use-session-memory.js';
import type { AgentSessionsPanelView } from '../components/sessions-panel.js';
import type { Attachment } from './attachments.js';

/** Portable text and context; each transport retains its own pending images and submissions. */
export interface AgentSessionDraft {
  readonly text: string;
  readonly attachments: readonly Attachment[];
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
        return key
          ? {
              text:
                client.getQueryData<string>(sessionMemoryKey(`text:${key}`)) ??
                '',
              attachments:
                client.getQueryData<Attachment[]>(
                  sessionMemoryKey(`attached:${key}`),
                ) ?? [],
            }
          : null;
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
        return true;
      },
    };
  }, [client]);
}
