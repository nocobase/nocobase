/**
 * Webhook deliveries. Two kinds of endpoint take them:
 *
 * - a repository's own (`POST /api/webhooks/github/repositories/<repository id>`), verified with the repository's webhook
 *   secret: a webhook someone added to one repository;
 * - a connection's (`POST /api/webhooks/github/connections/<connection id>`), verified with the connection's
 *   secret: a GitHub App's webhook, delivering for every repository of every installation of the app (an app has one
 *   webhook URL). A delivery names its repository, which Studio finds among those the connection, or another
 *   installation of the same app, reaches.
 *
 * Verifying and normalizing is the platform's (`platform.ts`); what an event changes is the service's (`service.ts`),
 * which hands every read to the same `GitFlow.store` the poller uses.
 *
 * - **Verification**: no secret set, a missing or a wrong signature: `invalidSignature`, recorded as the endpoint's
 *   last delivery so the settings can say so.
 * - **Relevance**: an event Studio does not read (an unsupported event or action, a suite without runs, a tag) or one
 *   about a repository the endpoint does not reach (`otherRepository`) is acknowledged without recording its ID or outcome: an
 *   app installed on a whole organization delivers every repository's checks and runs, most of them nothing to Studio.
 *   A body that is not JSON is still remembered as the endpoint's last delivery, as it means the webhook is set up
 *   wrong.
 * - **Receipt**: every signed delivery updates the endpoint's last received time, throttled in memory to one write
 *   per ten minutes per process, independently of relevance and of the last delivery's outcome.
 * - **Replay**: the id of every relevant delivery is recorded per endpoint before it is acted on, so a delivery sent
 *   twice is acted on once (`duplicate`). One Studio fails to process is forgotten again, so the host may redeliver it.
 *   Records older than `WEBHOOK_RETENTION_DAYS` are removed on a schedule (`delivery-purge.job.ts`), not per delivery.
 * - **Events**: `ping`; a pull request opened, updated, ready, reopened, merged or closed; checks reported on a commit,
 *   which read the checks of the linked open pull requests at that head; a push to a branch, which asks for merge
 *   checks of the pull requests based on it (and is told to the repository's listeners, `events.ts`); a workflow run,
 *   told to the same listeners (a project's initialization follows its workflow); a tag, which Studio has nothing to do
 *   with yet. Anything else is acknowledged and ignored.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  PullRequestCiState,
  WebhookDeliveryReason,
  WebhookDeliveryStatus,
} from '../../shared/git.js';
import {
  findConnection,
  sameApp,
  updateConnectionRow,
  type ConnectionRow,
} from './connections.js';
import type { GitEvent } from './platform.js';
import type { GitProviders } from './providers.js';
import {
  findRepo,
  findRepoById,
  forgetDelivery,
  recordDelivery,
  updateRepo,
  type RepoRow,
} from './store.js';

export const WEBHOOK_RETENTION_DAYS = 7;
export const WEBHOOK_RECEIVED_INTERVAL_MS = 10 * 60 * 1000;

export interface WebhookRequest {
  /** The repository or connection whose endpoint took it. */
  readonly target: string;
  readonly headers: (name: string) => string | null;
  /** The raw body, as signed. */
  readonly body: Uint8Array;
}

export type WebhookResult =
  | { readonly status: 'notFound' }
  | { readonly status: 'invalidSignature' }
  | { readonly status: 'missingDelivery' }
  | { readonly status: 'duplicate' }
  | {
      readonly status: Extract<WebhookDeliveryStatus, 'processed' | 'ignored'>;
      readonly event: string;
      readonly reason: WebhookDeliveryReason | null;
    };

/** What an event did: nothing to say (processed), or why Studio had nothing to do with it. */
export type HandlerOutcome = WebhookDeliveryReason | null;

