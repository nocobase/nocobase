/**
 * Runners: registering with a one-time token, authenticating by key, heartbeats, and what people change afterwards
 * (name, trust, slots, which coding tools it may run, revocation). What a runner has (its system, features and coding
 * tools, each with whether it is signed in), what its owner's local policy lets it take (`policy`) and the names of the
 * variables it provides to runs (`variables`) are what it reports, never configured here; which of its tools it is offered work for is chosen on the web (`enabledTools`,
 * carried over from the registration token, as are its slots and its limits per coding tool unless the runner names
 * its own).
 *
 * A runner speaking a protocol this application does not serve is not turned away: it registers and stays connected
 * as `upgrade_required`, is given no work (claims want `online`), and its owner is told once per protocol
 * (`runner_upgrade_required`, an `AgentsNotice`); once it connects again speaking a protocol this application serves,
 * the notice is cleared (`notice.cleared`). A runner whose owner can no longer act (an account disabled or
 * deleted, as the application's people directory says) is refused with `RUNNER_OWNER_DISABLED` until they can again.
 *
 * Thin stand-in: runner keys live in this plugin's own table until the platform offers device authorization (RFC
 * 8628) or an API key kind fit for machines; the protocol does not change when they move.
 */
import type { Agent } from '../../shared/agents.js';
import { quotaBlocks, runnerTakesAgent } from '../../shared/runners.js';

import type { QuotaMarkTarget } from '../../shared/quota.js';

import {
  isProtocolSupported,
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  ProtocolError,
  TIMINGS,
  ReportedToolInfoSchema,
  type QuotaReport,
  type HeartbeatRequest,
  type RegisterRequest,
  type RegisterResponse,
  type AgentTool,
  type RunApp,
  type ToolInfo,
  type UpgradeRequired,
} from '@nocobase/agent-protocol';

import type { DatabaseConnection, RepositoryFilter } from '@nocobase/db';

import {
  normalizeModel,
  TOOL_DISPLAY_NAMES,
  quotaTargetLabel,
} from '../../shared/model-catalog.js';
import type {
  RegistrationToken,
  RegistrationTokenInput,
  RegistrationTokenSummary,
  Runner,
  RunnerPatch,
  RunnerWorkspaceDisk,
  UnavailableModel,
} from '../../shared/runners.js';
import { later, type Clock } from '../kernel/clock.js';
import {
  CREDENTIAL_PREFIX,
  createCredential,
  credentialPrefix,
  hashCredential,
} from '../kernel/crypto.js';
import { notFound, precondition } from '../kernel/errors.js';
import type { AgentsNotice } from '../kernel/events.js';
import type { IdSource } from '../kernel/ids.js';
import type { People } from '../kernel/people.js';
import type { Tx, TxRunner } from '../kernel/tx.js';
import { asJson, cleanList } from '../kernel/values.js';
import {
  absentRunners,
  credentialsRepo,
  findRunner,
  registrationTokensRepo,
  runnersRepo,
  storedPolicy,
  storedVariableNames,
  storedToolChoice,
  storedToolLoad,
  storedToolSlots,
  toRunner,
  type RegistrationTokenRecord,
} from './runner.store.js';

/** How long a registration token stays usable. */
export const REGISTRATION_TOKEN_TTL_MS: number = 10 * 60_000;

