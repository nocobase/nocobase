/**
 * Release management's events in Studio's inbox (source `releases`):
 *
 * - `request.created`: every approver but the requester gets a decision card keyed by the request's id
 *   (`deployment_requested`), opening the request's dialog over its App's page (`/releases/:appId/requests/:requestId`), saying what would run: the App, the environment, the release with the commit it was
 *   built from (its `sha` label), the tag or branch CI built it on and its log, and who or what asked (a person, an
 *   agent, or CI's API key by its name). The request pins that release (and its checksum): approving deploys exactly
 *   it. Approving or rejecting goes through the plugin's own API
 *   (`/api/releases/deploymentRequests/:requestId/{approve,reject}`), which checks the approver again;
 * - `request.decided`: settles every approver's card with the plugin's outcome (`approved`, `rejected`), or withdraws
 *   it when the request was cancelled, and tells the requester how it was decided by someone else
 *   (`deployment_request_decided`);
 * - `deployment.failed`: tells whoever asked for the deployment (the requester of an approved request, otherwise the
 *   person who deployed, or the person an agent or a key acted for) that it failed (`deployment_failed`);
 *   an issue preview's failure goes to the issue's owner instead (`../previews/notices.ts`).
 *
 * The browser words and renders these with the `releases` entry of the inbox registry
 * (`client/inbox/contributions/releases.ts`); each card carries the names it shows, so the renderer needs no call of
 * its own.
 */
import type {
  ReleasesEvent,
  ReleasesEvents,
} from '@nocobase/app-plugin-releases/server/tokens';
import type { ReleaseView } from '@nocobase/app-plugin-releases/shared/releases';
import type { DatabaseConnection, Row } from '@nocobase/db';

import { RELEASE_LABELS } from '../../shared/previews.js';
import type { StudioInboxPort, InboxSend } from '../inbox/port.js';

/** Release management's source in the inbox. */
export const RELEASES_SOURCE = 'releases';
export const DEPLOYMENT_REQUESTED = 'deployment_requested';
export const DEPLOYMENT_REQUEST_DECIDED = 'deployment_request_decided';
export const DEPLOYMENT_FAILED = 'deployment_failed';

/** The App's page, where its deployments are. */
export function appPath(appId: string): string {
  return `/releases/${encodeURIComponent(appId)}`;
}

/** A deployment request's dialog over its App's page, where an approver decides it. */
export function requestPath(appId: string, requestId: string): string {
  return `${appPath(appId)}/requests/${encodeURIComponent(requestId)}`;
}

type RequestCreated = Extract<ReleasesEvent, { type: 'request.created' }>;
type RequestDecided = Extract<ReleasesEvent, { type: 'request.decided' }>;
type DeploymentFailed = Extract<ReleasesEvent, { type: 'deployment.failed' }>;

/** What the cards show beside the request: names, read when the event arrives. */
export interface ReleaseNames {
  readonly releaseVersion?: string | null;
  readonly environmentName?: string | null;
  readonly requesterName?: string | null;
}

/** What a release is, as the approver's card shows it. */
export interface ReleaseFacts {
  readonly version: string;
  /** The commit it was built from: its `sha` label, else the commit the build named. */
  readonly sha: string | null;
  /** The tag or branch CI built it on, as Studio verified it. */
  readonly ref: string | null;
  /** The CI run's log. */
  readonly logsUrl: string | null;
}

/** What the card shows of a release: its labels, and the tag or branch of the CI build it came from. */
export async function releaseFacts(
  release: ReleaseView,
  conn: DatabaseConnection,
): Promise<ReleaseFacts> {
  const buildId = release.labels[RELEASE_LABELS.build];
  const build = buildId
    ? await conn.query
        .selectFrom('studioBuilds')
        .select(['ref'])
        .where('id', '=', buildId)
        .executeTakeFirst<Row>()
    : undefined;
  return {
    version: release.version,
    sha: release.labels[RELEASE_LABELS.sha] ?? release.sourceCommit ?? null,
    ref: typeof build?.ref === 'string' && build.ref ? build.ref : null,
    logsUrl: release.build,
  };
}

/** The approvers' decision card of a new deployment request. */
export function requestNotice(
  event: RequestCreated,
  names: Omit<ReleaseNames, 'releaseVersion'> & {
    readonly release?: ReleaseFacts | null;
  } = {},
): InboxSend {
  const release = names.release ?? null;
  const { app, request } = event;
  return {
    key: `releases:request:${request.id}`,
    source: RELEASES_SOURCE,
    kind: 'decision',
    type: DEPLOYMENT_REQUESTED,
    userIds: [...event.approvers],
    // Kept by the in-app item for a reader without the renderer.
    title: `Deployment request for ${app.name}`,
    body: request.note ?? '',
    path: requestPath(app.id, request.id),
    subject: { type: 'app', id: app.id, label: app.name },
    decisionKey: request.id,
    actor: request.requestedBy
      ? {
          type: 'user',
          id: request.requestedBy,
          name: names.requesterName ?? null,
        }
      : null,
    data: {
      requestId: request.id,
      kind: request.kind,
      appId: app.id,
      appName: app.name,
      environmentId: request.environmentId,
      environmentName: names.environmentName ?? null,
      releaseId: request.releaseId,
      releaseVersion: release?.version ?? null,
      releaseChecksum: request.releaseChecksum,
      sha: release?.sha ?? null,
      ref: release?.ref ?? null,
      logsUrl: release?.logsUrl ?? null,
      requesterName: names.requesterName ?? null,
      requestedVia: request.requestedVia,
      note: request.note,
      requestedAt: request.createdAt,
    },
  };
}

