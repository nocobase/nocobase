import type {
  AdministratedUser,
  AuthSession,
  SessionSubstitute,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { DatabaseManager } from '@nocobase/db';

import type {
  AccountRoleTitle,
  AccountSummary,
  AccountSwitchState,
  AccountSwitcherMode,
  SwitchableAccount,
} from '../../shared/types.js';
import {
  accountNotSwitchable,
  accountSwitchEnded,
  accountSwitchNotAllowed,
} from '../errors.js';
import type {
  AccountSwitcherService,
  ListSwitchableAccountsInput,
  StartAccountSwitchInput,
  SwitchableAccountPage,
} from '../tokens.js';

type Session = NonNullable<AuthSession>;

/** Marks a substituted session's id, and keeps it unlike any stored session or API key id. */
const SWITCH_SESSION_PREFIX = 'accountSwitch:';

/** A working day: long enough for testing, and short enough that a forgotten switch cannot linger for days. */
const SWITCH_DURATION_MS = 8 * 60 * 60 * 1000;

type EndReason = 'returned' | 'replaced' | 'expired' | 'targetUnavailable';

interface SwitchRow {
  readonly id: string;
  readonly actorUserId: string;
  readonly actorSessionId: string;
  readonly targetUserId: string;
  readonly expiresAt: Date | string;
}

export interface AccountSwitcherLogger {
  info(details: object, message: string): void;
}

export interface AccountSwitcherServiceDependencies {
  readonly mode: AccountSwitcherMode;
  readonly database: DatabaseManager;
  readonly users: UserAdministrationService;
  readonly authorization: () => AppAuthorization;
  readonly realtime?: () => {
    disconnectSession(sessionId: string): Promise<number>;
  };
  readonly logger?: () => AccountSwitcherLogger | undefined;
  readonly now?: () => Date;
}

export class DefaultAccountSwitcherService implements AccountSwitcherService {
  public constructor(
    private readonly deps: AccountSwitcherServiceDependencies,
  ) {}

  public isSwitched(session: Session): boolean {
    return session.session.id.startsWith(SWITCH_SESSION_PREFIX);
  }

  public async substitute(
    session: Session,
  ): Promise<SessionSubstitute | undefined> {
    if (this.isSwitched(session)) return undefined;
    const row = await this.activeForActorSession(session.session.id);
    if (!row) return undefined;
    const expiresAt = new Date(row.expiresAt);
    if (expiresAt <= this.now()) {
      await this.end(row, 'expired');
      throw accountSwitchEnded();
    }
    if (!(await this.available(row.targetUserId))) {
      await this.end(row, 'targetUnavailable');
      throw accountSwitchEnded();
    }
    return {
      id: `${SWITCH_SESSION_PREFIX}${row.id}`,
      userId: row.targetUserId,
      expiresAt,
    };
  }

  public async state(session: Session): Promise<AccountSwitchState> {
    const row = await this.switchOf(session);
    const actorId = row?.actorUserId ?? session.user.id;
    const [canSwitch, actor, target] = await Promise.all([
      this.canSwitch(actorId),
      row ? this.deps.users.get(row.actorUserId) : undefined,
      row ? this.deps.users.get(row.targetUserId) : undefined,
    ]);
    return {
      canSwitch,
      switched:
        row && actor && target
          ? {
              actor: summary(actor),
              target: summary(target),
              expiresAt: new Date(row.expiresAt).toISOString(),
            }
          : null,
    };
  }

  public async listAccounts(
    session: Session,
    input: ListSwitchableAccountsInput,
  ): Promise<SwitchableAccountPage> {
    const row = await this.switchOf(session);
    const actorId = row?.actorUserId ?? session.user.id;
    await this.requireCanSwitch(actorId);
    const page = await this.deps.users.list({
      page: input.page,
      pageSize: input.pageSize,
      ...(input.q ? { search: input.q } : {}),
      status: 'enabled',
    });
    const titles = await this.roleTitles();
    return {
      total: page.total,
      items: page.items.map((user): SwitchableAccount => ({
        ...summary(user),
        roleTitles: titles.get(user.id) ?? [],
        current: user.id === session.user.id,
        own: user.id === actorId,
      })),
    };
  }

  public async start(
    session: Session,
    input: StartAccountSwitchInput,
  ): Promise<AccountSwitchState> {
    const previous = await this.switchOf(session);
    const actorUserId = previous?.actorUserId ?? session.user.id;
    const actorSessionId = previous?.actorSessionId ?? session.session.id;
    await this.requireCanSwitch(actorUserId);
    const target = await this.deps.users.get(input.userId);
    if (
      input.userId === actorUserId ||
      !target ||
      target.kind !== 'person' ||
      target.disabledAt
    )
      throw accountNotSwitchable(input.userId);

    if (previous) await this.end(previous, 'replaced');
    const now = this.now();
    const id = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + SWITCH_DURATION_MS);
    await this.deps.database
      .query()
      .insertInto('accountSwitches')
      .values({
        id,
        actorUserId,
        actorSessionId,
        targetUserId: target.id,
        mode: this.deps.mode,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        startedAt: now,
        expiresAt,
        endedAt: null,
        endReason: null,
      })
      .execute();
    // Open connections still stream what the previous identity may see.
    await this.disconnect(actorSessionId);
    this.deps.logger?.()?.info(
      {
        event: 'accountSwitcher.start',
        switchId: id,
        actorUserId,
        targetUserId: target.id,
        mode: this.deps.mode,
      },
      'accountSwitcher.start',
    );
    const actor = await this.deps.users.get(actorUserId);
    return {
      canSwitch: true,
      switched: actor
        ? {
            actor: summary(actor),
            target: summary(target),
            expiresAt: expiresAt.toISOString(),
          }
        : null,
    };
  }

  public async stop(session: Session): Promise<void> {
    const row = await this.switchOf(session);
    if (row) await this.end(row, 'returned');
  }

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }

  /** The switch a request acts through, read from the substituted session's own id. */
  private async switchOf(session: Session): Promise<SwitchRow | undefined> {
    if (!this.isSwitched(session)) return undefined;
    return this.selectSwitches()
      .where('id', '=', session.session.id.slice(SWITCH_SESSION_PREFIX.length))
      .where('endedAt', 'is', null)
      .executeTakeFirst<SwitchRow>();
  }

  private activeForActorSession(
    actorSessionId: string,
  ): Promise<SwitchRow | undefined> {
    return this.selectSwitches()
      .where('actorSessionId', '=', actorSessionId)
      .where('endedAt', 'is', null)
      .orderBy('startedAt', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst<SwitchRow>();
  }

  private selectSwitches() {
    return this.deps.database
      .query()
      .selectFrom('accountSwitches')
      .select([
        'id',
        'actorUserId',
        'actorSessionId',
        'targetUserId',
        'expiresAt',
      ]);
  }

  /** Ends every open switch of the actor's session, covering one a concurrent request started. */
  private async end(row: SwitchRow, reason: EndReason): Promise<void> {
    await this.deps.database
      .query()
      .updateTable('accountSwitches')
      .set({ endedAt: this.now(), endReason: reason })
      .where('actorSessionId', '=', row.actorSessionId)
      .where('endedAt', 'is', null)
      .execute();
    await this.disconnect(`${SWITCH_SESSION_PREFIX}${row.id}`);
    this.deps.logger?.()?.info(
      {
        event: 'accountSwitcher.end',
        switchId: row.id,
        actorUserId: row.actorUserId,
        targetUserId: row.targetUserId,
        reason,
      },
      'accountSwitcher.end',
    );
  }

  private async disconnect(sessionId: string): Promise<void> {
    await this.deps.realtime?.().disconnectSession(sessionId);
  }

  private async available(userId: string): Promise<boolean> {
    const user = await this.deps.database
      .query()
      .selectFrom('user')
      .select(['disabledAt', 'deletedAt'])
      .where('id', '=', userId)
      .executeTakeFirst<{ disabledAt: unknown; deletedAt: unknown }>();
    return !!user && user.disabledAt == null && user.deletedAt == null;
  }

  private async requireCanSwitch(userId: string): Promise<void> {
    if (!(await this.canSwitch(userId))) throw accountSwitchNotAllowed();
  }

  /** Decided for the signed-in person directly: the request's authorization context belongs to the target. */
  private async canSwitch(userId: string): Promise<boolean> {
    const authorization = this.deps.authorization();
    const principal = { type: 'user', id: userId };
    const sets = await authorization.permissionSets.getEffective({
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await authorization.subjects.resolveFor(principal)),
      ],
    });
    return sets.some(
      (set) =>
        authorization.permissionSets.protection(set.key)?.unrestricted === true,
    );
  }

  private async roleTitles(): Promise<Map<string, AccountRoleTitle[]>> {
    const api = this.deps.authorization().permissionSets;
    const [sets, assignments] = await Promise.all([
      api.list(),
      api.listAssignments(),
    ]);
    const visible = new Map(
      sets
        .filter((set) => !api.protection(set.key)?.hidden)
        .map((set) => [set.key, set]),
    );
    const titles = new Map<string, AccountRoleTitle[]>();
    for (const { subject, permissionSet } of assignments) {
      const set = visible.get(permissionSet);
      if (subject.type !== 'user' || !set) continue;
      const id = String(subject.id);
      const { title } = set;
      const label: AccountRoleTitle =
        typeof title === 'string'
          ? title.trim() || set.key
          : title
            ? { ...title, defaultValue: set.key }
            : set.key;
      titles.set(id, [...(titles.get(id) ?? []), label]);
    }
    return titles;
  }
}

function summary(user: AdministratedUser): AccountSummary {
  return { id: user.id, name: user.name, email: user.email };
}
