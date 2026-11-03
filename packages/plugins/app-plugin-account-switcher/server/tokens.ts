import type {
  AuthSession,
  SessionSubstitute,
} from '@nocobase/app-plugin-authentication';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AccountSwitchState, SwitchableAccount } from '../shared/types.js';

type Session = NonNullable<AuthSession>;

export interface ListSwitchableAccountsInput {
  readonly q?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface SwitchableAccountPage {
  readonly items: readonly SwitchableAccount[];
  readonly total: number;
}

export interface StartAccountSwitchInput {
  readonly userId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

/** Every method takes the session a request resolved to, which is the target's while a switch is in force. */
export interface AccountSwitcherService {
  /** Who this session acts as. Ending a switch that has run out refuses the request with `ACCOUNT_SWITCH_ENDED`. */
  substitute(session: Session): Promise<SessionSubstitute | undefined>;
  state(session: Session): Promise<AccountSwitchState>;
  /** Refuses with `ACCOUNT_SWITCH_NOT_ALLOWED` unless the signed-in person may switch accounts. */
  listAccounts(
    session: Session,
    input: ListSwitchableAccountsInput,
  ): Promise<SwitchableAccountPage>;
  /** Replaces any switch in force, always on behalf of the signed-in person. */
  start(
    session: Session,
    input: StartAccountSwitchInput,
  ): Promise<AccountSwitchState>;
  /** Does nothing when no switch is in force, so a stale tab can return safely. */
  stop(session: Session): Promise<void>;
  /** Whether requests with this session act through a switch. */
  isSwitched(session: Session): boolean;
}

export const accountSwitcherServiceToken: ServiceToken<AccountSwitcherService> =
  createServiceToken<AccountSwitcherService>(
    '@nocobase/app-plugin-account-switcher/service',
  );
