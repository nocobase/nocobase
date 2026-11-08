export default {
  statusNote:
    'Status uses the application’s pages, password and registration settings, and reported password recovery availability. Unlisted methods are not necessarily unconfigured. Recovery availability does not verify email delivery.',
  guestHint:
    'These pages are for signed-out visitors. A signed-in visitor returns to the application; copy the link into a private window to inspect it.',
  denied: 'Your account cannot access this entry.',
  retry: 'Retry status',
  deviceTitle: 'CLI / device sign-in approval page',
  deviceDescription:
    'Approve a sign-in request from a command-line tool in the browser. This status checks the approval page; using it also requires a request and code from the tool.',
  features: {
    password: {
      title: 'Password sign-in',
      configured:
        'A sign-in page is available and password authentication is enabled.',
      missing:
        'Password authentication is disabled or a sign-in page has not been provided.',
      unknown:
        'A sign-in page exists, but the password authentication setting is unavailable.',
      open: 'Open sign-in page',
    },
    registration: {
      title: 'Self-service registration',
      configured:
        'A registration page is available and users may create accounts. Registration does not grant all business permissions.',
      missing:
        'Self-service registration is closed or a required page is missing. Whether to open it depends on the account policy.',
      unknown:
        'A registration page exists, but registration availability cannot be confirmed.',
      open: 'Open registration page',
    },
    recovery: {
      title: 'Password recovery',
      configured:
        'Recovery and reset pages are available, and the application reports password recovery as available.',
      missing:
        'Password recovery is disabled or not ready, or a recovery/reset page is missing. Pages alone do not make recovery available.',
      unknown:
        'Checking password recovery availability. Retry if the request fails; unknown does not mean unconfigured.',
      open: 'Open recovery page',
    },
  },
  actions: {
    login: {
      title: 'Add or customize the sign-in page',
      description:
        'Configure password sign-in, application branding, layout and the return destination.',
      prompt:
        '[Add or customize the sign-in page with these requirements] in this application. Read nocobase-app-plugin-authentication and its client-session-and-pages reference. Inspect existing pages, authentication configuration and redirects. Prefer application page composition, copy and component props; reuse existing forms and usePasswordLogin rather than editing plugin source. Confirm auth.emailAndPassword.enabled when password sign-in is required. Retain existing accounts and sign-in methods, reuse the application session and sign-out flow, and never mint a parallel token. Verify sign-in, errors, sign-out and return to the original page. Authentication must not automatically grant business permissions.',
      inspect:
        'Inspect client/pages/auth/login.tsx, shared.tsx, client/routes.ts and server/config/auth.ts. Identify branding, layout, method and redirect requirements.',
      configure:
        'Customize page composition and component props while reusing authentication actions. Password authentication uses auth.emailAndPassword.enabled. Preserve guest routes and return destinations.',
      verify:
        'Verify valid and invalid credentials, disabled accounts, sign-out and return navigation. Verify business access independently of successful sign-in.',
    },
    registration: {
      title: 'Open or close self-service registration',
      description:
        'Decide whether users may create accounts, keeping entries and feedback consistent.',
      prompt:
        'Apply [open or close self-service registration] to this application. Read the authentication Skill and inspect password authentication, registration pages and account policy. Use auth.emailAndPassword.disableSignUp for server enforcement and make routes and entries follow availability. Preserve source pages when closing registration; hiding a button is insufficient. Before opening registration, confirm automatic sign-in, email verification and new-account permissions without automatically assigning business roles. Match feedback to the actual flow and never promise an email without configured sending. Verify allowed, forbidden and duplicate-account cases while preserving existing users.',
      inspect:
        'Confirm whether accounts are self-registered or administrator-created. Settle post-registration sign-in, verification and permission policies.',
      configure:
        'Set auth.emailAndPassword.disableSignUp and align registration routes and entries. Configure verification if needed. Closing registration preserves source files and also rejects server requests.',
      verify:
        'Check both page entries and direct requests with registration open and closed. Verify duplicate-account feedback, sessions and new-account business permissions.',
    },
    recovery: {
      title: 'Configure password recovery',
      description:
        'Prepare email delivery and the reset flow so users can recover access.',
      prompt:
        'Configure email password recovery for this application. Read the authentication Skill’s authentication-email reference. Inspect recovery/reset pages, auth.passwordReset, existing callbacks, mailers and the public origin. Reuse existing sending; prefer mailers for new configuration, enable auth.passwordReset.enabled and configure app.publicOrigin. Do not add mailbox or notification plugins just for authentication email. Preserve accounts and password policy; obtain credentials securely. Make the login entry follow actual recovery availability. Verify real delivery, link origins, expiry/reuse, delivery errors and sign-in after resetting; do not claim delivery without sending.',
      inspect:
        'Confirm password sign-in and /forgot-password and /reset-password pages. Check custom send callbacks to avoid replacing an existing flow.',
      configure:
        'Enable auth.passwordReset.enabled and configure app.publicOrigin and a working mailer. Reference a shared mailer through auth.email.mailer when needed; preserve existing callback precedence.',
      verify:
        'Run configuration checks and apply changes, then inspect recovery availability. Use a test mailbox to verify delivery, link origin, expiry, reset results and failure feedback.',
    },
    sso: {
      title: 'Add enterprise or third-party sign-in',
      description:
        'Connect an identity provider with explicit account binding and sign-in entries.',
      prompt:
        'Add [identity provider or sign-in method] to this application. Read the authentication Skill’s adding-sign-in-methods reference. Confirm protocol, entry points, account creation/binding and callback origins. Check the installed Better Auth version and prefer supported socialProviders, genericOAuth or official plugins; use custom code only for unsupported protocols. Add companion client capabilities, sign-in buttons and application migrations for required tables or fields, without editing historical plugin migrations. Keep credentials server-side. Bind using stable external identity rather than unverified email. Preserve existing sign-in and verify first/repeat sign-in, binding, failed callbacks and sign-out.',
      inspect:
        'Confirm the provider, protocol, callback URL, existing-account binding and whether first sign-in may create an account.',
      configure:
        'Select a provider or official plugin supported by the installed Better Auth version. Add application configuration, companion client support, sign-in entries and necessary application migrations.',
      verify:
        'Verify first and repeat sign-in, binding, cancelled/invalid callbacks and existing password sign-in. Configure business authorization independently.',
    },
    security: {
      title: 'Add two-factor authentication or passkeys',
      description:
        'Add another verification step or passwordless sign-in for account security.',
      prompt:
        'Add [two-factor authentication or passkeys] for [account scope]. Read the authentication Skill’s better-auth-plugins reference and check official support in the installed Better Auth version. Establish enrollment, recovery and lost-credential behavior before adding configuration, companion client support, application migrations and user interfaces. Plugin registration alone is insufficient. Preserve a usable sign-in method; do not force all accounts to switch without recovery. Verify enrollment, sign-in, recovery, removal and existing-account access.',
      inspect:
        'Confirm account scope, mandatory enrollment, device/domain requirements and recovery after credential loss.',
      configure:
        'Use the supported official Better Auth plugin with application configuration, migrations and enrollment, verification and recovery interfaces.',
      verify:
        'Verify enrolled and unenrolled accounts, sign-in, recovery and removal. Ensure existing accounts retain a working sign-in method.',
    },
    device: {
      title: 'Configure CLI / device sign-in',
      description:
        'Let command-line tools obtain a user session through browser approval.',
      prompt:
        'Configure browser-approved sign-in for [command-line tool]. Read the authentication Skill’s device-login reference. Inspect and reuse deviceAuthorization, bearer, deviceAuthorizationClient and /device. Confirm allowed clientIds and verification URLs without accepting every client. Add application migrations required by the installed plugin. Have the tool request authorization, display its verification URL and code, and poll at the returned interval. Use ordinary user sessions and business permissions, not an API key management page as approval. Verify approval, denial, expiry, throttling and sign-out invalidation.',
      inspect:
        'Inspect the existing approval page and protocol configuration. Establish clientId, verification URL and the allowed client list.',
      configure:
        'Pair deviceAuthorization and bearer with deviceAuthorizationClient, reuse /device, and add migrations required by the official plugin.',
      verify:
        'Start from a real CLI request and verify browser approval/denial, expiry, polling intervals, session permissions and sign-out invalidation.',
    },
  },
};
