/**
 * Runners: registering with a one-time token, authenticating by key, heartbeats, and what people change afterwards
 * (name, trust, slots, which coding tools it may run, revocation). What a runner has (its system, features and coding
 * tools, each with whether it is signed in) and what its owner's local policy lets it take (`policy`) is what it
 * reports, never configured here; which of its tools it is offered work for is chosen on the web (`enabledTools`,
 * carried over from the registration token, as are its slots and its limits per coding tool unless the runner names
 * its own).
 *
 * A runner speaking a protocol this application does not serve is not turned away: it registers and stays connected
 * as `upgrade_required`, is given no work (claims want `online`), and its owner is told once per protocol
 * (`runner_upgrade_required`, a `RunnerNotice`); once it connects again speaking a protocol this application serves,
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
  type HeartbeatRequest,
  type RegisterRequest,
  type RegisterResponse,
  type RunApp,
  type UpgradeRequired,
} from '@nocobase/agent-protocol';

import type { DatabaseConnection } from '@nocobase/db';

import type {
  RegistrationToken,
  RegistrationTokenInput,
  Runner,
  RunnerPatch,
} from '../../shared/runners.js';
import { later, type Clock } from '../kernel/clock.js';
import {
  CREDENTIAL_PREFIX,
  createCredential,
  credentialPrefix,
  hashCredential,
} from '../kernel/crypto.js';
import { notFound, precondition } from '../kernel/errors.js';
import type { RunnerNotice } from '../kernel/events.js';
import type { IdSource } from '../kernel/ids.js';
import type { People } from '../kernel/people.js';
import type { TxRunner } from '../kernel/tx.js';
import { asJson, cleanList } from '../kernel/values.js';
import {
  absentRunners,
  credentialsRepo,
  findRunner,
  registrationTokensRepo,
  runnersRepo,
  storedPolicy,
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
  /** Revokes the runner and every key it has. The runs it holds go back to the queue (the runs service). */
  revoke(id: string): Promise<Runner>;
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
    emit: (event: { type: 'notice'; notice: RunnerNotice }) => void,
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
            tools: request.tools,
            enabledTools: storedToolChoice(token.enabledTools),
            trust: token.trust,
            ownerUserId: token.createdById,
            status,
            slots,
            toolSlots: asJson(toolSlots),
            load: null,
            acceptJobs: false,
            policy: asJson(storedPolicy(request.policy)),
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
      tx.run(async ({ conn, emit }) => {
        const now = clock.now().toISOString();
        const policy = storedPolicy(request.policy);
        const changed =
          runner.version !== request.version ||
          runner.product !== (request.product ?? null) ||
          JSON.stringify(runner.features) !==
            JSON.stringify(cleanList(request.features)) ||
          JSON.stringify(runner.tools) !== JSON.stringify(request.tools) ||
          JSON.stringify(runner.policy) !== JSON.stringify(policy);
        await runnersRepo(conn).updateMany({
          filter: { id: runner.id },
          values: {
            version: request.version,
            product: request.product ?? null,
            features: cleanList(request.features),
            tools: request.tools,
            policy: asJson(policy),
            // What it holds per tool across every application: read for why a run waits, so it changes nothing else.
            load: asJson(storedToolLoad(request.load.tools ?? null)),
            lastSeenAt: now,
            updatedAt: changed ? now : runner.updatedAt,
          },
        });
        if (changed) emit({ type: 'runner.changed', runnerId: runner.id });
        return require(conn, runner.id);
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

    revoke: (id) =>
      tx.run(async ({ conn, emit }) => {
        await require(conn, id);
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
  };
}