/** The requester hears how someone else decided their request. */
export function decidedNotice(
  event: RequestDecided,
  names: ReleaseNames & { readonly deciderName?: string | null } = {},
): InboxSend | null {
  const { app, request } = event;
  if (
    event.decision === 'cancelled' ||
    !request.requestedBy ||
    request.requestedBy === event.actor.userId
  )
    return null;
  return {
    key: `releases:request-decided:${request.id}`,
    source: RELEASES_SOURCE,
    kind: 'info',
    type: DEPLOYMENT_REQUEST_DECIDED,
    userIds: [request.requestedBy],
    title: `Deployment request for ${app.name} ${event.decision}`,
    body: request.decisionNote ?? '',
    path: requestPath(app.id, request.id),
    subject: { type: 'app', id: app.id, label: app.name },
    actor: event.actor.userId
      ? {
          type: 'user',
          id: event.actor.userId,
          name: names.deciderName ?? null,
        }
      : null,
    data: {
      requestId: request.id,
      decision: event.decision,
      appId: app.id,
      appName: app.name,
      environmentName: names.environmentName ?? null,
      releaseVersion: names.releaseVersion ?? null,
      deciderName: names.deciderName ?? null,
      note: request.decisionNote,
    },
  };
}

/** Whoever asked for a failed deployment hears of it. */
export function failedNotice(
  event: DeploymentFailed,
  recipient: string,
  names: ReleaseNames = {},
): InboxSend {
  const { app, deployment } = event;
  return {
    key: `releases:deployment-failed:${deployment.id}`,
    source: RELEASES_SOURCE,
    kind: 'info',
    type: DEPLOYMENT_FAILED,
    userIds: [recipient],
    title: `Deployment of ${app.name} failed`,
    body: event.error,
    path: appPath(app.id),
    subject: { type: 'app', id: app.id, label: app.name },
    actor: null,
    data: {
      deploymentId: deployment.id,
      kind: deployment.kind,
      appId: app.id,
      appName: app.name,
      environmentName: names.environmentName ?? null,
      releaseVersion: event.release.version,
      error: event.error.slice(0, 2000),
    },
  };
}

export interface ReleasesInboxDeps {
  readonly events: ReleasesEvents;
  readonly port: () => StudioInboxPort;
  /** Names the cards show; read when the event arrives. */
  readonly lookup: {
    userName(id: string): Promise<string | null>;
    environmentName(id: string): Promise<string | null>;
    release(appId: string, releaseId: string): Promise<ReleaseFacts | null>;
    /** The person who asked for the deployment request, by its id. */
    requester(requestId: string): Promise<string | null>;
  };
}

/** Listens to release management's events and keeps the inboxes in step; returns what stops it. */
export function bindReleasesInbox(deps: ReleasesInboxDeps): () => void {
  const { lookup } = deps;
  const userName = (id: string | null) =>
    id ? lookup.userName(id) : Promise.resolve(null);
  return deps.events.subscribe(async (event) => {
    if (event.type === 'request.created') {
      const notice = requestNotice(event, {
        environmentName: await lookup.environmentName(
          event.request.environmentId,
        ),
        release: await lookup.release(event.app.id, event.request.releaseId),
        requesterName: await userName(event.request.requestedBy),
      });
      if (notice.userIds.length > 0) await deps.port().send(notice);
      return;
    }
    if (event.type === 'request.decided') {
      const ref = { source: RELEASES_SOURCE, decisionKey: event.request.id };
      if (event.decision === 'cancelled') await deps.port().withdraw(ref);
      else await deps.port().resolve({ ...ref, outcome: event.decision });
      const notice = decidedNotice(event, {
        environmentName: await lookup.environmentName(
          event.request.environmentId,
        ),
        releaseVersion:
          (await lookup.release(event.app.id, event.request.releaseId))
            ?.version ?? null,
        deciderName: await userName(event.actor.userId),
      });
      if (notice) await deps.port().send(notice);
      return;
    }
    if (event.type === 'deployment.failed') {
      // A preview's failure is the issue's: Studio's previews tell its owner (`../previews/notices.ts`).
      if (event.app.labels?.studio === 'preview') return;
      const recipient = event.deployment.requestId
        ? await lookup.requester(event.deployment.requestId)
        : event.deployment.actorId;
      if (!recipient) return;
      await deps.port().send(
        failedNotice(event, recipient, {
          environmentName: await lookup.environmentName(
            event.app.environmentId,
          ),
        }),
      );
    }
  });
}
