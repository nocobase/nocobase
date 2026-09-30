# NocoBase Authentication UI

Application-owned authentication UI backed by `@nocobase/app-plugin-authentication`.

This registry item is preinstalled into application templates at:

```text
client/extensions/nocobase-auth-ui/
```

After materialization, the files belong to the application and may be edited freely. The item includes the page layout, form tabs, SSO button group, four password forms, branding and marketing panel. The application composes each authentication route directly with `AuthLayout`:

```tsx
<AuthLayout
  logo={<AuthBrand light={<YourLightLogo />} dark={<YourDarkLogo />} />}
  forms={[
    { id: 'password', label: 'Password', content: <PasswordLoginForm /> },
    { id: 'ldap', label: 'LDAP', content: <YourLdapForm /> },
  ]}
  sso={
    <AuthSsoButtons
      providers={[
        { id: 'google', label: 'Google', onClick: signInWithGoogle },
        { id: 'github', label: 'GitHub', onClick: signInWithGitHub },
      ]}
    />
  }
  marketing={<YourMarketingPanel />}
  title='Welcome back'
  description='Sign in with your username or email and password.'
/>
```

Use `form` for one form, or `forms` for multiple authentication methods. The `forms` prop renders an accessible tab switcher, so an application can combine password, LDAP, passkey, or other application-owned forms in one page. Each provided form renders its own standard navigation and status footer. `AuthSsoButtons` renders any number of SSO providers below the forms. The application owns route declarations, branding, SSO actions, and marketing content; a custom form can replace a built-in form and its footer.

The authentication plugin remains responsible for the auth client, session state, guards, providers, and headless actions. Forms use the plugin's stable `client/actions` export, and `PasswordLoginForm` also reads `useSignUpAvailable()` from its `client` export; page routes and links belong to the application that installs this item. Do not import plugin-internal components or add another copy of shadcn primitives.

`PasswordLoginForm` links to `register` only while the server accepts sign-up: `useSignUpAvailable()` reads the `auth.emailAndPassword` fields that `defineAuthConfig` publishes, and a server that publishes neither keeps the link. Pass `showSignUpLink` to decide yourself. The `register` route itself belongs to the application, which should send a visitor back to `login` while sign-up is off, as the templates' `pages/auth/register.tsx` does.

## Translations

Every string goes through `useTranslation()` from `@nocobase/i18n/client` under an `auth.*` key with its English wording as `defaultValue`, so the item renders in English wherever a key is missing. The components name no namespace: the keys resolve in the namespace that renders them, which inside a plugin's route is the plugin's own with the application's as its fallback.

The item ships its translations in `locales/en-US.ts` and `locales/zh-CN.ts`. Merge each into the matching locale file of that namespace, before your own keys so that yours can reword them. In `en-US`, keep your own keys in an object of their own and annotate the merged object: a plugin builds declarations with `isolatedDeclarations`, which cannot infer the type of an object that contains a spread (`TS9015`), and the annotation costs an application nothing.

```ts
// client/locales/en-US.ts
import type { LocaleResource } from '@nocobase/i18n';
import authUi from '../extensions/nocobase-auth-ui/locales/en-US.js';

const messages = {
  // your own keys
};

const enUS: typeof authUi & typeof messages = { ...authUi, ...messages };

export type AppResource = LocaleResource<typeof enUS>;
export default enUS;
```

```ts
// client/locales/zh-CN.ts
import authUi from '../extensions/nocobase-auth-ui/locales/zh-CN.js';
import type { AppResource } from './en-US.js';

const zhCN: AppResource = {
  ...authUi,
  // your own keys
};

export default zhCN;
```

Installing the item does not do this for you: shadcn copies files and never edits your locale resources. The application templates merge them this way. Explicit props such as `submitLabel` take precedence over the translated defaults.
