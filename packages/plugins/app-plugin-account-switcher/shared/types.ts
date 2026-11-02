/** What an account switch lets its actor do. `full` acts as the account in every way but managing its credentials. */
export type AccountSwitcherMode = 'off' | 'full';

/** A display title owned by a Permission Set's client namespace, with a stable fallback for other consumers. */
export type AccountRoleTitle =
  | string
  | {
      readonly key: string;
      readonly ns: string;
      readonly defaultValue: string;
    };

export interface AccountSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

/** An account the actor may switch to. */
export interface SwitchableAccount extends AccountSummary {
  /** Directly assigned visible Permission Set titles, translated by the client. */
  readonly roleTitles: readonly AccountRoleTitle[];
  /** Whether requests currently act as this account. */
  readonly current: boolean;
  /** Whether this is the actor's own account: choosing it ends the switch. */
  readonly own: boolean;
}

export interface AccountSwitchState {
  /** Whether the signed-in person, not the account acted as, may switch accounts. */
  readonly canSwitch: boolean;
  /** The switch in force for this session; null when acting as oneself. */
  readonly switched: {
    readonly actor: AccountSummary;
    readonly target: AccountSummary;
    readonly expiresAt: string;
  } | null;
}
