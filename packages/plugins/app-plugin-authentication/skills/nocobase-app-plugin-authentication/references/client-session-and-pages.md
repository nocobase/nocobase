# Client session and pages

## Reading the session

`useAuthentication()` works anywhere under the application shell:

```tsx
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';

export function Greeting(): ReactElement | null {
  const { session, isPending } = useAuthentication();
  if (isPending || !session) return null;
  return <span>{session.user.name}</span>;
}
```

- `session` is `null` while anonymous; `session.user` has `id`, `name`,
  `email`, `username`, `image`, and `emailVerified`.
- `isPending` is true until the first `getSession()` completes and during any
  `refresh()`. Render nothing or a placeholder while pending; do not treat
  pending as anonymous.
- `refresh()` re-reads the session from the server. Call it after any action
  that changes the session outside the provided hooks.
- `client` is the Better Auth client. Every Better Auth client plugin
  configured in `client/config/auth.ts` is available on it.

The provider does not poll and does not listen for revocation. A session
revoked on the server is noticed at the next `refresh()` or when an API call
returns `401`; treat that `401` as "sign in again", not as an application
error.

## Signing out

There is no sign-out hook. Call the client and refresh:

```ts
const { client, refresh } = useAuthentication();
await client.signOut();
await refresh();
```

The application shell's user menu already does this. Reuse it rather than
adding a second sign-out path.

## Guarding pages

Routes declare their mode in `client/routes.ts`:

- `auth: 'required'` renders inside `RequiredAuthentication`; an anonymous
  visitor is redirected to `/login`.
- `auth: 'guest'` renders inside `GuestAuthentication`; a signed-in visitor is
  redirected to the in-application path in the page's `redirect` search parameter, such as `/login?redirect=%2Fdevice%3Fuser_code%3DWDJBMJHT`, and to `/` without one.
- `auth: 'optional'` renders for everyone.

The plugin fixes the `/login` target and the `/` default. A page that needs the person to come back after signing in sends them to `/login?redirect=<its own path and query>`, as the templates' `/device` page does; an application that needs a different landing page redirects again from `/` or from the login page's success path; it does not fork the guard. Wrap a subtree yourself with
`AuthenticationGuard({ mode })` only outside the routed tree.

A guard is navigation. Every endpoint the page calls authenticates on its own;
see [protecting routes](protecting-routes.md).

## Client configuration

`client/config/auth.ts` holds Better Auth client options. Its `plugins` must
mirror the server's: the template pairs `username()` on the server with
`usernameClient()` here. Adding a server plugin that has a client counterpart
means adding both, or the client will lack the typed methods and the plugin's
request handling.

The base URL is derived from the application's public path and must not be
set here.

## Where the pages live

The plugin ships no pages. The application declares four guest routes and
owns their components:

```text
client/routes.ts                        /login /register /forgot-password /reset-password
client/pages/auth/*.tsx                 one page per route: wires a form to its headless action
client/pages/auth/shared.tsx            AuthPage: logo, name and the brand panel every page shares
client/extensions/nocobase-auth-forms/         four presentational password forms
client/extensions/nocobase-auth-methods/       method tabs and SSO buttons
client/extensions/nocobase-auth-split-layout/  the page frame, with an aside slot
client/pages/auth/device.tsx                    /device: approves a CLI's sign-in (see better-auth-plugins.md)
client/extensions/nocobase-device-approval/     the approval page's block, wired to the plugin's client
```

The `device-approval` block is the exception: it calls Better Auth's device endpoints through `useAuthentication()` and translates its own `deviceApproval.*` keys; [enabling an official Better Auth plugin](better-auth-plugins.md#device-login-for-a-cli) covers it. The other components come from the NocoBase UI Library and are presentational: they call no plugin API and take every string as a prop with an English default. The pages own the wiring and the translations. Customize the pages and `shared.tsx` first; prefer the components' props and slots, and when they cannot express the change, write a new component under `client/components/auth/` and import it from the page. Edit the installed components only if explicitly requested or composition is impractical, and explain the reason. Preserve original pages and components when disabling a feature so it can be re-enabled without reconstruction.

### Changing text, branding, or layout

