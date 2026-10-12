/**
 * The agents plugin's notices (`notice` events, an `AgentsNotice` each) in Studio's inbox, as source `runners`:
 *
 * - `runner_upgrade_required`: a runtime's runner speaks a protocol Studio does not serve, so it runs nothing
 *   until it is upgraded; its owner hears it once per runner and protocol, about the runtime (subject `runner`), with
 *   the Runtimes page to open. Once the runner connects again speaking a protocol Studio serves (`notice.cleared`), the
 *   card settles as `upgraded`.
 *
 * - `run_request_expired`: a run request someone made was not confirmed in time; for now the card shows the
 *   notice's own `title` and `body` and opens nothing until Studio has an execution request page.
 *
 * The browser words and renders the runner notices with the `runners` entry of the inbox registry
 * (`client/inbox/contributions/runners.ts`) from the notice's `params`; `title` and `body` are the plugin's English,
 * which the inbox's fallback renderer shows for a type that entry does not list.
 */
import type {
  AgentsEventBus,
  AgentsNotice,
} from '@nocobase/app-plugin-agents/server/tokens';

import type { StudioInboxPort, InboxSend } from './port.js';

/** The runners' source in the inbox. */
export const RUNNERS_SOURCE = 'runners';

export function runnersNoticeToInbox(notice: AgentsNotice): InboxSend {
  return {
    key: notice.key,
    source: RUNNERS_SOURCE,
    kind: 'info',
    type: notice.type,
    userIds: notice.userIds,
    title: notice.title,
    body: notice.body,
    // Runner notices need a usable runtime; a run request has no page in Studio yet.
    path: notice.subject.kind === 'runRequest' ? null : '/runtimes',
    subject: {
      type: notice.subject.kind,
      id: notice.subject.id,
      label: notice.subject.label,
    },
    actor: null,
    data: { ...notice.params, subjectId: notice.subject.id },
  };
}

/** How a notice that no longer holds settles, by its type. */
const CLEARED_OUTCOMES: Readonly<Partial<Record<string, string>>> = {
  runner_upgrade_required: 'upgraded',
  run_secrets_not_allowed: 'resumed',
};

/** Delivers the runners' notices through Studio's inbox port, and settles those that no longer hold; returns what stops it. */
export function bindRunnersNotices(
  events: Pick<AgentsEventBus, 'on'>,
  port: () => StudioInboxPort,
  onError: (error: unknown) => void,
): () => void {
  const stops = [
    events.on('notice', ({ notice }) => {
      if (notice.userIds.length === 0) return;
      port().send(runnersNoticeToInbox(notice)).catch(onError);
    }),
    events.on('notice.cleared', ({ notice }) => {
      port()
        .settle({
          source: RUNNERS_SOURCE,
          subject: { type: notice.subject.kind, id: notice.subject.id },
          types: [notice.type],
          outcome: CLEARED_OUTCOMES[notice.type] ?? 'resolved',
        })
        .catch(onError);
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
