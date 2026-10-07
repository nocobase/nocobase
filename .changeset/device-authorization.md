---
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
---

Command-line sign-in through the browser with Better Auth's official device authorization (RFC 8628). The templates enable `deviceAuthorization()` and `bearer()` in `server/config/auth.ts`, accepting the client id `nocobase-cli`, register `deviceAuthorizationClient()` in `client/config/auth.ts`, create the `deviceCode` table in a new migration (`202610060001_create_device_code`), and add a signed-in `/device` page built from the new `device-approval` UI Library block, preinstalled in `client/extensions/nocobase-device-approval/`. An existing application adopts it by copying those pieces and running `pnpm nocobase db apply`.

The authentication plugin places an app-local `verificationUri` such as `/device` below the application's public base path, documents a `bearerAuth` security scheme beside `cookieAuth` when `bearer()` is enabled, and documents `/api/auth/device/code` and `/api/auth/device/token` as callable without a credential. A guest page now sends a signed-in visitor to its `redirect` search parameter when it names a path in the application, and to `/` otherwise. The Skill gains a reference on enabling any official Better Auth plugin, including the migration its tables need.

The API keys plugin refuses an API key on the device approval endpoints (`/api/auth/device`, `/device/approve`, `/device/deny`) with `API_KEY_SESSION_FORBIDDEN`: approving issues a session, which takes a sign-in.