`AuthPage` in `client/pages/auth/shared.tsx` renders `AuthSplitLayout` with the application's `logo`, `name`, and the brand panel as `aside`, shown from the `xl` breakpoint up; change them there so all four pages follow. Each page passes its `title` and `description`, and the form's `labels`, from `t()` under `auth.*` in `client/locales/`. For a centred card without a panel, install `auth-centered-layout` from the UI Library and render `AuthCenteredLayout` in `AuthPage` instead.

### Wiring a form

Each form calls `onSubmit(values)` and renders `submitting`, `error`, and `fieldErrors`; links go in `footer` (and `forgotPasswordLink` on the login form):

```tsx
const login = usePasswordLogin();

<PasswordLoginForm
  error={login.error?.message}
  forgotPasswordLink={<Link to='/forgot-password'>{t('auth.forgotLink')}</Link>}
  labels={{ identifier: t('auth.identifier'), submit: t('auth.signIn') }}
  onSubmit={login.submit}
  submitting={login.isPending}
/>;
```

### Offering more than one sign-in method

The login page renders its form through `AuthMethods`. Add a method to `methods` to get a tab per method, and SSO buttons with `providers`:

```tsx
<AuthMethods
  methods={[
    {
      id: 'password',
      label: t('auth.password'),
      content: <PasswordLoginForm {...passwordProps} />,
    },
    { id: 'ldap', label: 'LDAP', content: <LdapLoginForm /> },
  ]}
  providers={[
    {
      id: 'github',
      label: 'GitHub',
      icon: <GitHubIcon />,
      onClick: signInWithGitHub,
    },
  ]}
/>
```

A provider has `id`, `label`, and either `onClick` or `href`, plus optional `icon` and `disabled`; from three providers on the buttons become a row of icons. Keep the sign-in call itself in an application module such as `client/auth/<provider>/`, and have the button call it; see [adding sign-in methods](adding-sign-in-methods.md).

### Writing a custom form

Place custom forms in `client/components/auth/` and update the consuming page import. Preserve the original forms.

Compose the headless action instead of calling the client by hand:

```tsx
import { usePasswordLogin } from '@nocobase/app-plugin-authentication/client/actions';

const { submit, isPending, error } = usePasswordLogin();
await submit({ identifier, password });
```

- `usePasswordLogin` routes an identifier containing `@` to email sign-in and
  anything else to username sign-in, then refreshes the session.
- `usePasswordRegistration` takes `{ name, email, username, password }`.
- `usePasswordResetRequest` takes `{ email }` and exposes `isSuccess`; it
  sends the user back to the application's `/reset-password` route.
- `usePasswordReset` takes `{ token, password }`.

`error.message` is the message Better Auth returned, already safe to show.
Navigation after success belongs to the form; the built-in forms use ordinary
relative links and the router.

### Turning registration off

Set `auth.emailAndPassword.disableSignUp: true` in `config.yml`. The server then refuses password registration, and because `server/config/auth.ts` declares the section with `defineAuthConfig`, the value is published to the browser, where `useSignUpAvailable()` from `@nocobase/app-plugin-authentication/client` reads it. The templates' `PasswordLoginForm` hides its sign-up link and `client/pages/auth/register.tsx` redirects to `/login` while it returns `false`; no client configuration needs to change. Keep the registration page, form and route so that setting the value back restores registration.

If `server/config/auth.ts` still uses a plain `defineAppConfig`, the server refuses sign-up but the browser keeps showing it, and the plugin logs a warning at startup; switch it to `defineAuthConfig({ defaults: { ... } })`. A custom login form gates its link with `useSignUpAvailable()` or the form's `showSignUpLink` prop; do not hide a link with CSS. Verify that the link is gone, `/register` redirects, and a direct `POST /api/auth/sign-up/email` fails without creating an account; `pnpm nocobase config check --json` shows the published value under `public`. Other self-provisioning methods, such as social sign-in, need their own policy if the user intends to disable all account creation rather than password self-registration alone.

### Password reset

The forms are present, but sending the email is the application's job:
configure `emailAndPassword.sendResetPassword` on the server as described in
[user lifecycle and deployment](user-lifecycle-and-deployment.md). Until it is
configured, the forgot-password page succeeds silently and sends nothing, so
do not link to it from a production login page.

## Testing components

Component tests stub the client rather than a network. Register a fake under
`authenticationClientToken` whose `getSession()` resolves the session you
want, mount `AuthenticationProvider`, and render the component. Tests of the
auth pages mock the `client/actions` module instead, asserting what `submit`
was called with. The template's own client tests show both patterns.
