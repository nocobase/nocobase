/** Where an effective setting comes from. `default` is Better Auth's or the plugin's own default. */
export type ConfigSource = 'env' | 'file' | 'code' | 'default';

/** The origin of one setting: its configuration path, where its value comes from and, for `env`, the variable. */
export interface ConfigOrigin {
  readonly path: string;
  readonly source: ConfigSource;
  readonly env?: string;
}

/** A translatable text: a key in a client namespace, with the English text to show when no translation is loaded. */
export interface SignInMethodText {
  readonly key: string;
  readonly ns: string;
  readonly defaultValue: string;
}

/** An effective value and where it comes from. */
export interface SettingValue<TValue> {
  readonly value: TValue;
  readonly origin: ConfigOrigin;
}

/** Something an administrator should fix, named by a stable code the page translates. */
export interface AuthenticationSettingsIssue {
  readonly code:
    'passwordResetUnavailable' | 'publicOriginMissing' | 'registrationFeedback';
  /** The configuration path to change. */
  readonly path: string;
}

export interface AuthenticationSignInMethod {
  readonly id: string;
  readonly title: SignInMethodText;
  readonly description?: SignInMethodText;
  readonly config?: string;
  readonly status: 'enabled' | 'notConfigured';
  readonly origin?: ConfigOrigin;
  readonly signInEntry: boolean;
  readonly detailsPath?: string;
  /** For single sign-on and social sign-in: the configured provider ids. */
  readonly providers: readonly string[];
  /** For a built-in method that is not configured: the guide that explains how to turn it on. */
  readonly guide?: 'sso' | 'social' | 'twoFactor' | 'passkey';
}

/** Which mail sender password reset uses, by name only. */
export interface PasswordResetSenderDescription {
  readonly kind: 'mailer' | 'inline' | 'legacyChannel' | 'custom' | 'none';
  /** The named application mailer, for `mailer`. */
  readonly mailer?: string;
  /** `smtp` or `resend`, for `inline`. */
  readonly provider?: string;
}

export interface AuthenticationSettings {
  readonly issues: readonly AuthenticationSettingsIssue[];
  readonly app: {
    readonly publicOrigin: SettingValue<string | null>;
    /** Better Auth's public path, such as `/api/auth` or `/main/api/auth`. */
    readonly authBasePath: string;
    /** `publicOrigin` + `authBasePath`, or `null` without a public origin. */
    readonly authBaseUrl: string | null;
  };
  readonly methods: readonly AuthenticationSignInMethod[];
  readonly signInPage: {
    readonly password: boolean;
    readonly signUp: boolean;
    readonly forgotPassword: boolean;
  };
  readonly registration: {
    readonly selfSignUp: SettingValue<boolean>;
    readonly autoSignIn: SettingValue<boolean>;
    readonly requireEmailVerification: SettingValue<boolean>;
  };
  readonly password: {
    readonly minLength: SettingValue<number>;
    readonly maxLength: SettingValue<number>;
    readonly username: {
      readonly minLength: number;
      readonly maxLength: number;
      readonly origin: ConfigOrigin;
    } | null;
  };
  readonly passwordReset: {
    readonly available: boolean;
    readonly passwordSignIn: boolean;
    readonly enabled: SettingValue<boolean | null>;
    readonly customSender: boolean;
    readonly sender: {
      readonly configured: boolean;
      readonly origin: ConfigOrigin;
    } & PasswordResetSenderDescription;
    readonly publicOrigin: boolean;
  };
  readonly session: {
    readonly expiresIn: SettingValue<number>;
    readonly updateAge: SettingValue<number>;
    readonly storage: SettingValue<'database' | 'cache'>;
    readonly cookieCache: SettingValue<boolean>;
    readonly cookie: {
      readonly secure: boolean;
      readonly sameSite: string;
      readonly httpOnly: boolean;
      readonly origin: ConfigOrigin;
    };
  };
  readonly security: {
    readonly signingKeys: {
      readonly kind: 'authSecrets' | 'secretsKeys' | 'authSecret';
      readonly origin: ConfigOrigin;
      readonly versions: readonly number[];
      readonly currentVersion: number | null;
      readonly legacySecret: boolean;
    };
    readonly encryptOAuthTokens: SettingValue<boolean>;
    readonly rateLimit: {
      readonly enabled: boolean;
      readonly window: number;
      readonly max: number;
      readonly origin: ConfigOrigin;
    };
  };
}

/** A single sign-on or social provider a person can link to their account. */
export interface AuthenticationProviderSummary {
  readonly id: string;
  readonly name: string;
}
