# NocoBase authentication components

Presentational components that sign-in, sign-up and password pages are built from. Each is its own block and installs into a directory of its own, `client/extensions/nocobase-<item>/`, imported as `#extensions/nocobase-auth-forms/password-login-form`. Except `device-approval`, none of them talks to a server or imports a NocoBase package: a page wires the forms to its authentication backend, such as the headless actions of `@nocobase/app-plugin-authentication/client/actions`, and passes the translated text in. They are built from the shadcn primitives (`Field`, `InputGroup`, `Alert`, `Tabs`, `Button`, `Card`). The application templates ship `auth-forms`, `auth-methods`, `auth-split-layout` and `device-approval` preinstalled, and their `client/pages/auth/` pages are the reference wiring.

`device-approval` is the exception: it is a whole page's content rather than a presentational part, wires itself to the authentication plugin's Better Auth client, and translates its own text from its `locales/`. Its [README](device-approval/README.md) covers what it needs.

| Item                   | Installs                                                                                                                                                                                               | Exports                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `auth-forms`           | `auth-forms/password-login-form.tsx`, `password-registration-form.tsx`, `password-reset-request-form.tsx`, `password-reset-form.tsx`, with `form-parts.tsx`, `field-props.ts` and `password-input.tsx` | `PasswordLoginForm`, `PasswordRegistrationForm`, `PasswordResetRequestForm`, `PasswordResetForm` |
| `auth-methods`         | `auth-methods.tsx`                                                                                                                                                                                     | `AuthMethods`, `AuthSsoButtons`                                                                  |
| `auth-centered-layout` | `auth-centered-layout.tsx`                                                                                                                                                                             | `AuthCenteredLayout`                                                                             |
| `auth-split-layout`    | `auth-split-layout.tsx`                                                                                                                                                                                | `AuthSplitLayout`                                                                                |
| `device-approval`      | `device-approval.tsx`, `use-device-approval.ts`, `locales/en-US.ts`, `locales/zh-CN.ts`                                                                                                                | `DeviceApproval`, `useDeviceApproval`, `formatUserCode`                                          |

## Text

These components, except `device-approval`, do not translate. Every string comes from a `labels` prop, or a slot, with an English default, so a page passes the words of its own locale. A validation message the form checks itself, such as `passwordMismatch`, is a label too, and is read on every render, so a message already on screen follows a language change.

## Forms

Each form keeps its own field values and calls `onSubmit(values)`, trimming everything but passwords. Everything else is a prop: `submitting` disables the button and shows `labels.submitting`, `error` is a message about the whole attempt (an alert), `fieldErrors` puts a message under a field and marks it invalid, and `footer` is a centred line of links under the button. `PasswordLoginForm` also takes `forgotPasswordLink`, shown under the password input so that it follows the input in tab order; `PasswordResetRequestForm` takes `success`; `PasswordResetForm` takes `disabled`, for a link without a token. Links in the slots take their style from the form, so pass plain `<a>` or router `<Link>` elements.

```tsx
const login = usePasswordLogin();

<PasswordLoginForm
  error={login.error?.message}
  footer={
    <>
      Don't have an account? <Link to='/register'>Sign up</Link>
    </>
  }
  forgotPasswordLink={<Link to='/forgot-password'>Forgot password?</Link>}
  labels={{ identifier: t('auth.identifier'), submit: t('auth.signIn') }}
  onSubmit={login.submit}
  submitting={login.isPending}
/>;
```

## Methods

`AuthMethods` takes `methods` as `{ id, label, content }` and shows a full-width segmented tab list only when there is more than one, and `providers` as `{ id, label, icon, onClick or href }`, separated from the methods by an "Or continue with" rule. One or two providers are full-width outline buttons; from three on they become a row of icon buttons, each named "Continue with {provider}". `labels` takes `methods`, `separator` and `continueWith`.

## Layouts

Each layout renders the whole page with the form as its `children`: the page's `h1` from `title`, an optional `description`, `logo` (a mark, shown in a tile) and `name`, and a short `footer`. They are separate items with no shared file, so an application installs only the one it uses.

- `AuthCenteredLayout` puts the brand above a card in the middle of a muted page, with a faint glow from the primary color and a dot pattern behind it.
- `AuthSplitLayout` puts the brand top left, the form in a column of `max-w-sm`, and the footer at the bottom; from the `xl` breakpoint up the right half shows `aside`, the application's own content, named by `asideLabel`. The templates pass their brand panel there.
