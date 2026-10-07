# Device approval

The page where a signed-in person approves or denies the sign-in of a command line or another device that cannot open a browser itself: Better Auth's device authorization (RFC 8628). The device asks the server for a code, shows it, and opens or prints `verification_uri_complete`, `<origin><base path>/device?user_code=WDJB-MJHT`; this block is what that address renders.

Unlike the other authentication blocks, it wires itself to the backend: `useDeviceApproval` calls Better Auth's device endpoints through the authentication plugin's client (`useAuthentication()` from `@nocobase/app-plugin-authentication/client`), and the component translates its own text.

| File                     | Exports                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `device-approval.tsx`    | `DeviceApproval`                                                          |
| `use-device-approval.ts` | `useDeviceApproval`, `formatUserCode`, `deviceErrorStatus`                |
| `locales/en-US.ts`       | the English resource (default export) and its `DeviceApprovalLocale` type |
| `locales/zh-CN.ts`       | the Chinese resource                                                      |

## Prerequisites

- The server enables `deviceAuthorization()` (with `bearer()` for the device to use the session it receives) in `server/config/auth.ts`, and the application has the migration that creates Better Auth's `deviceCode` table; the authentication plugin's Skill, `references/better-auth-plugins.md`, describes both.
- `client/config/auth.ts` registers `deviceAuthorizationClient()` from `better-auth/client/plugins`. The block reaches the endpoints through the client's `$fetch`, so it compiles without the plugin in the client's type, but the plugin is what tells the client how to call them.

## Flow

With a code, the block calls `GET /device?user_code=` once, which also claims the code for the signed-in person (Better Auth refuses to approve or deny an unclaimed code), shows the code for the person to compare with their device and the client that asked, then `POST /device/approve` or `/device/deny`. The check is not repeated or polled: Better Auth rate-limits it. Without a code it asks for one and hands it to `onUserCodeChange`, which should put it in the address. It shows a message for an approved, denied, expired, invalid or already claimed code, and a retry for anything else.

## The page

Mount it on `/device`, reached only by signed-in people; a person who is not signed in goes to the sign-in page and comes back with the code. Render it inside the application's authentication layout:

```tsx
const [params, setParams] = useSearchParams();

<AuthPage
  description={t('deviceApproval.description')}
  title={t('deviceApproval.title')}
>
  <DeviceApproval
    onUserCodeChange={(code) => setParams(code ? { user_code: code } : {})}
    userCode={params.get('user_code')}
  />
</AuthPage>;
```

`deviceApproval.title` and `deviceApproval.description` are in the block's locales for the page's heading; the component does not render them.

## Translations

Spread each file of `locales/` into the matching application locale, before the application's own keys so they can reword it:

```ts
import deviceApprovalEnUS from '@/extensions/nocobase-device-approval/locales/en-US';

const enUS = {
  ...deviceApprovalEnUS,
  // the application's own keys
};
```

`zh-CN.ts` is typed with `DeviceApprovalLocale`, so a key missing from it fails `typecheck`; add a new language the same way.
