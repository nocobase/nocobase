/**
 * The agent sessions plugin's notices (`registerNotices`) through Studio's inbox port, as source `agentSessions`: the
 * agent of one of the person's 「我的 Agent」 sessions waits for their permission, or a turn ended (answered, or
 * failed) while they were not looking. Each is information about its session (subject `agentSession`, labelled with
 * the session's title), and a session's notices merge into one counted item. They settle when the person sees the
 * session (`seen`), answers the request (`answered`) or archives the session (`archived`). What a session's agent
 * created, issues, is told of by the projects source. The browser renders these items with the `agentSessions` entry
 * of the inbox registry (`client/inbox/contributions/agent-sessions.ts`).
 */
import type {
  SessionNotice,
  SessionNotices,
} from '@nocobase/app-plugin-agent-sessions/server';

import type { InboxSend, StudioInboxPort } from './port.js';

/** The agent sessions' source in the inbox. */
export const AGENT_SESSIONS_SOURCE = 'agentSessions';

/** The session subject's type. */
export const AGENT_SESSION_SUBJECT = 'agentSession';

/** The longest subject label the inbox keeps. */
const SUBJECT_LABEL_MAX = 191;

/** The plugin's English, for a reader without the browser's renderer. */
const TITLES: Readonly<Record<SessionNotice['type'], string>> = {
  permissionRequested: '{agent} is waiting for your permission',
  turnEnded: '{agent} replied',
  turnFailed: '{agent} stopped with an error',
};

export function sessionNoticeToInbox(notice: SessionNotice): InboxSend {
  return {
    key: `agent-session:${notice.key}`,
    source: AGENT_SESSIONS_SOURCE,
    kind: 'info',
    type: notice.type,
    userIds: [notice.userId],
    title: TITLES[notice.type].replace('{agent}', notice.agent),
    body: notice.detail ? `${notice.title}: ${notice.detail}` : notice.title,
    path: `/agent-sessions/${notice.sessionId}`,
    subject: {
      type: AGENT_SESSION_SUBJECT,
      id: notice.sessionId,
      label:
        notice.title.length > SUBJECT_LABEL_MAX
          ? `${notice.title.slice(0, SUBJECT_LABEL_MAX - 1)}…`
          : notice.title,
    },
    group: notice.sessionId,
    actor: null,
    data: {
      agent: notice.agent,
      session: notice.title,
      detail: notice.detail,
    },
  };
}

export function agentSessionNotices(
  port: () => StudioInboxPort,
): SessionNotices {
  return {
    send: (notice) => port().send(sessionNoticeToInbox(notice)),
    settle: (ref) =>
      port().settle({
        source: AGENT_SESSIONS_SOURCE,
        subject: { type: AGENT_SESSION_SUBJECT, id: ref.sessionId },
        ...(ref.types ? { types: ref.types } : {}),
        userIds: [ref.userId],
        outcome: ref.outcome,
      }),
  };
}
