/**
 * Run requests on issues in Studio's inbox (source `runRequests`, `shared/run-requests.ts`). Work someone other than
 * an issue's owner caused waits for the owner (`work.ts`, `stage-rules.ts`); the agents plugin keeps it as a run
 * request and announces it, and this puts it in people's inboxes:
 *
 * - created: the owner gets a decision card about the issue (so it is also under "Waiting for you" on the issue's
 *   page), with what was asked; confirming runs it as them (`POST /api/agents/runRequests/:id/confirm`), rejecting
 *   drops it. The card carries the beginning of the text; the full text is read from the request.
 * - confirmed, rejected, withdrawn, handed to a new owner (superseded) or expired: the card settles with that outcome
 *   in every recipient's inbox. A request handed on is a new request, with a card for the new owner.
 * - expired (the agents plugin's `run_request_expired` notice): the person who asked hears nobody confirmed it in time
 *   or the new owner cannot run it, and may still run it as themselves
 *   (`POST /api/agents/runRequests/:id/runAsMe`).
 *
 * Requests on anything but an issue are left to their application. Nothing here decides anything: the agents plugin
 * checks who may confirm, reject or run a request, and the issue's current owner at that moment.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Agents,
  AgentsNotice,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { RunRequest } from '@nocobase/app-plugin-agents/shared/runs';

import {
  RUN_REQUEST_EXCERPT_MAX,
  RUN_REQUEST_EXPIRED_TYPE,
  RUN_REQUEST_TYPE,
  RUN_REQUESTS_SOURCE,
  type RunRequestCardData,
} from '../../shared/run-requests.js';
import type { InboxSend, StudioInboxPort } from '../inbox/port.js';
import { findIssue } from '../previews/sources.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { jsonObject } from './values.js';

/** The beginning of `text`, on one line where it is short. */
export function excerptOf(text: string): string {
  const trimmed = text.trim();
  return trimmed.length <= RUN_REQUEST_EXCERPT_MAX
    ? trimmed
    : `${trimmed.slice(0, RUN_REQUEST_EXCERPT_MAX - 1).trimEnd()}…`;
}

/** The decision card of a pending request for its owner. */
export function requestCard(
  request: RunRequest,
  names: {
    readonly agentName: string;
    readonly requestedByName: string;
    readonly identifier: string;
    readonly issueTitle: string;
  },
): InboxSend {
  const trigger = jsonObject(request.input.payload).trigger;
  const data: RunRequestCardData = {
    requestId: request.id,
    agentId: request.agentId,
    agentName: names.agentName,
    requestedByUserId: request.requestedByUserId,
    requestedByName: names.requestedByName,
    responsibleUserId: request.responsibleUserId,
    issueId: request.subject.id,
    identifier: names.identifier,
    issueTitle: names.issueTitle,
    trigger: typeof trigger === 'string' ? trigger : null,
    excerpt: excerptOf(request.input.text),
    expiresAt: request.expiresAt,
  };
  return {
    key: `runRequest:${request.id}`,
    source: RUN_REQUESTS_SOURCE,
    kind: 'decision',
    type: RUN_REQUEST_TYPE,
    userIds: [request.responsibleUserId],
    title: `${names.requestedByName} asks ${names.agentName} to work on ${names.identifier}`,
    body: `${names.requestedByName} asked ${names.agentName} to work on ${names.identifier} (${names.issueTitle}), which you own. Confirm to run it as you, or reject it.`,
    path: `/issues/${names.identifier}`,
    subject: {
      type: ISSUE_SUBJECT,
      id: request.subject.id,
      label: names.identifier,
    },
    decisionKey: request.id,
    actor: {
      type: 'user',
      id: request.requestedByUserId,
      name: names.requestedByName,
    },
    data: { ...data },
  };
}

/** The notice for the person who asked, once their request expired. */
export function expiredCard(
  notice: AgentsNotice,
  request: RunRequest,
  names: {
    readonly agentName: string;
    readonly identifier: string;
    readonly issueTitle: string;
  },
): InboxSend {
  const reason =
    notice.params.reason === 'reassignment' ? 'reassignment' : 'timeout';
  return {
    key: notice.key,
    source: RUN_REQUESTS_SOURCE,
    kind: 'info',
    type: RUN_REQUEST_EXPIRED_TYPE,
    userIds: notice.userIds,
    title: notice.title,
    body: notice.body,
    path: `/issues/${names.identifier}`,
    subject: {
      type: ISSUE_SUBJECT,
      id: request.subject.id,
      label: names.identifier,
    },
    actor: null,
    data: {
      requestId: request.id,
      agentId: request.agentId,
      agentName: names.agentName,
      requestedByUserId: request.requestedByUserId,
      responsibleUserId: request.responsibleUserId,
      issueId: request.subject.id,
      identifier: names.identifier,
      issueTitle: names.issueTitle,
      excerpt: excerptOf(request.input.text),
      expiresAt: request.expiresAt,
      reason,
    },
  };
}

/** How a request that left `pending` settles its card, by the event that says so. */
const OUTCOMES = {
  'runRequest.confirmed': 'confirmed',
  'runRequest.rejected': 'rejected',
  'runRequest.withdrawn': 'withdrawn',
  'runRequest.superseded': 'superseded',
  'runRequest.expired': 'expired',
} as const;

/**
 * Puts run requests on issues in people's inboxes and settles their cards; returns what stops it. Each event is
 * delivered once its change committed (an issue change relays the agents plugin's events after its commit).
 */
export function bindRunRequestCards(deps: {
  readonly agents: Pick<Agents, 'events' | 'runs'>;
  readonly connection: () => DatabaseConnection;
  readonly port: () => StudioInboxPort | undefined;
  readonly onError: (error: unknown) => void;
}): () => void {
  const { agents } = deps;

  async function namesOf(request: RunRequest) {
    const item = await agents.runs.requests.get(request.id);
    const issue = await findIssue(deps.connection(), request.subject.id);
    return {
      agentName: item.agentName ?? request.agentId,
      requestedByName: item.requestedByName ?? request.requestedByUserId,
      identifier: issue?.identifier ?? request.subject.id,
      issueTitle: issue?.title ?? '',
    };
  }

  const stops = [
    agents.events.on('runRequest.created', ({ request }) => {
      const port = deps.port();
      if (!port || request.subject.kind !== ISSUE_SUBJECT) return;
      void namesOf(request)
        .then((names) => port.send(requestCard(request, names)))
        .catch(deps.onError);
    }),
    ...(Object.keys(OUTCOMES) as (keyof typeof OUTCOMES)[]).map((type) =>
      agents.events.on(type, ({ request }) => {
        const port = deps.port();
        if (!port || request.subject.kind !== ISSUE_SUBJECT) return;
        const ref = { source: RUN_REQUESTS_SOURCE, decisionKey: request.id };
        void (
          type === 'runRequest.withdrawn'
            ? port.withdraw(ref)
            : port.resolve({ ...ref, outcome: OUTCOMES[type] })
        ).catch(deps.onError);
      }),
    ),
    agents.events.on('notice', ({ notice }) => {
      const port = deps.port();
      if (
        !port ||
        notice.type !== RUN_REQUEST_EXPIRED_TYPE ||
        notice.userIds.length === 0
      )
        return;
      void agents.runs.requests
        .get(notice.subject.id)
        .then(async (request) => {
          if (request.subject.kind !== ISSUE_SUBJECT) return;
          await port.send(expiredCard(notice, request, await namesOf(request)));
        })
        .catch(deps.onError);
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
