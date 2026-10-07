/**
 * Deployment requests: on a protected environment, every deployment is proposed (pending), decided by someone else
 * (approved or rejected) and, once approved, started; the request then follows its deployment to deployed or failed.
 * Who may approve is the application's business (`ReleasesAccess.approversOf`); with nobody named, whoever holds
 * `deploy-protected` on the App. The plugin insists that the approver is a person and not the requester. The application hears `request.created` (with the
 * approvers, to notify them) and `request.decided`.
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseManager, Row } from '@nocobase/db';

import type {
  ActorKind,
  CreateDeploymentRequestInput,
  DeploymentRequestStatus,
  DeploymentRequestView,
  EnvironmentRecord,
} from '../../shared/releases.js';
import { AccessGuard, actorOf, type Caller } from '../access/caller.js';
import { ReleasesError, forbidden, notFound } from '../errors.js';
import type { ReleasesAccess } from '../tokens.js';
import {
  decodeDate,
  decodeLabels,
  decodeOptionalDate,
  iso,
  nullableString,
} from './codec.js';
import type { EnvironmentService } from './environments.js';
import type { ReleasesEventBus } from './events.js';
import { appView, type AppRecord, type ReleasesService } from './releases.js';
import { assertPagination, normalizeLabels } from './validation.js';

export interface DeploymentRequestServiceOptions {
  readonly database: DatabaseManager;
  readonly releases: ReleasesService;
  readonly environments: EnvironmentService;
  readonly guard: AccessGuard;
  readonly events: ReleasesEventBus;
  readonly access: () => ReleasesAccess | undefined;
}

export interface ListRequestsOptions {
  readonly appId?: string;
  readonly status?: DeploymentRequestStatus;
  /** Only pending requests the caller may decide. */
  readonly awaitingMe?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export class DeploymentRequestService {
  public constructor(
    private readonly options: DeploymentRequestServiceOptions,
  ) {
    // A request follows the deployment it started: release management settles it in the transaction that finishes
    // the deployment (`ReleasesService.markSucceeded` / `markFailed`).
  }

  /** Proposes a deployment. Anyone who may deploy the App proposes, agents and publishing keys included. */
  public async create(
    caller: Caller,
    appId: string,
    input: CreateDeploymentRequestInput,
  ): Promise<DeploymentRequestView> {
    const app = await this.options.releases.requireApp(appId);
    await this.options.guard.requireApp(caller, 'deploy', app);
    const environment = await this.options.environments.record(
      app.environmentId,
    );
    const labels = normalizeLabels(input?.labels);
    const note = normalizeNote(input?.note);
    let kind: 'deploy' | 'rollback';
    let releaseId: string;
    let releaseChecksum: string;
    let rollbackTargetDeploymentId: string | null = null;
    if (input?.rollbackToDeploymentId !== undefined) {
      if (input.releaseId !== undefined)
        throw new ReleasesError(
          'Name either a release or a deployment to roll back to.',
          'INVALID_REQUEST',
          'INVALID_ARGUMENT',
        );
      const target = await this.options.releases.requireRollbackTarget(
        appId,
        String(input.rollbackToDeploymentId),
      );
      kind = 'rollback';
      releaseId = target.releaseId;
      releaseChecksum = (
        await this.options.releases.requireRelease(appId, releaseId)
      ).checksum;
      rollbackTargetDeploymentId = target.id;
    } else {
      if (typeof input?.releaseId !== 'string')
        throw new ReleasesError(
          'A release ID is required.',
          'INVALID_REQUEST',
          'INVALID_ARGUMENT',
        );
      const release = await this.options.releases.requireRelease(
        appId,
        input.releaseId,
      );
      releaseId = release.id;
      releaseChecksum = release.checksum;
      kind = 'deploy';
    }
    // Nobody is asked to approve what could not be deployed for want of a variable.
    await this.options.releases.assertVariables(appId, releaseId);
    const pending = await this.query()
      .selectFrom('relDeploymentRequests')
      .select('id')
      .where('appId', '=', appId)
      .where('status', '=', 'pending')
      .executeTakeFirst<Row>();
    if (pending)
      throw new ReleasesError(
        'This application already has a pending deployment request.',
        'REQUEST_PENDING',
        'FAILED_PRECONDITION',
      );
    const now = new Date();
    const id = randomUUID();
    await this.query()
      .insertInto('relDeploymentRequests')
      .values({
        id,
        appId,
        environmentId: environment.id,
        releaseId,
        releaseChecksum,
        kind,
        rollbackTargetDeploymentId,
        status: 'pending',
        note,
        labels: JSON.stringify(labels),
        requestedBy: caller.userId,
        requestedVia: caller.kind,
        decidedBy: null,
        decidedAt: null,
        decisionNote: null,
        deploymentId: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const request = await this.requireRequest(id);
    await this.options.events.emit({
      type: 'request.created',
      app: appView(app),
      request,
      approvers: await this.approversOf(environment, request),
      actor: actorOf(caller),
    });
    return request;
  }

  public async list(
    caller: Caller,
    options: ListRequestsOptions = {},
  ): Promise<{
    readonly items: readonly DeploymentRequestView[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
  }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    assertPagination(page, pageSize);
    let query = this.query()
      .selectFrom('relDeploymentRequests')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc');
    if (options.appId) query = query.where('appId', '=', options.appId);
    if (options.awaitingMe) query = query.where('status', '=', 'pending');
    else if (options.status) query = query.where('status', '=', options.status);
    const visible: DeploymentRequestView[] = [];
    const apps = new Map<string, AppRecord | null>();
    for (const request of (await query.execute<Row>()).map(decodeRequest)) {
      if (!apps.has(request.appId))
        apps.set(
          request.appId,
          await this.options.releases.findApp(request.appId),
        );
      const app = apps.get(request.appId);
      if (!app) continue;
      const mayDecide = await this.mayDecide(caller, request, app);
      const decidable = request.status === 'pending' && mayDecide;
      if (options.awaitingMe) {
        if (decidable) visible.push({ ...request, decidable });
      } else if (
        mayDecide ||
        (await this.options.guard.canApp(caller, 'view', app))
      )
        visible.push({ ...request, decidable });
    }
    return {
      items: await Promise.all(
        visible
          .slice((page - 1) * pageSize, page * pageSize)
          .map((request) => this.described(request)),
      ),
      total: visible.length,
      page,
      pageSize,
    };
  }

  public async get(caller: Caller, id: string): Promise<DeploymentRequestView> {
    const request = await this.requireRequest(id);
    const app = await this.options.releases.requireApp(request.appId);
    const mayDecide = await this.mayDecide(caller, request, app);
    if (!mayDecide && !(await this.options.guard.canApp(caller, 'view', app)))
      throw forbidden();
    return await this.described({
      ...request,
      decidable: request.status === 'pending' && mayDecide,
    });
  }

  /** The request with what it deploys and where, for the reads. */
  private async described(
    request: DeploymentRequestView,
  ): Promise<DeploymentRequestView> {
    const release = await this.options.releases.findRelease(
      request.appId,
      request.releaseId,
    );
    const environment = await this.options.environments.find(
      request.environmentId,
    );
    return {
      ...request,
      release: release
        ? {
            version: release.version,
            sourceCommit: release.sourceCommit,
            build: release.build,
          }
        : null,
      environment: environment
        ? { name: environment.name, protected: environment.protected }
        : null,
    };
  }

  /**
   * Approves and starts the deployment, as the approver. On a protected environment the approver types the App ID
   * again (`confirm`), as a direct deployment there asks.
   */
  public async approve(
    caller: Caller,
    id: string,
    note?: string,
    confirm?: string,
  ): Promise<DeploymentRequestView> {
    const request = await this.requireRequest(id);
    const app = await this.options.releases.requireApp(request.appId);
    await this.requireDecider(caller, request, app);
    const environment = await this.options.environments.find(
      request.environmentId,
    );
    if (environment?.protected && confirm !== app.id)
      throw new ReleasesError(
        'Type the application ID to confirm a deployment to a protected environment.',
        'CONFIRMATION_REQUIRED',
        'FAILED_PRECONDITION',
      );
    // The request names one release, fixed when it was made: nothing swaps it for another, and bytes that are not the
    // ones asked for are refused rather than deployed.
    const release = await this.options.releases.requireRelease(
      request.appId,
      request.releaseId,
    );
    if (release.checksum !== request.releaseChecksum)
      throw new ReleasesError(
        'The release changed since the request was made; ask again.',
        'RELEASE_CHANGED',
        'ABORTED',
      );
    // A variable may have been removed since the request was made: refuse before the request is decided.
    await this.options.releases.assertVariables(
      request.appId,
      request.releaseId,
    );
    await this.decide(caller, request, 'approved', note);
    try {
      const deployment = await this.options.releases.startApprovedDeployment(
        caller,
        request.appId,
        request.releaseId,
        {
          kind: request.kind,
          rollbackTargetDeploymentId: request.rollbackTargetDeploymentId,
          requestId: request.id,
        },
      );
      await this.query()
        .updateTable('relDeploymentRequests')
        .set({ deploymentId: deployment.id, updatedAt: new Date() })
        .where('id', '=', id)
        .execute();
    } catch (error) {
      await this.query()
        .updateTable('relDeploymentRequests')
        .set({
          status: 'failed',
          decisionNote: [normalizeNote(note), errorMessage(error)]
            .filter(Boolean)
            .join('\n'),
          updatedAt: new Date(),
        })
        .where('id', '=', id)
        .execute();
      throw error;
    }
    const decided = await this.requireRequest(id);
    await this.options.events.emit({
      type: 'request.decided',
      app: appView(app),
      request: decided,
      decision: 'approved',
      actor: actorOf(caller),
    });
    return decided;
  }

  public async reject(
    caller: Caller,
    id: string,
    note?: string,
  ): Promise<DeploymentRequestView> {
    const request = await this.requireRequest(id);
    const app = await this.options.releases.requireApp(request.appId);
    await this.requireDecider(caller, request, app);
    await this.decide(caller, request, 'rejected', note);
    const decided = await this.requireRequest(id);
    await this.options.events.emit({
      type: 'request.decided',
      app: appView(app),
      request: decided,
      decision: 'rejected',
      actor: actorOf(caller),
    });
    return decided;
  }

  /** Withdraws a pending request: its requester, or anyone who may decide it. */
  public async cancel(
    caller: Caller,
    id: string,
  ): Promise<DeploymentRequestView> {
    const request = await this.requireRequest(id);
    const app = await this.options.releases.requireApp(request.appId);
    const own = caller.userId !== null && caller.userId === request.requestedBy;
    if (!own && !(await this.mayDecide(caller, request, app)))
      throw forbidden();
    await this.decide(caller, request, 'cancelled');
    const decided = await this.requireRequest(id);
    await this.options.events.emit({
      type: 'request.decided',
      app: appView(app),
      request: decided,
      decision: 'cancelled',
      actor: actorOf(caller),
    });
    return decided;
  }

  /** Whether the caller may approve or reject: a person who is an approver, the requester included. */
  public async mayDecide(
    caller: Caller,
    request: DeploymentRequestView,
    app: AppRecord,
  ): Promise<boolean> {
    if (caller.kind !== 'human' || !caller.userId) return false;
    const environment = await this.options.environments.find(
      request.environmentId,
    );
    if (!environment) return false;
    const approvers = await this.approversOf(environment, request);
    if (approvers.length) return approvers.includes(caller.userId);
    return await this.options.guard.canApp(
      caller,
      environment.protected ? 'deploy-protected' : 'deploy',
      app,
    );
  }

  private async requireDecider(
    caller: Caller,
    request: DeploymentRequestView,
    app: AppRecord,
  ): Promise<void> {
    if (request.status !== 'pending')
      throw new ReleasesError(
        'This request has already been decided.',
        'REQUEST_DECIDED',
        'FAILED_PRECONDITION',
      );
    if (caller.kind !== 'human')
      throw forbidden(
        'Only a person can decide a deployment request.',
        'HUMAN_REQUIRED',
      );
    if (!(await this.mayDecide(caller, request, app))) throw forbidden();
  }

  private async decide(
    caller: Caller,
    request: DeploymentRequestView,
    status: 'approved' | 'rejected' | 'cancelled',
    note?: string,
  ): Promise<void> {
    const now = new Date();
    const result = await this.query()
      .updateTable('relDeploymentRequests')
      .set({
        status,
        decidedBy: caller.userId,
        decidedAt: now,
        decisionNote: normalizeNote(note),
        updatedAt: now,
      })
      .where('id', '=', request.id)
      .where('status', '=', 'pending')
      .execute();
    if (result.updatedCount !== 1)
      throw new ReleasesError(
        'This request has already been decided.',
        'REQUEST_DECIDED',
        'FAILED_PRECONDITION',
      );
  }

  private async approversOf(
    environment: EnvironmentRecord,
    request: DeploymentRequestView,
  ): Promise<readonly string[]> {
    const access = this.options.access();
    if (access?.approversOf)
      return await access.approversOf(environment, request);
    return environment.approvers;
  }

  private async requireRequest(id: string): Promise<DeploymentRequestView> {
    const row = await this.query()
      .selectFrom('relDeploymentRequests')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<Row>();
    if (!row) throw notFound('Deployment request', 'REQUEST_NOT_FOUND', id);
    return decodeRequest(row);
  }

  private query() {
    return this.options.database.connection().query;
  }
}

function decodeRequest(row: Row): DeploymentRequestView {
  return {
    id: String(row.id),
    appId: String(row.appId),
    environmentId: String(row.environmentId),
    releaseId: String(row.releaseId),
    releaseChecksum: String(row.releaseChecksum),
    kind: row.kind === 'rollback' ? 'rollback' : 'deploy',
    rollbackTargetDeploymentId: nullableString(row.rollbackTargetDeploymentId),
    status: String(row.status) as DeploymentRequestStatus,
    note: nullableString(row.note),
    labels: decodeLabels(row.labels),
    requestedBy: nullableString(row.requestedBy),
    requestedVia: (nullableString(row.requestedVia) ?? 'human') as ActorKind,
    decidedBy: nullableString(row.decidedBy),
    decidedAt: iso(decodeOptionalDate(row.decidedAt)),
    decisionNote: nullableString(row.decisionNote),
    deploymentId: nullableString(row.deploymentId),
    createdAt: decodeDate(row.createdAt).toISOString(),
    updatedAt: decodeDate(row.updatedAt).toISOString(),
  };
}

function normalizeNote(note: unknown): string | null {
  if (note === undefined || note === null) return null;
  if (typeof note !== 'string' || note.length > 2000)
    throw new ReleasesError(
      'A note may be at most 2000 characters.',
      'INVALID_NOTE',
      'INVALID_ARGUMENT',
    );
  return note.trim() || null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