/** The service's side of each event (`service.ts`). */
export interface WebhookHandlers {
  pullRequest(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'pullRequest' }>,
  ): Promise<HandlerOutcome>;
  /** Checks reported on `sha`; `reported` is what the delivery itself says, for when the host cannot be read. */
  checks(
    repo: RepoRow,
    sha: string,
    reported: PullRequestCiState | null,
  ): Promise<HandlerOutcome>;
  /** A push to a branch. */
  push(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'push' }>,
  ): Promise<HandlerOutcome>;
  /** A workflow run requested, started or completed. */
  workflowRun(
    repo: RepoRow,
    event: Extract<GitEvent, { type: 'workflowRun' }>,
  ): Promise<HandlerOutcome>;
}

/** The events a handler acts on: a ping needs none, and Studio follows nothing of a tag yet. */
type HandledEvent = Exclude<GitEvent, { type: 'ping' | 'tag' }>;

async function dispatch(
  handlers: WebhookHandlers,
  repo: RepoRow,
  event: HandledEvent,
): Promise<HandlerOutcome> {
  switch (event.type) {
    case 'pullRequest':
      return handlers.pullRequest(repo, event);
    case 'checks':
      return handlers.checks(repo, event.sha, event.reported);
    case 'push':
      return handlers.push(repo, event);
    case 'workflowRun':
      return handlers.workflowRun(repo, event);
  }
}

/** What both endpoints share: replay protection, the event, and the endpoint's last delivery. */
interface Endpoint {
  readonly id: string;
  /** The provider whose platform verifies and reads its deliveries. */
  readonly provider: string;
  readonly secret: string | null;
  received(): Promise<void>;
  /** Records the endpoint's last delivery. */
  remember(
    event: string | null,
    status: WebhookDeliveryStatus,
    reason: WebhookDeliveryReason | null,
  ): Promise<void>;
  /** The repository a verified delivery is about; null when the endpoint does not reach it. */
  repoOf(named: string | null): Promise<RepoRow | null>;
}

export interface WebhookReceiver {
  /** A repository's own endpoint. */
  repository(request: WebhookRequest): Promise<WebhookResult>;
  /** A connection's endpoint (an app's webhook). */
  connection(request: WebhookRequest): Promise<WebhookResult>;
}