export interface RunnerService {
  createRegistrationToken(
    createdById: string | null,
    input: RegistrationTokenInput,
  ): Promise<RegistrationToken>;
  listRegistrationTokens(options: {
    readonly createdById?: string;
    readonly page: number;
    readonly pageSize: number;
  }): Promise<{ data: RegistrationTokenSummary[]; total: number }>;
  /** Registers a runner of any protocol; one this application does not serve starts `upgrade_required`. */
  register(request: RegisterRequest): Promise<RegisterResponse>;
  /** Whether `token` is a registration token that can still be used; using it is left to `register`. */
  isRegistrationTokenUsable(token: string): Promise<boolean>;
  /**
   * The runner a key belongs to, marked as seen: `online`, or `upgrade_required` when the protocol it speaks
   * (`protocolVersion`, from the request; the one it registered with otherwise) is not served. `RUNNER_KEY_INVALID`,
   * `RUNNER_REVOKED` or `RUNNER_OWNER_DISABLED` otherwise. With `touch: false` (a read, such as a `GET`), nothing is
   * written: the runner is answered as it was last seen.
   */
  authenticate(
    key: string,
    options?: {
      readonly protocolVersion?: number;
      readonly touch?: boolean;
    },
  ): Promise<Runner>;
  heartbeat(runner: Runner, request: HeartbeatRequest): Promise<Runner>;
  reportQuota(
    unit: Tx,
    runnerId: string,
    tool: AgentTool,
    model: string | null,
    quota: QuotaReport,
    observation?: {
      runId: string;
      agentId: string;
      subject: { kind: string; id: string };
    },
  ): Promise<void>;
  clearQuota(id: string, target: QuotaMarkTarget): Promise<void>;
  list(options?: { readonly workspaceDetails?: boolean }): Promise<Runner[]>;
  /** 404 when absent. */
  get(id: string): Promise<Runner>;
  update(id: string, patch: RunnerPatch): Promise<Runner>;
  /**
   * Revokes the runner and every key it has. The runs it holds go back to the queue (the runs service). When `by` is
   * someone other than its owner, the owner is told (`runner_revoked`).
   */
  revoke(id: string, options?: { readonly by?: string }): Promise<Runner>;
  /** Deletes a revoked runner and its keys; `CONFLICT` while it is not revoked. Its past runs keep their `runnerId`. */
  remove(id: string): Promise<void>;
  /** Marks online (and `upgrade_required`) runners not seen since `before` offline; returns their ids. */
  markOffline(before: Date): Promise<string[]>;
  /** The runners that are online now, read on `conn`. */
  online(conn: DatabaseConnection): Promise<Runner[]>;
  /** Every runner, whatever its status, read on `conn` (without owners' names). */
  all(conn: DatabaseConnection): Promise<Runner[]>;
  /** Of `ids`, the runners that are not online (offline, revoked, or gone), read on `conn`. */
  absent(conn: DatabaseConnection, ids: readonly string[]): Promise<string[]>;
  /** The runner, read on `conn`; null when there is none. */
  find(conn: DatabaseConnection, id: string): Promise<Runner | null>;
  /**
   * Marks `model` of `tool` unavailable on the runner, in the caller's transaction: it is not offered there until the
   * runner reports that tool's models differently.
   */
  markModelUnavailable(
    unit: Tx,
    runnerId: string,
    tool: AgentTool,
    model: string,
  ): Promise<void>;
}

export interface RunnerServiceDeps {
  /** Enabled discovered agents, read once only when a fresh quota notice is emitted. */
  readonly quotaAgents: (unit: Tx) => Promise<readonly Agent[]>;
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /** Who the runner registers with, so one runner can tell its applications apart. */
  readonly app?: RunApp;
  /** Owners' names. */
  readonly people?: People;
  /** The newest runner the application serves for a runner's platform, for the upgrade notice; none without it. */
  readonly latestRunner?: (runner: Runner) => Promise<string | null>;
  /** What a runner reported, as stored, in the transaction of its registration or heartbeat. */
  readonly onReport?: (unit: Tx, runner: Runner) => Promise<void>;
}

/** A tool's reported models, normalized and sorted, to tell when the runner reports them differently. */
function modelsOf(tools: readonly ToolInfo[], tool: AgentTool): string[] {
  const info = tools.find((item) => item.kind === tool);
  return [
    ...new Set(
      (info?.models ?? []).map((model) => normalizeModel(tool, model.id)),
    ),
  ].sort();
}

export function quotaKey(mark: UnavailableModel): string {
  return JSON.stringify([
    mark.tool,
    mark.scope ?? 'model',
    mark.model,
    mark.window ?? 'account',
  ]);
}

/** The marks that still hold: those whose tool the runner reports the same models for as when it was marked. */
export function keptMarks(
  marks: readonly UnavailableModel[],
  tools: readonly ToolInfo[],
): UnavailableModel[] {
  return marks.filter(
    (mark) =>
      mark.reason === 'toolQuota' ||
      JSON.stringify(modelsOf(tools, mark.tool)) ===
        JSON.stringify([...mark.reported].sort()),
  );
}

/** What a runner speaking `protocolVersion` is told while this application cannot work with it. */
export function upgradeRequiredOf(protocolVersion: number): UpgradeRequired {
  return {
    status: 'upgradeRequired',
    runnerProtocolVersion: protocolVersion,
    minProtocolVersion: MIN_PROTOCOL_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    message:
      protocolVersion > PROTOCOL_VERSION
        ? `This runner speaks protocol ${protocolVersion}, newer than this application (${MIN_PROTOCOL_VERSION} to ${PROTOCOL_VERSION}); install the runner it serves.`
        : `This runner speaks protocol ${protocolVersion}; this application needs ${MIN_PROTOCOL_VERSION} to ${PROTOCOL_VERSION}. Update the runner (nocobase-runner update).`,
  };
}

/** The status a connected runner speaking `protocolVersion` has. */
function liveStatus(protocolVersion: number): 'online' | 'upgrade_required' {
  return isProtocolSupported(protocolVersion) ? 'online' : 'upgrade_required';
}

