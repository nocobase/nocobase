/**
 * The one bearer credential besides a session or an API key: an upload ticket lets whoever holds it upload one release
 * into one App before it expires, and deploy it when it says so. An application hands one to a build job so the job
 * never holds a person's credentials. It acts for the person who issued it, with what that person may still do, and
 * counts as a `key` caller: never on a protected environment. CI that runs on its own
 * uses an API key with a scope instead (the application's `releases.apps` permission group).
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';

import {
  businessKey,
  noPermissions,
  type AppAction,
  type ReleasesPermissions,
} from '../../shared/access.js';
import {
  UPLOAD_TICKET_PREFIX,
  type UploadTicketView,
} from '../../shared/releases.js';
import { AccessGuard, type Caller } from '../access/caller.js';
import { ReleasesError, forbidden } from '../errors.js';
import { decodeDate } from './codec.js';
import type { EnvironmentService } from './environments.js';
import type { ReleasesService } from './releases.js';
import { hashToken, randomToken } from './secrets.js';

const MAX_TICKET_TTL_SECONDS = 3600;

/** A permission set cut down to the given App actions; everything else is off. */
export function restrictPermissions(
  permissions: ReleasesPermissions,
  actions: readonly AppAction[],
): ReleasesPermissions {
  const base = noPermissions();
  const scopes = { ...base.scopes };
  for (const action of actions) {
    const key = businessKey('rel.apps', action);
    scopes[key] = permissions.scopes[key];
  }
  return { ...base, scopes };
}

export interface UploadTicketServiceOptions {
  readonly database: DatabaseManager;
  readonly releases: ReleasesService;
  readonly environments: EnvironmentService;
  readonly guard: AccessGuard;
  readonly defaultTtlSeconds?: number;
}

export class UploadTicketService {
  public constructor(private readonly options: UploadTicketServiceOptions) {}

  /**
   * Issues a ticket. With `conn`, the App is read and the ticket written on that connection, so an application can
   * mint one inside its own transaction (a build job's claim, where the database may allow one connection); a
   * deploying ticket still reads its environment outside it, so it is refused there.
   */
  public async create(
    caller: Caller,
    appId: string,
    input: { readonly deploy?: boolean; readonly ttlSeconds?: number } = {},
    conn?: DatabaseConnection,
  ): Promise<UploadTicketView> {
    const app = await this.options.releases.requireApp(appId, conn);
    await this.options.guard.requireApp(caller, 'upload', app);
    const deploy = input.deploy === true;
    if (deploy && conn)
      throw new ReleasesError(
        'A ticket minted in a transaction cannot deploy.',
        'TICKET_DEPLOY_REFUSED',
        'FAILED_PRECONDITION',
      );
    if (deploy) {
      const environment = await this.options.environments.record(
        app.environmentId,
      );
      if (environment.protected)
        throw new ReleasesError(
          'An upload ticket cannot deploy to a protected environment.',
          'TICKET_DEPLOY_REFUSED',
          'FAILED_PRECONDITION',
        );
      await this.options.guard.requireApp(caller, 'deploy', app);
    }
    const ttl = input.ttlSeconds ?? this.options.defaultTtlSeconds ?? 900;
    if (!Number.isSafeInteger(ttl) || ttl < 1 || ttl > MAX_TICKET_TTL_SECONDS)
      throw new ReleasesError(
        `A ticket lives from 1 to ${MAX_TICKET_TTL_SECONDS} seconds.`,
        'INVALID_TTL',
        'INVALID_ARGUMENT',
      );
    if (!caller.userId)
      throw forbidden(
        'Upload tickets are issued for a person.',
        'USER_REQUIRED',
      );
    const id = randomUUID();
    const token = `${UPLOAD_TICKET_PREFIX}${randomToken()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    await (conn?.query ?? this.query())
      .insertInto('relUploadTickets')
      .values({
        id,
        appId,
        tokenHash: hashToken(token),
        deploy,
        expiresAt,
        usedAt: null,
        releaseId: null,
        createdBy: caller.userId,
        createdVia: caller.kind,
        createdAt: now,
      })
      .execute();
    return {
      id,
      appId,
      token,
      path: `/releases/apps/${encodeURIComponent(appId)}/releases`,
      deploy,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /** Checks a ticket for an upload to `appId` without spending it: unused, unexpired and for that App. */
  public async verify(token: string, appId: string): Promise<void> {
    await this.usable(token, appId);
  }

  /**
   * Spends a ticket on an upload to `appId`: valid once, before it expires. Returns the caller the upload runs as —
   * the issuer, limited to uploading (and deploying, when the ticket says so).
   */
  public async consume(
    token: string,
    appId: string,
  ): Promise<{
    readonly ticketId: string;
    readonly deploy: boolean;
    readonly caller: Caller;
  }> {
    const row = await this.usable(token, appId);
    const now = new Date();
    const claimed = await this.query()
      .updateTable('relUploadTickets')
      .set({ usedAt: now })
      .where('id', '=', row.id)
      .where('usedAt', 'is', null)
      .execute();
    if (claimed.updatedCount !== 1) throw invalidTicket();
    const deploy = Boolean(row.deploy);
    const issuer = await this.options.guard.callerForUser(
      String(row.createdBy),
      'key',
    );
    return {
      ticketId: String(row.id),
      deploy,
      caller: {
        ...issuer,
        permissions: restrictPermissions(
          issuer.permissions,
          deploy ? ['upload', 'deploy'] : ['upload'],
        ),
      },
    };
  }

  /** Records the release a ticket produced. */
  public async recordRelease(
    ticketId: string,
    releaseId: string,
  ): Promise<void> {
    await this.query()
      .updateTable('relUploadTickets')
      .set({ releaseId })
      .where('id', '=', ticketId)
      .execute();
  }

  private async usable(token: string, appId: string): Promise<Row> {
    const row = await this.query()
      .selectFrom('relUploadTickets')
      .selectAll()
      .where('tokenHash', '=', hashToken(token))
      .executeTakeFirst<Row>();
    if (!row || String(row.appId) !== appId) throw invalidTicket();
    if (row.usedAt != null || decodeDate(row.expiresAt) <= new Date())
      throw invalidTicket();
    return row;
  }

  private query() {
    return this.options.database.connection().query;
  }
}

function invalidTicket(): ReleasesError {
  return new ReleasesError(
    'The upload ticket is invalid, used or expired.',
    'INVALID_TICKET',
    'UNAUTHENTICATED',
  );
}