export function createWebhookReceiver(deps: {
  readonly conn: () => DatabaseConnection;
  readonly providers: GitProviders;
  /** The repository's webhook secret, opened; null without one (or under another key). */
  readonly repoSecretOf: (repo: RepoRow) => string | null;
  readonly connectionSecretOf: (connection: ConnectionRow) => string | null;
  readonly handlers: WebhookHandlers;
  readonly now: () => Date;
}): WebhookReceiver {
  // Per receiver/process, with separate namespaces for repository and App endpoints. Reserve before awaiting the
  // write so concurrent deliveries cannot each update the timestamp. A failed write leaves the next delivery free
  // to retry. Restarting the process permits one fresh write; this cache never reads the database.
  const lastReceived = new Map<string, number>();
  const receiving =
    (
      kind: 'repository' | 'connection',
      write: typeof updateRepo,
      id: string,
    ): Endpoint['received'] =>
    async () => {
      const key = `${kind}:${id}`;
      const at = deps.now();
      const previous = lastReceived.get(key);
      if (
        previous !== undefined &&
        at.getTime() - previous < WEBHOOK_RECEIVED_INTERVAL_MS
      )
        return;
      lastReceived.set(key, at.getTime());
      try {
        await write(deps.conn(), id, { lastReceivedAt: at });
      } catch (error) {
        if (lastReceived.get(key) === at.getTime()) {
          if (previous === undefined) lastReceived.delete(key);
          else lastReceived.set(key, previous);
        }
        throw error;
      }
    };
  async function receive(
    endpoint: Endpoint,
    request: WebhookRequest,
  ): Promise<WebhookResult> {
    const platform = deps.providers.platformOf(endpoint.provider);
    const event = platform.webhookEventOf(request.headers);
    if (
      !endpoint.secret ||
      !(await platform.verifyWebhook(
        endpoint.secret,
        request.body,
        request.headers,
      ))
    ) {
      await endpoint.remember(event, 'invalidSignature', null);
      return { status: 'invalidSignature' };
    }
    await endpoint.received();
    const parsed = platform.parseWebhook(request.body, request.headers);
    if (!parsed.deliveryId) return { status: 'missingDelivery' };
    const deliveryId = parsed.deliveryId;
    const name = parsed.event ?? '';
    const ignore = async (
      reason: WebhookDeliveryReason,
      remember: boolean,
    ): Promise<WebhookResult> => {
      if (remember) await endpoint.remember(name, 'ignored', reason);
      return { status: 'ignored', event: name, reason };
    };
    // Relevance first: ignored events write only the throttled receipt time, never an ID or delivery outcome.
    if ('ignored' in parsed.result)
      return ignore(parsed.result.ignored, parsed.result.ignored === 'notJson');
    const delivered = parsed.result.event;
    if (delivered.type === 'tag') return ignore('unsupportedAction', false);
    let repo: RepoRow | null = null;
    if (delivered.type !== 'ping') {
      repo = await endpoint.repoOf(parsed.repo);
      if (!repo) return ignore('otherRepository', false);
    }
    if (
      !(await recordDelivery(deps.conn(), {
        repoId: endpoint.id,
        deliveryId,
        event: name,
      }))
    )
      return { status: 'duplicate' };
    let reason: HandlerOutcome;
    try {
      reason =
        delivered.type === 'ping' || !repo
          ? null
          : await dispatch(deps.handlers, repo, delivered);
    } catch (error) {
      await forgetDelivery(deps.conn(), endpoint.id, deliveryId);
      await endpoint.remember(name, 'failed', 'error').catch(() => undefined);
      throw error;
    }
    const status = reason ? 'ignored' : 'processed';
    await endpoint.remember(name, status, reason);
    return { status, event: name, reason };
  }

  const remembering =
    (
      write: (
        conn: DatabaseConnection,
        id: string,
        values: Record<string, unknown>,
      ) => Promise<void>,
      id: string,
    ): Endpoint['remember'] =>
    (event, status, reason) =>
      write(deps.conn(), id, {
        webhookAt: deps.now(),
        webhookEvent: event?.slice(0, 64) ?? null,
        webhookStatus: status,
        webhookReason: reason,
      });

  return {
    async repository(request) {
      const repo = await findRepoById(deps.conn(), request.target);
      if (!repo) return { status: 'notFound' };
      return receive(
        {
          id: repo.id,
          provider: repo.provider,
          secret: deps.repoSecretOf(repo),
          received: receiving('repository', updateRepo, repo.id),
          remember: remembering(updateRepo, repo.id),
          // A webhook of another repository pointed at this one's endpoint.
          repoOf: (named) =>
            Promise.resolve(
              !named || named.toLowerCase() === repo.repo.toLowerCase()
                ? repo
                : null,
            ),
        },
        request,
      );
    },

    async connection(request) {
      const connection = await findConnection(deps.conn(), request.target);
      if (!connection) return { status: 'notFound' };
      return receive(
        {
          id: connection.id,
          provider: connection.provider,
          secret: deps.connectionSecretOf(connection),
          received: receiving('connection', updateConnectionRow, connection.id),
          remember: remembering(updateConnectionRow, connection.id),
          async repoOf(named) {
            if (!named) return null;
            const repo = await findRepo(
              deps.conn(),
              connection.apiBaseUrl,
              named,
            );
            if (!repo?.connectionId) return null;
            if (repo.connectionId === connection.id) return repo;
            // An app has one webhook for all its installations: a repository reached through another installation of
            // the same app is this delivery's too.
            const through = await findConnection(
              deps.conn(),
              repo.connectionId,
            );
            return through && sameApp(connection, through) ? repo : null;
          },
        },
        request,
      );
    },
  };
}