/** Free space has to move this much before a heartbeat's disk sample is announced. */
const DISK_NOTICE_BYTES = 1024 ** 3;

/**
 * Whether a heartbeat's disk sample is worth announcing (`runner.changed`): one appears or goes, its size or threshold
 * changes, free space crosses the threshold, or it moves by `DISK_NOTICE_BYTES`. Every heartbeat samples the disk, and
 * each announcement wakes every waiting claim and refreshes every open runtimes page.
 */
export function diskMoved(
  previous: RunnerWorkspaceDisk | null,
  next: {
    readonly freeBytes: number;
    readonly totalBytes: number;
    readonly minFreeBytes?: number | null;
  } | null,
): boolean {
  if (!previous || !next) return previous !== next;
  const threshold = next.minFreeBytes ?? null;
  const low = (disk: { freeBytes: number }, min: number | null): boolean =>
    min !== null && disk.freeBytes < min;
  return (
    previous.totalBytes !== next.totalBytes ||
    previous.minFreeBytes !== threshold ||
    low(previous, previous.minFreeBytes) !== low(next, threshold) ||
    Math.abs(previous.freeBytes - next.freeBytes) >= DISK_NOTICE_BYTES
  );
}

export function createRunnerService(deps: RunnerServiceDeps): RunnerService {
  const { tx, ids, clock } = deps;

  /** Tells the runner's owner it needs an upgrade; once per runner and protocol. */
  const noticeUpgrade = async (
    emit: (event: { type: 'notice'; notice: AgentsNotice }) => void,
    runner: Runner,
  ): Promise<void> => {
    if (!runner.ownerUserId) return;
    const latest = (await deps.latestRunner?.(runner)) ?? null;
    const required = upgradeRequiredOf(runner.protocolVersion);
    emit({
      type: 'notice',
      notice: {
        key: `runners:runner-upgrade-required:${runner.id}:${runner.protocolVersion}`,
        type: 'runner_upgrade_required',
        userIds: [runner.ownerUserId],
        subject: { kind: 'runner', id: runner.id, label: runner.name },
        title: `${runner.name} needs an upgrade`,
        body: `${required.message} It runs nothing until then.`,
        params: {
          runnerName: runner.name,
          runnerVersion: runner.version,
          protocolVersion: runner.protocolVersion,
          minProtocolVersion: MIN_PROTOCOL_VERSION,
          maxProtocolVersion: PROTOCOL_VERSION,
          latestVersion: latest,
        },
      },
    });
  };

  const require = async (
    conn: Parameters<typeof findRunner>[0],
    id: string,
  ): Promise<Runner> => {
    const runner = await findRunner(conn, id);
    if (!runner) throw notFound('Runner');
    return runner;
  };

  async function authenticate(
    key: string,
    options: NonNullable<Parameters<RunnerService['authenticate']>[1]> = {},
    unit?: Tx,
  ): Promise<Runner> {
    const conn = unit?.conn ?? tx.read();
    const emit = unit?.emit ?? (() => {});
    const credential = key
      ? await credentialsRepo(conn).findOne({
          filter: { keyHash: hashCredential(key) },
        })
      : undefined;
    if (!credential)
      throw new ProtocolError(
        'RUNNER_KEY_INVALID',
        'The runner key is not valid. Register the runner again.',
      );
    const record = await runnersRepo(conn).findOne({
      filter: { id: credential.runnerId },
    });
    if (credential.revokedAt || !record || record.status === 'revoked')
      throw new ProtocolError(
        'RUNNER_REVOKED',
        'This runner was revoked. Register it again to use it.',
      );
    if (
      record.ownerUserId &&
      (await deps.people?.inactive(conn, [record.ownerUserId]))?.has(
        record.ownerUserId,
      )
    )
      throw new ProtocolError(
        'RUNNER_OWNER_DISABLED',
        "This runner's owner can no longer sign in, so the runner cannot work until their account is enabled again.",
      );
    if (options.touch === false) return toRunner(record);
    const protocolVersion =
      options.protocolVersion ?? Number(record.protocolVersion);
    const status = liveStatus(protocolVersion);
    const changed =
      record.status !== status ||
      Number(record.protocolVersion) !== protocolVersion;
    if (changed && !unit)
      return tx.run((transaction) => authenticate(key, options, transaction));
    const now = clock.now().toISOString();
    await runnersRepo(conn).updateMany({
      filter: { id: record.id },
      values: {
        lastSeenAt: now,
        ...(changed ? { status, protocolVersion } : {}),
      },
    });
    await credentialsRepo(conn).updateMany({
      filter: { id: credential.id },
      values: { lastUsedAt: now },
    });
    const runner = toRunner({
      ...record,
      lastSeenAt: now,
      status,
      protocolVersion,
    });
    if (changed) emit({ type: 'runner.changed', runnerId: record.id });
    if (status === 'upgrade_required' && record.status !== status)
      await noticeUpgrade(emit, runner);
    // It was told to upgrade (it last spoke a protocol not served) and now speaks one that is: the notice is over.
    if (
      status === 'online' &&
      !isProtocolSupported(Number(record.protocolVersion))
    )
      emit({
        type: 'notice.cleared',
        notice: {
          type: 'runner_upgrade_required',
          subject: { kind: 'runner', id: runner.id, label: runner.name },
        },
      });
    return runner;
  }

  return {
    listRegistrationTokens: async (options) => {
      const filter: RepositoryFilter<RegistrationTokenRecord> = (f) =>
        f.and([
          f.date('usedAt').empty(),
          f.date('expiresAt').after(clock.now()),
          ...(options.createdById === undefined
            ? []
            : [f.string('createdById').eq(options.createdById)]),
        ]);
      const repo = registrationTokensRepo(tx.read());
      const records = await repo.findMany({
        filter,
        sort: (sort) => sort.field('id').desc(),
        limit: options.pageSize,
        offset: (options.page - 1) * options.pageSize,
      });
      const total = await repo.count({ filter });
      return {
        data: records.map((record) => ({
          id: record.id,
          createdById: record.createdById,
          trust: record.trust,
          enabledTools: storedToolChoice(record.enabledTools),
          slots: record.slots,
          toolSlots: storedToolSlots(record.toolSlots),
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
        })),
        total,
      };
    },
    createRegistrationToken: (createdById, input) =>
      tx.run(async ({ conn }) => {
        const now = clock.now();
        const token = createCredential(CREDENTIAL_PREFIX.registration);
        const id = ids.next();
        const trust = input.trust ?? 'ownerOnly';
        const enabledTools = storedToolChoice(input.enabledTools);
        const expiresAt = later(now, REGISTRATION_TOKEN_TTL_MS);
        const slots = input.slots ?? null;
        const toolSlots = storedToolSlots(input.toolSlots);
        await registrationTokensRepo(conn).createOne({
          values: {
            id,
            tokenHash: hashCredential(token),
            createdById,
            trust,
            enabledTools,
            slots,
            toolSlots: asJson(toolSlots),
            expiresAt,
            usedAt: null,
            runnerId: null,
            createdAt: now.toISOString(),
          },
        });
        return {
          id,
          token,
          trust,
          enabledTools,
          slots,
          toolSlots,
          expiresAt,
        };
      }),

    register: (request) =>
      tx.run(async ({ conn, emit }) => {
        const status = liveStatus(request.protocolVersion);
        const now = clock.now();
        const nowText = now.toISOString();
        const tokens = registrationTokensRepo(conn);
        const token = await tokens.findOne({
          filter: { tokenHash: hashCredential(request.registrationToken) },
        });
        const invalidToken = new ProtocolError(
          'REGISTRATION_TOKEN_INVALID',
          'The registration token is unknown, used or expired. Create a new one.',
        );
        if (
          !token ||
          token.usedAt ||
          Date.parse(token.expiresAt) <= now.getTime()
        )
          throw invalidToken;
        // Claims the token; a concurrent registration with the same token updates nothing and fails.
        const claimed = await tokens.updateMany({
          filter: (f) =>
            f.and([f.string('id').eq(token.id), f.date('usedAt').empty()]),
          values: { usedAt: nowText },
        });
        if (claimed.updatedCount !== 1) throw invalidToken;

        const runnerId = ids.next();
        // Host names are self-reported: they must never authorize revoking another person's machine.
        const previous = await runnersRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.string('name').eq(request.name),
              f.string('hostname').eq(request.hostname),
              token.createdById === null
                ? f.string('ownerUserId').empty()
                : f.string('ownerUserId').eq(token.createdById),
              f.string('status').ne('revoked'),
            ]),
        });
        for (const runner of previous) {
          await runnersRepo(conn).updateMany({
            filter: { id: runner.id },
            values: { status: 'revoked', updatedAt: nowText },
          });
          await credentialsRepo(conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('runnerId').eq(runner.id),
                f.date('revokedAt').empty(),
              ]),
            values: { revokedAt: nowText },
          });
          emit({ type: 'runner.changed', runnerId: runner.id });
        }
        // The runner's explicit `--slots`, else the token's, else 1.
        const slots =
          request.slots ?? (token.slots === null ? 1 : Number(token.slots));
        // Its own limits per tool when it sent them, else the token's.
        const toolSlots =
          request.toolSlots === undefined
            ? storedToolSlots(token.toolSlots)
            : storedToolSlots(request.toolSlots);
        await runnersRepo(conn).createOne({
          values: {
            id: runnerId,
            name: request.name,
            hostname: request.hostname,
            os: request.os,
            arch: request.arch,
            version: request.version,
            product: request.product ?? null,
            protocolVersion: request.protocolVersion,
            features: cleanList(request.features),
            tools: request.tools.map((tool) =>
              ReportedToolInfoSchema.parse(tool),
            ),
            enabledTools: storedToolChoice(token.enabledTools),
            trust: token.trust,
            ownerUserId: token.createdById,
            status,
            slots,
            toolSlots: asJson(toolSlots),
            load: null,
            acceptJobs: false,
            policy: asJson(storedPolicy(request.policy)),
            variables: asJson(storedVariableNames(request.variables)),
            lastSeenAt: nowText,
            createdAt: nowText,
            updatedAt: nowText,
          },
        });
        const key = createCredential(CREDENTIAL_PREFIX.runnerKey);
        await credentialsRepo(conn).createOne({
          values: {
            id: ids.next(),
            runnerId,
            keyHash: hashCredential(key),
            keyPrefix: credentialPrefix(key),
            revokedAt: null,
            lastUsedAt: null,
            createdAt: nowText,
          },
        });
        await tokens.updateMany({
          filter: { id: token.id },
          values: { runnerId },
        });
        await deps.onReport?.({ conn, emit }, await require(conn, runnerId));
        emit({ type: 'runner.changed', runnerId });
        if (status === 'upgrade_required')
          await noticeUpgrade(emit, await require(conn, runnerId));
        return {
          ...(deps.app ? { app: deps.app } : {}),
          runnerId,
          runnerKey: key,
          heartbeatIntervalMs: TIMINGS.heartbeatIntervalMs,
          pollTimeoutMs: TIMINGS.pollTimeoutMs,
          leaseRenewMs: TIMINGS.leaseRenewMs,
          serverTime: nowText,
          slots,
          ...(toolSlots ? { toolSlots } : {}),
        };
      }),

    isRegistrationTokenUsable: async (token) => {
      if (!token) return false;
      const record = await registrationTokensRepo(tx.read()).findOne({
        filter: { tokenHash: hashCredential(token) },
      });
      return Boolean(
        record &&
        !record.usedAt &&
        Date.parse(record.expiresAt) > clock.now().getTime(),
      );
    },

    authenticate,

    heartbeat: (runner, request) =>
      tx.run(async (unit) => {
        const { conn, emit } = unit;
        const now = clock.now().toISOString();
        const policy = storedPolicy(request.policy);
        const variables = storedVariableNames(request.variables);
        const tools = request.tools.map((tool) =>
          ReportedToolInfoSchema.parse(tool),
        );
        const current = await require(conn, runner.id);
        const marks = current.unavailableModels ?? [];
        const kept = keptMarks(marks, tools);
        const workspaceUsage = current.workspaceUsage;
        const changed =
          (request.disk !== undefined &&
            diskMoved(workspaceUsage?.disk ?? null, request.disk)) ||
          kept.length !== marks.length ||
          runner.version !== request.version ||
          runner.product !== (request.product ?? null) ||
          JSON.stringify(runner.features) !==
            JSON.stringify(cleanList(request.features)) ||
          JSON.stringify(runner.tools) !== JSON.stringify(request.tools) ||
          JSON.stringify(runner.policy) !== JSON.stringify(policy) ||
          JSON.stringify(runner.variables ?? null) !==
            JSON.stringify(variables);
        const heartbeatUpdate = await runnersRepo(conn).updateMany({
          filter:
            kept.length !== marks.length
              ? { id: runner.id, quotaRevision: current.quotaRevision ?? 0 }
              : { id: runner.id },
          values: {
            version: request.version,
            product: request.product ?? null,
            features: cleanList(request.features),
            tools,
            policy: asJson(policy),
            variables: asJson(variables),
            ...(kept.length !== marks.length
              ? {
                  unavailableModels: asJson(kept),
                  quotaRevision: (current.quotaRevision ?? 0) + 1,
                }
              : {}),
            // What it holds per tool across every application: read for why a run waits, so it changes nothing else.
            load: asJson({
              ...storedToolLoad(request.load.tools ?? null),
              free: request.load.free,
              slots: request.load.slots,
              ...(request.load.draining
                ? { draining: request.load.draining }
                : {}),
            }),
            ...(request.disk === undefined
              ? {}
              : {
                  workspaceUsage: asJson({
                    ...(workspaceUsage ?? {
                      measuredAt: null,
                      count: 0,
                      unpushedCount: 0,
                      workspaces: [],
                    }),
                    disk:
                      request.disk === null
                        ? null
                        : {
                            ...request.disk,
                            minFreeBytes: request.disk.minFreeBytes ?? null,
                          },
                    diskMeasuredAt: now,
                  }),
                }),
            lastSeenAt: now,
            updatedAt: changed ? now : runner.updatedAt,
          },
        });
        if (heartbeatUpdate.updatedCount !== 1)
          throw new ProtocolError(
            'REVISION_CONFLICT',
            'Quota changed during heartbeat; report again.',
          );
        if (changed) emit({ type: 'runner.changed', runnerId: runner.id });
        const reported = await require(conn, runner.id);
        await deps.onReport?.(unit, reported);
        return reported;
      }),

    list: async (options) => {
      const conn = tx.read();
      const records = await runnersRepo(conn).findMany({
        sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
      });
      const names =
        (await deps.people?.names(
          conn,
          records.map((record) => record.ownerUserId),
        )) ?? new Map<string, string>();
      return records.map((record) =>
        toRunner(
          record,
          record.ownerUserId ? (names.get(record.ownerUserId) ?? null) : null,
          options?.workspaceDetails ?? true,
        ),
      );
    },

    get: async (id) => {
      const conn = tx.read();
      const runner = await require(conn, id);
      const names =
        (await deps.people?.names(conn, [runner.ownerUserId])) ??
        new Map<string, string>();
      return {
        ...runner,
        ownerName: runner.ownerUserId
          ? (names.get(runner.ownerUserId) ?? null)
          : null,
      };
    },

    update: (id, patch) =>
      tx.run(async ({ conn, emit }) => {
        await require(conn, id);
        const values: Record<string, unknown> = {
          updatedAt: clock.now().toISOString(),
        };
        if (patch.name !== undefined) values.name = patch.name;
        if (patch.trust !== undefined) values.trust = patch.trust;
        if (patch.slots !== undefined) values.slots = patch.slots;
        if (patch.toolSlots !== undefined)
          values.toolSlots = asJson(storedToolSlots(patch.toolSlots));
        if (patch.enabledTools !== undefined)
          values.enabledTools = storedToolChoice(patch.enabledTools);
        if (patch.acceptJobs !== undefined)
          values.acceptJobs = patch.acceptJobs;
        await runnersRepo(conn).updateMany({ filter: { id }, values });
        emit({ type: 'runner.changed', runnerId: id });
        return require(conn, id);
      }),

    revoke: (id, options) =>
      tx.run(async ({ conn, emit }) => {
        const runner = await require(conn, id);
        const now = clock.now().toISOString();
        await runnersRepo(conn).updateMany({
          filter: { id },
          values: { status: 'revoked', updatedAt: now },
        });
        await credentialsRepo(conn).updateMany({
          filter: (f) =>
            f.and([f.string('runnerId').eq(id), f.date('revokedAt').empty()]),
          values: { revokedAt: now },
        });
        const by = options?.by;
        if (by && runner.ownerUserId && runner.ownerUserId !== by) {
          const byName =
            (await deps.people?.names(conn, [by]))?.get(by) ?? null;
          emit({
            type: 'notice',
            notice: {
              key: `runners:runner-revoked:${runner.id}`,
              type: 'runner_revoked',
              userIds: [runner.ownerUserId],
              subject: { kind: 'runner', id: runner.id, label: runner.name },
              title: `${runner.name} was revoked`,
              body: `${byName ?? 'A manager of runners'} revoked your runner ${runner.name}. It takes no more work; register it again to use it.`,
              params: {
                runnerName: runner.name,
                revokedByUserId: by,
                revokedByName: byName,
              },
            },
          });
        }
        emit({ type: 'runner.changed', runnerId: id });
        return require(conn, id);
      }),

    remove: (id) =>
      tx.run(async ({ conn, emit }) => {
        const runner = await require(conn, id);
        if (runner.status !== 'revoked')
          throw precondition(
            'RUNNER_NOT_REVOKED',
            `Revoke the runner before deleting it: run runtime revoke ${id}, then runtime delete ${id}.`,
          );
        await credentialsRepo(conn).deleteMany({
          filter: (f) => f.string('runnerId').eq(id),
        });
        await runnersRepo(conn).deleteMany({ filter: { id } });
        emit({ type: 'runner.changed', runnerId: id });
      }),

    markOffline: (before) =>
      tx.run(async ({ conn, emit }) => {
        const stale = await runnersRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.or([
                f.string('status').eq('online'),
                f.string('status').eq('upgrade_required'),
              ]),
              f.or([
                f.date('lastSeenAt').empty(),
                f.date('lastSeenAt').before(before),
              ]),
            ]),
        });
        const offline: string[] = [];
        for (const runner of stale) {
          const result = await runnersRepo(conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(runner.id),
                f.string('status').eq(runner.status),
              ]),
            values: { status: 'offline' },
          });
          if (result.updatedCount === 1) {
            offline.push(runner.id);
            emit({ type: 'runner.changed', runnerId: runner.id });
          }
        }
        return offline;
      }),

    online: async (conn) =>
      (await runnersRepo(conn).findMany({ filter: { status: 'online' } })).map(
        (record) => toRunner(record),
      ),

    all: async (conn) =>
      (await runnersRepo(conn).findMany({})).map((record) => toRunner(record)),

    absent: (conn, ids) => absentRunners(conn, ids),

    find: (conn, id) => findRunner(conn, id),

    async reportQuota(unit, runnerId, tool, model, quota, observation) {
      const runner = await require(unit.conn, runnerId);
      const now = clock.now().toISOString();
      const marks = [...(runner.unavailableModels ?? [])];
      const oldMarks = JSON.stringify(marks);
      const usage = [...(runner.quotaUsage ?? [])];
      const fresh: UnavailableModel[] = [];
      for (const window of quota.windows) {
        // A default Claude lease cannot prove a model-specific target; block this tool conservatively.
        const scope =
          tool === 'claude' && !model && window.scope === 'model'
            ? 'tool'
            : window.scope;
        const target =
          scope === 'tool'
            ? ''
            : scope === 'model'
              ? normalizeModel(tool, window.target)
              : window.target;
        // The lease, not an untrusted report, decides which provider/model may be affected.
        const normalized = model ? normalizeModel(tool, model) : '';
        if (
          scope !== 'tool' &&
          (!normalized ||
            (scope === 'provider'
              ? normalized.split('/')[0] !== target
              : normalized !== target))
        )
          continue;
        if ((tool === 'opencode' || tool === 'pi') && scope !== 'provider')
          continue;
        const same = (m: UnavailableModel) =>
          m.reason === 'toolQuota' &&
          m.tool === tool &&
          m.scope === scope &&
          m.model === target &&
          m.window === window.window;
        const index = usage.findIndex(
          (u) =>
            u.tool === tool &&
            u.scope === scope &&
            u.target === target &&
            u.window === window.window,
        );
        const previous = index < 0 ? undefined : usage[index];
        const sample = {
          tool,
          window: window.window,
          scope: scope,
          target,
          resetsAt: window.resetsAt,
          ...(window.usedPercent === undefined
            ? {}
            : { usedPercent: window.usedPercent }),
          observedAt: now,
          exhausted: window.exhausted,
        };
        if (
          !previous ||
          previous.resetsAt !== sample.resetsAt ||
          previous.exhausted !== sample.exhausted ||
          (previous.usedPercent === undefined) !==
            (sample.usedPercent === undefined) ||
          Math.abs((previous.usedPercent ?? 0) - (sample.usedPercent ?? 0)) >=
            5 ||
          (previous.usedPercent ?? 0) >= 90 !== (sample.usedPercent ?? 0) >= 90
        ) {
          if (index < 0) usage.push(sample);
          else usage[index] = sample;
        }
        if (!window.exhausted) continue;
        const old = marks.find(same);
        if (
          old &&
          old.resetsAt === window.resetsAt &&
          (!old.resetsAt || Date.parse(old.resetsAt) > Date.parse(now))
        )
          continue;
        const mark: UnavailableModel = {
          reason: 'toolQuota',
          tool,
          scope: scope,
          model: target,
          window: window.window,
          resetsAt: window.resetsAt,
          at: now,
          reported: [],
        };
        const at = marks.findIndex(same);
        if (at < 0) marks.push(mark);
        else marks[at] = mark;
        if (
          !old ||
          (old.resetsAt && Date.parse(old.resetsAt) <= Date.parse(now))
        )
          fresh.push(mark);
      }
      if (
        JSON.stringify(marks) ===
          JSON.stringify(runner.unavailableModels ?? []) &&
        JSON.stringify(usage) === JSON.stringify(runner.quotaUsage ?? [])
      )
        return;
      const changed = await runnersRepo(unit.conn).updateMany({
        filter: { id: runnerId, quotaRevision: runner.quotaRevision ?? 0 },
        values: {
          unavailableModels: asJson(marks),
          quotaUsage: asJson(usage),
          quotaRevision: (runner.quotaRevision ?? 0) + 1,
        },
      });
      if (changed.updatedCount !== 1)
        throw new ProtocolError(
          'REVISION_CONFLICT',
          'Quota changed; report again.',
        );
      if (JSON.stringify(marks) !== oldMarks)
        unit.emit({ type: 'runner.changed', runnerId });
      const noticeAgents =
        runner.ownerUserId && fresh.length ? await deps.quotaAgents(unit) : [];
      if (runner.ownerUserId)
        for (const mark of fresh)
          unit.emit({
            type: 'notice',
            notice: {
              key: `runners:quota:${runnerId}:${quotaKey(mark)}:${mark.at}`,
              type: 'runner_quota',
              userIds: [runner.ownerUserId],
              subject: { kind: 'runner', id: runnerId, label: runner.name },
              title: `${TOOL_DISPLAY_NAMES[tool]}${mark.model ? ` · ${quotaTargetLabel(tool, mark.scope ?? 'model', mark.model)}` : ''} quota exhausted on ${runner.name}`,
              body: mark.resetsAt
                ? `Expected reset: ${mark.resetsAt}. Queued work can resume afterwards.`
                : 'Reset time unknown. Restore the quota, then clear the mark on the runtime page.',
              params: {
                runnerName: runner.name,
                affectedAgentNames: noticeAgents
                  .filter(
                    (agent) =>
                      (agent.source === 'runner' ||
                        agent.id === observation?.agentId) &&
                      runnerTakesAgent(
                        {
                          ...runner,
                          unavailableModels: [],
                          workspaceUsage: null,
                        },
                        agent,
                        Date.parse(now),
                      ) &&
                      agent.modelEntries.some(
                        (entry) =>
                          quotaBlocks(
                            { ...runner, unavailableModels: [mark] },
                            entry,
                            Date.parse(now),
                          ).length > 0,
                      ),
                  )
                  .map((agent) => agent.name)
                  .join(', '),
                ...(observation
                  ? {
                      runId: observation.runId,
                      agentId: observation.agentId,
                      issueId:
                        observation.subject.kind === 'issue'
                          ? observation.subject.id
                          : null,
                    }
                  : {}),
                tool,
                scope: mark.scope ?? 'model',
                target: mark.model,
                resetsAt: mark.resetsAt ?? null,
                quotaKey: quotaKey(mark),
              },
            },
          });
    },

    clearQuota: (id, target) =>
      tx.run(async (unit) => {
        const runner = await require(unit.conn, id);
        const revision = runner.quotaRevision;
        const key = JSON.stringify([
          target.tool,
          target.scope,
          target.target,
          target.window,
        ]);
        const marks = runner.unavailableModels ?? [];
        const selected = marks.find(
          (mark) => mark.reason === 'toolQuota' && quotaKey(mark) === key,
        );
        if (selected?.resetsAt)
          throw precondition(
            'QUOTA_RESET_KNOWN',
            'Known quota reset times clear automatically.',
          );
        const kept = marks.filter(
          (mark) => mark.reason !== 'toolQuota' || quotaKey(mark) !== key,
        );
        if (kept.length === marks.length) return;
        const changed = await runnersRepo(unit.conn).updateMany({
          filter: { id, quotaRevision: revision },
          values: {
            unavailableModels: asJson(kept),
            quotaRevision: revision + 1,
          },
        });
        if (changed.updatedCount !== 1)
          throw new ProtocolError(
            'REVISION_CONFLICT',
            'Quota changed; clear again.',
          );
        unit.emit({ type: 'runner.changed', runnerId: id });
        unit.emit({
          type: 'notice.cleared',
          notice: {
            type: 'runner_quota',
            subject: { kind: 'runner', id, label: runner.name },
            key,
          },
        });
      }),

    async markModelUnavailable(unit, runnerId, tool, model) {
      const runner = await findRunner(unit.conn, runnerId);
      if (!runner) return;
      const normalized = normalizeModel(tool, model);
      const marks = (runner.unavailableModels ?? []).filter(
        (mark) =>
          mark.reason === 'toolQuota' ||
          !(mark.tool === tool && mark.model === normalized),
      );
      const mark: UnavailableModel = {
        tool,
        model: normalized,
        at: clock.now().toISOString(),
        reported: modelsOf(runner.tools, tool),
      };
      const changed = await runnersRepo(unit.conn).updateMany({
        filter: { id: runnerId, quotaRevision: runner.quotaRevision ?? 0 },
        values: {
          quotaRevision: (runner.quotaRevision ?? 0) + 1,
          unavailableModels: asJson([...marks, mark]),
          updatedAt: clock.now().toISOString(),
        },
      });
      if (changed.updatedCount !== 1)
        throw new ProtocolError(
          'REVISION_CONFLICT',
          'Quota changed; report again.',
        );
      unit.emit({ type: 'runner.changed', runnerId });
    },
  };
}
