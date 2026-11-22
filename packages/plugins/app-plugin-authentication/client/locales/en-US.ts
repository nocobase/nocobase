import type { LocaleResource } from '@nocobase/i18n';

/**
 * Messages for the errors the authentication actions report (`actions/errors.ts`), keyed by the server's error code:
 * Better Auth's own codes, its username plugin's, and the ones this plugin's server adds.
 */
const enUS = {
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Could not reach the server. Check your connection and try again.',
    rateLimited: 'Too many attempts. Please wait a moment and try again.',
    INVALID_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
    INVALID_USERNAME_OR_PASSWORD: 'Incorrect username or password.',
    INVALID_PASSWORD: 'Incorrect password.',
    INVALID_EMAIL: 'Enter a valid email address.',
    INVALID_USERNAME:
      'Usernames may contain only letters, digits, underscores and dots.',
    USERNAME_TOO_SHORT: 'This username is too short.',
    USERNAME_TOO_LONG: 'This username is too long.',
    USERNAME_IS_ALREADY_TAKEN: 'This username is already taken.',
    USER_ALREADY_EXISTS: 'An account with this email already exists.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'An account with this email already exists. Use another email.',
    PASSWORD_TOO_SHORT: 'This password is too short.',
    RESET_PASSWORD_DISABLED:
      'Self-service password reset is not enabled. Contact an administrator to reset your password.',
    PASSWORD_TOO_LONG: 'This password is too long.',
    EMAIL_NOT_VERIFIED: 'Verify your email address before signing in.',
    INVALID_TOKEN: 'This link is invalid or has expired.',
    TOKEN_EXPIRED: 'This link has expired.',
    ACCOUNT_DISABLED: 'This account is disabled. Contact your administrator.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'A service account cannot sign in; it acts only through API keys.',
    invalidOriginWithAddress:
      'This origin is not trusted. Set app.publicOrigin in config.yml to {{origin}}, restart the application, and try again.',
    INVALID_ORIGIN:
      'This origin is not trusted. Check app.publicOrigin in config.yml, restart the application, and try again.',
    FAILED_TO_UNLINK_LAST_ACCOUNT:
      'You cannot unlink your only way to sign in.',
    INVALID_CSRF_ORIGIN:
      'This request came from another site and was refused. Reload the page and try again.',
  },
  settings: {
    title: 'Sign-in and authentication',
    navigationDescription:
      'How people sign in, register, recover passwords and stay signed in.',
    description:
      'Who can sign in and how, whether people can register, how passwords are recovered and how long sign-ins last. These settings live in the application configuration and take effect on deployment; this page shows the effective values, where each comes from and what needs attention. Each section explains how to change it.',
    loadFailed: 'Could not load the authentication settings.',
    retry: 'Retry',
    howToChange: 'How to change',
    howToChangeNote:
      'Redeploy or restart the application after the change. This page saves nothing.',
    yes: 'Yes',
    no: 'No',
    source: {
      env: 'Environment variable',
      file: 'config.yml',
      code: 'Code',
      default: 'Default',
    },
    columns: {
      value: 'Current value',
      source: 'Source',
      method: 'Method',
      config: 'Configuration',
      status: 'Status',
    },
    duration: {
      days_one: '{{count}} day',
      days_other: '{{count}} days',
      hours_one: '{{count}} hour',
      hours_other: '{{count}} hours',
      minutes_one: '{{count}} minute',
      minutes_other: '{{count}} minutes',
      seconds_one: '{{count}} second',
      seconds_other: '{{count}} seconds',
    },
    tabs: {
      methods: 'Sign-in methods',
      registration: 'Registration',
      password: 'Password and recovery',
      session: 'Sessions and security',
    },
    issues: {
      title_one: '{{count}} item needs attention',
      title_other: '{{count}} items need attention',
      passwordResetUnavailable:
        'Password recovery is off: people who forget their password must ask an administrator to reset it.',
      publicOriginMissing:
        'app.publicOrigin is not set: links in emails and third-party sign-in callback URLs cannot be built.',
      registrationFeedback:
        'Registering with an email that already has an account gives the person no guidance. Turn on sign-in after registration, email verification or an existing-user notice.',
      view: 'View',
    },
    status: { enabled: 'On', notConfigured: 'Not configured' },
    methods: {
      details: 'Details',
      howToEnable: 'How to enable',
      noteRedeploy:
        'Turning on a sign-in method means changing code or configuration and redeploying; methods that need new tables (two-factor authentication, passkeys) also need a database migration. This page saves nothing.',
      noteUsers:
        'Disable a user, reset their password or sign them out everywhere from their details in Users.',
      password: {
        title: 'Password',
        descriptionEmail: 'Email and a password',
        description: 'Email or username and a password',
      },
      device: {
        title: 'Command line sign-in',
        description:
          'Approve a command-line tool’s sign-in in the browser (/device)',
      },
      apiKey: {
        title: 'API keys',
        description: 'Programs call the API without the sign-in page',
      },
      sso: {
        title: 'Single sign-on (OIDC)',
        description:
          'Feishu, DingTalk, WeCom, Okta, Microsoft Entra ID and more',
      },
      social: {
        title: 'Social accounts',
        description: 'Google, GitHub, Microsoft and more',
      },
      twoFactor: {
        title: 'Two-factor authentication',
        description: 'Enter a one-time code after the password',
      },
      passkey: {
        title: 'Passkeys',
        description: 'Sign in with a fingerprint, face or security key',
      },
    },
    signInPage: {
      title: 'What the sign-in page shows',
      password: 'Email or username and password',
      signUp: 'No account? Register',
      forgotPassword: 'Forgot password',
      providers: 'Sign in with {{names}}',
      noProviders: 'Third-party sign-in buttons',
      noButton: 'configured, no button on the sign-in page',
      hidden: 'not shown',
    },
    registration: {
      title: 'Self-registration',
      selfSignUp: 'People can register themselves',
      selfSignUpHint: 'The sign-in page shows “No account? Register”.',
      allowed: 'Allowed',
      notAllowed: 'Not allowed',
      autoSignIn: 'Signed in right after registering',
      requireEmailVerification: 'Email verification',
      requireEmailVerificationHint: 'Needs a mail sender when turned on.',
      required: 'Required',
      notRequired: 'Not required',
      invite: 'Invitations',
      inviteAction: 'Invite in Users',
      inviteDescription:
        'With self-registration off, new members join through an invitation link sent from Users.',
      noteDisable:
        'Turning registration off hides the entry and makes the server refuse registrations; it can be turned on again later.',
      noteFeedback:
        'Without sign-in after registration or email verification, registering an email that already has an account tells the person nothing; this is flagged above.',
    },
    password: {
      title: 'Password rules',
      length: 'Length',
      lengthValue: '{{min}}–{{max}} characters',
      username: 'Username',
      usernameValue:
        '{{min}}–{{max}} letters, digits, underscores or dots, case-insensitive',
    },
    reset: {
      title: 'Forgot password (recovery by email)',
      off: 'Off',
      custom:
        'The application sends reset emails with its own sendResetPassword callback, which takes precedence over the checks below.',
      enabled: 'Password recovery is turned on',
      notSet: 'not set',
      sender: 'Mail sender',
      senderMailer: 'Uses the mailer {{name}}',
      senderInline: 'Uses auth.email ({{provider}})',
      sender_legacyChannel: 'Uses a legacy notification channel',
      sender_custom: 'The application’s own callback',
      sender_none: 'No mail sender is configured',
      publicOrigin: 'Public address of the application',
      publicOriginMissing: 'not set, so reset links cannot be built',
      availableNote:
        'The sign-in page shows “Forgot password”, and people reset their password from the emailed link.',
      unavailableNote:
        'Only when all three are met does the sign-in page show “Forgot password”. Until then, people who forget their password must ask an administrator to reset it from Users.',
      noteRateLimit:
        'Reset emails are rate-limited by email address and IP address; the page gives the same answer whether or not the email exists.',
      noteSessions:
        'When an administrator resets a password or a person changes theirs, that person is signed out on their other devices.',
    },
    session: {
      title: 'Sessions',
      expiresIn: 'Stay signed in for',
      expiresInHint: 'Extended automatically while in use.',
      updateAge: 'Extended',
      updateAgeValue: 'At most once every {{duration}}',
      storage: 'Stored in',
      storageHint:
        'An administrator can sign a person out everywhere from their details in Users.',
      storage_database: 'Database',
      storage_cache: 'Cache only',
      cookieCache: 'Cookie cache',
      cookieCacheHint:
        'When on, a signed-out device stays signed in until its cached session expires.',
      cookie: 'Cookie',
      httpsOnly: 'HTTPS only',
      httpAndHttps: 'HTTP and HTTPS',
    },
    security: {
      title: 'Security',
      signingKeys: 'Signing keys',
      signingKeysHint:
        'Rotate them in the application’s secrets; removing an old version signs everyone out.',
      keys_authSecret: 'A single auth.secret, without versions',
      keys_authSecrets_one:
        'Set in auth.secrets · current v{{version}}, {{count}} older version kept',
      keys_authSecrets_other:
        'Set in auth.secrets · current v{{version}}, {{count}} older versions kept',
      keys_secretsKeys_one:
        'Derived from secrets.keys · current v{{version}}, {{count}} older version kept',
      keys_secretsKeys_other:
        'Derived from secrets.keys · current v{{version}}, {{count}} older versions kept',
      oauthTokens: 'Third-party tokens',
      encrypted: 'Stored encrypted',
      notEncrypted: 'Stored unencrypted',
      rateLimit: 'Sign-in rate limit',
      rateLimitOn: 'On · at most {{max}} requests per {{window}}',
      rateLimitOff: 'Off',
      keysNote:
        'Signing keys are managed in the application’s secrets and never shown here. Redeploy or restart after a change.',
    },
    blocked: {
      title: 'Accounts that cannot sign in',
      disabled: 'Disabled users',
      disabledDescription:
        'Signing in says the account is disabled; their signed-in devices are signed out and their realtime connections closed.',
      service: 'Service accounts',
      serviceDescription:
        'The identities behind system API keys; they only call the API with keys and cannot sign in with a password or single sign-on.',
    },
  },
  guide: {
    handOver: 'Hand over to an agent',
    promptHint:
      'Filled in from this application’s configuration; edit it before copying if needed.',
    publicOriginMissing:
      'app.publicOrigin is not set, so the prompt uses the address you are browsing ({{origin}}). Confirm it is the public address.',
    notes: 'Notes',
    after: 'After deploying',
    twoFactor: {
      title: 'Turn on two-factor authentication',
      description:
        'Once it is on, people set up an authenticator app in Account and security, and after their password they enter a 6-digit code. It takes a code change, a database migration and a redeployment: give the prompt below to your development agent (Claude Code, Codex and the like, in the application’s repository). This page saves nothing.',
      note1:
        'Nobody is forced to use it: each person sets it up for themselves in Account and security.',
      after:
        'Under Sign-in methods the row shows On, and Account and security shows a Two-factor authentication section.',
    },
    passkey: {
      title: 'Turn on passkeys',
      description:
        'Once it is on, people add a passkey (fingerprint, face or security key) in Account and security, and the sign-in page offers “Sign in with a passkey”. It takes a code change, a database migration and a redeployment: give the prompt below to your development agent (Claude Code, Codex and the like, in the application’s repository). This page saves nothing.',
      note1:
        'Passkeys only work over HTTPS (localhost excepted); otherwise the browser refuses them.',
      note2:
        'Changing the domain after deployment invalidates every passkey already added.',
      after:
        'Under Sign-in methods the row shows On, the sign-in page offers “Sign in with a passkey”, and Account and security shows a Passkeys section.',
    },
  },
  prompt: {
    title: 'Prompt',
    copy: 'Copy prompt',
    label: 'Prompt for your development agent',
    followSignIn:
      'Follow the “Adding sign-in methods” reference of the nocobase-app-plugin-authentication Skill:',
    followPlugin:
      'Follow the “Enabling an official Better Auth plugin” reference of the nocobase-app-plugin-authentication Skill:',
    discoveryUnknown:
      '(the OIDC discovery URL {{name}} publishes, ending in /.well-known/openid-configuration)',
    sso: {
      intro:
        'Turn on single sign-on with {{name}} in this NocoBase application (Better Auth genericOAuth, OIDC).',
      add: 'In server/config/auth.ts, add genericOAuth from better-auth/plugins to the plugins, keeping the plugins already there, with providerId {{id}} and discoveryUrl {{discovery}}. Read clientId and clientSecret from the environment variables {{prefix}}_CLIENT_ID and {{prefix}}_CLIENT_SECRET; never write them into code. The browser needs no client plugin: sign-in and linking go through signIn.social and linkSocial.',
    },
    social: {
      intro:
        'Turn on sign-in with {{name}} in this NocoBase application (Better Auth socialProviders.{{id}}).',
      add: 'In server/config/auth.ts, add {{id}} to socialProviders. Read clientId and clientSecret from the environment variables {{prefix}}_CLIENT_ID and {{prefix}}_CLIENT_SECRET; never write them into code.',
    },
    firstSignIn: {
      create:
        'First sign-in: create an account automatically, with the same roles as self-registration (disableSignUp: false).',
      existing:
        'First sign-in: existing accounts only (disableSignUp: true). People are invited in Users first and link {{name}} in Account and security before signing in with it.',
    },
    matching:
      'Match accounts by the provider’s identity (issuer + subject) and never merge them into an existing user by email: set account.accountLinking.disableImplicitLinking: true.',
    callback:
      'The callback URL is {{callback}}. Make sure app.publicOrigin is {{origin}}.',
    checkProvider:
      'Check that the sign-in page shows “Sign in with {{name}}” (also name the provider in authentication({ signInButtons })) and that Account and security can link and unlink {{name}}.',
    testsProvider:
      'Add a sign-in flow test and run lint, typecheck, test and build. No database migration is needed.',
    configIntro: 'Configuration to start from:',
    doneProvider:
      'When you are done, tell me which files you changed and which environment variables the deployment must set.',
    twoFactor: {
      intro:
        'Turn on two-factor authentication in this NocoBase application (the official Better Auth plugin twoFactor).',
      add: 'In server/config/auth.ts, add twoFactor({ issuer: {{appName}} }) from better-auth/plugins to the plugins, and in client/config/auth.ts add twoFactorClient() from better-auth/client/plugins, keeping the plugins already there.',
      migration:
        'Add a migration in database/main/migrations/ that follows the twoFactor schema of the installed better-auth version (the Skill has the one for 1.7.21): create the twoFactor table and add twoFactorEnabled to user, with a down. Do not run better-auth’s own migrate or schema generation.',
      account:
        'Add a Two-factor authentication section to Account and security (extend the page or replace it with authentication({ accountSecurityComponentLoader })): people turn it on with their password, scan the code with an authenticator app, verify it, keep their backup codes and turn it off again. It stays optional for everyone.',
      signIn:
        'On the sign-in page, when sign-in answers twoFactorRedirect, ask for the code and finish with twoFactor.verifyTotp, or twoFactor.verifyBackupCode for a backup code.',
      tests:
        'Confirm Account and security shows the Two-factor authentication section. Add a migration test and a sign-in flow test, and run lint, typecheck, test and build.',
    },
    passkey: {
      intro:
        'Turn on passkeys in this NocoBase application (the official Better Auth plugin passkey, from the @better-auth/passkey package).',
      add: "Install @better-auth/passkey at the same version as better-auth. In server/config/auth.ts, add passkey from @better-auth/passkey to the plugins with rpName {{appName}}, reading rpID (the host name) and origin from app.publicOrigin instead of hard-coding them; the public address is {{origin}}, so set app.publicOrigin to it. Pass schema: { passkey: { fields: { credentialID: 'credentialId' } } }, because snake_case column names cannot spell credentialID back. In client/config/auth.ts, add passkeyClient from @better-auth/passkey/client, keeping the plugins already there.",
      migration:
        'Add a migration in database/main/migrations/ that follows the passkey schema of the installed version (the Skill has the one for 1.7.21), storing credentialID as credentialId: create the passkey table, with a down. Do not run better-auth’s own migrate or schema generation.',
      account:
        'Add a Passkeys section to Account and security (extend the page or replace it with authentication({ accountSecurityComponentLoader })) where people add, rename and delete their passkeys.',
      signIn:
        'Add “Sign in with a passkey” to the sign-in page (signIn.passkey).',
      tests:
        'Confirm Account and security shows the Passkeys section and the sign-in page shows the passkey button. Add a migration test and run lint, typecheck, test and build.',
    },
    doneMethod:
      'When you are done, tell me which files you changed and what to watch for when deploying.',
  },
  sso: {
    breadcrumb: 'Turn on single sign-on or social sign-in',
    title: 'Turn on single sign-on (OIDC)',
    socialTitle: 'Turn on social sign-in',
    description:
      'Create an application with the identity provider, then give the prompt below to your development agent (Claude Code, Codex and the like, in the application’s repository). The client secret stays in the deployment’s environment variables and is never entered here. This page saves nothing.',
    provider: 'Identity provider',
    other: 'Other',
    id: 'Identifier',
    idHint:
      'Part of the callback URL. Do not change it after deployment, or linked accounts stop working.',
    createApp: '1. Create the application in {{name}}',
    copy: 'Copy',
    copied: 'Copied',
    callbackHint:
      'Enter this callback URL as the redirect URL in {{name}}’s developer console, and note the client ID and client secret.',
    publicOriginMissing:
      'app.publicOrigin is not set, so the callback URL uses the address you are browsing. Confirm it is the public address.',
    firstSignIn: '2. First sign-in',
    create: 'Create an account automatically',
    createHint:
      'The first sign-in with {{name}} creates a new user, with the same roles as self-registration.',
    existing: 'Existing accounts only',
    existingHint:
      'Invite people in Users first; they link {{name}} in Account and security before signing in with it.',
    handOver: '3. Hand over to an agent',
    promptHint:
      'Updates with the choices above; edit it before copying if needed.',
    deploy: '4. Deploy',
    deployDescription:
      'Set {{prefix}}_CLIENT_ID and {{prefix}}_CLIENT_SECRET in the deployment and redeploy. Under Sign-in methods the row shows On, and the sign-in page shows “Sign in with {{name}}”.',
    back: 'Back',
  },

  account: {
    title: 'Account and security',
    navigationDescription: 'Your sign-in details, password and devices.',
    description:
      'Your sign-in details, password and the devices you are signed in on. Changes here affect only you.',
    cancel: 'Cancel',
    save: 'Save',
    failed: 'Something went wrong. Please try again.',
    signIn: {
      title: 'Sign-in details',
      username: 'Username',
      email: 'Email',
      contactAdmin: 'Ask an administrator to change your username or email.',
    },
    password: {
      title: 'Password',
      changedAt: 'Last changed {{date}}',
      change: 'Change password',
      none: 'You sign in without a password, through a linked account.',
      mismatch: 'The new passwords do not match.',
      changed: 'Password changed',
      current: 'Current password',
      new: 'New password',
      confirm: 'Confirm new password',
      revokeOthers: 'Sign out of other devices',
      revokeOthersCount_one: 'Sign out of other devices ({{count}})',
      revokeOthersCount_other: 'Sign out of other devices ({{count}})',
    },
    devices: {
      title: 'Signed-in devices',
      count_one: '{{count}} device',
      count_other: '{{count}} devices',
      signOutOthers: 'Sign out of all other devices',
      signedOutOthers: 'Signed out of all other devices',
      commandLine: '{{client}} · command line',
      unknown: 'Unknown device',
      noAddress: 'Address unknown',
      current: 'This device',
      lastUsed: 'Last used {{date}}',
      signOut: 'Sign out',
      signedOut: 'Device signed out',
      note: 'Command-line tools approved through /device appear here too; signing one out revokes its sign-in. API keys are not listed here.',
    },
    linked: {
      title: 'Linked accounts',
      description: 'Single sign-on and social accounts you can sign in with',
      linkedAs: 'Linked · {{id}}',
      notLinked: 'Not linked',
      link: 'Link',
      unlink: 'Unlink',
      unlinked: 'Account unlinked',
      lastMethod: 'You cannot unlink your only way to sign in.',
    },
  },
};

export type AuthenticationResource = LocaleResource<typeof enUS>;

export default enUS;
