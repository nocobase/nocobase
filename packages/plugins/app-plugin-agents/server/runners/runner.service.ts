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
import {
  isProtocolSupported,
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  ProtocolError,
  TIMINGS,
  ReportedToolInfoSchema,
  type HeartbeatRequest,
  type RegisterRequest,
  type RegisterResponse,
  type AgentTool,
  type RunApp,
  type ToolInfo,
  type UpgradeRequired,
} from '@nocobase/agent-protocol';

import type { DatabaseConnection } from '@nocobase/db';

import { normalizeModel } from '../../shared/model-catalog.js';
import type {
  RegistrationToken,
  RegistrationTokenInput,
  Runner,
  RunnerPatch,
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
} from './runner.store.js';

/** How long a registration token stays usable. */
export const REGISTRATION_TOKEN_TTL_MS: number = 10 * 60_000;

export interface RunnerService {
  createRegistrationToken(
    createdById: string | null,
    input: RegistrationTokenInput,
  ): Promise<RegistrationToken>;
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
  list(): Promise<Runner[]>;
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

/** The marks that still hold: those whose tool the runner reports the same models for as when it was marked. */
export function keptMarks(
  marks: readonly UnavailableModel[],
  tools: readonly ToolInfo[],
): UnavailableModel[] {
  return marks.filter(
    (mark) =>
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

  return {
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

    authenticate: (key, options = {}) =>
      tx.run(async ({ conn, emit }) => {
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
        const now = clock.now().toISOString();
        await runnersRepo(conn).updateMany({
          filter: { id: record.id },
          values: { lastSeenAt: now, status, protocolVersion },
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
        if (
          record.status !== status ||
          Number(record.protocolVersion) !== protocolVersion
        )
          emit({ type: 'runner.changed', runnerId: record.id });
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
      }),

    heartbeat: (runner, request) =>
      tx.run(async (unit) => {
        const { conn, emit } = unit;
        const now = clock.now().toISOString();
        const policy = storedPolicy(request.policy);
        const variables = storedVariableNames(request.variables);
        const tools = request.tools.map((tool) =>
          ReportedToolInfoSchema.parse(tool),
        );
        const marks = runner.unavailableModels ?? [];
        const kept = keptMarks(marks, tools);
        const workspaceUsage = (await require(conn, runner.id)).workspaceUsage;
        const changed =
          request.disk !== undefined ||
          kept.length !== marks.length ||
          runner.version !== request.version ||
          runner.product !== (request.product ?? null) ||
          JSON.stringify(runner.features) !==
            JSON.stringify(cleanList(request.features)) ||
          JSON.stringify(runner.tools) !== JSON.stringify(request.tools) ||
          JSON.stringify(runner.policy) !== JSON.stringify(policy) ||
          JSON.stringify(runner.variables ?? null) !==
            JSON.stringify(variables);
        await runnersRepo(conn).updateMany({
          filter: { id: runner.id },
          values: {
            version: request.version,
            product: request.product ?? null,
            features: cleanList(request.features),
            tools,
            policy: asJson(policy),
            variables: asJson(variables),
            ...(kept.length !== marks.length
              ? { unavailableModels: asJson(kept) }
              : {}),
            // What it holds per tool across every application: read for why a run waits, so it changes nothing else.
            load: asJson({
              ...storedToolLoad(request.load.tools ?? null),
              free: request.load.free,
              slots: request.load.slots,
            }),
            ...(request.disk === undefined
              ? {}
              : {
                  workspaceUsage: asJson({
                    ...(workspaceUsage ?? {
                      measuredAt: now,
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
        if (changed) emit({ type: 'runner.changed', runnerId: runner.id });
        const reported = await require(conn, runner.id);
        await deps.onReport?.(unit, reported);
        return reported;
      }),

    list: async () => {
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
            'Revoke the runner before deleting it.',
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

    async markModelUnavailable(unit, runnerId, tool, model) {
      const runner = await findRunner(unit.conn, runnerId);
      if (!runner) return;
      const normalized = normalizeModel(tool, model);
      const marks = (runner.unavailableModels ?? []).filter(
        (mark) => !(mark.tool === tool && mark.model === normalized),
      );
      const mark: UnavailableModel = {
        tool,
        model: normalized,
        at: clock.now().toISOString(),
        reported: modelsOf(runner.tools, tool),
      };
      await runnersRepo(unit.conn).updateMany({
        filter: { id: runnerId },
        values: {
          unavailableModels: asJson([...marks, mark]),
          updatedAt: clock.now().toISOString(),
        },
      });
      unit.emit({ type: 'runner.changed', runnerId });
    },
  };
}
