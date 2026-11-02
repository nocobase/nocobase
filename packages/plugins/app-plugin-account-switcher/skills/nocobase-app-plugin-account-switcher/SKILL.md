---
name: nocobase-app-plugin-account-switcher
description: Let a Super Admin act as another account and return without signing out or knowing a password, to test how a NocoBase 3 application behaves for different accounts during development (切换账号、以其他账号查看、view as). Covers registering the plugin, its account-menu entry, its development-only availability and what a switch refuses. Not for a public demo site (Demo Mode), one person holding several accounts, or approving on someone's behalf, which is the application's own delegation.
---

# Account switcher

A Super Admin picks another account from the account menu and the browser acts as it: every route, permission and page answers as that account until they return. A notice stays on screen meanwhile. Nobody needs the account's password, and the account's own sessions are untouched.

## Availability

`accountSwitcher.mode` is `full` while `NODE_ENV` is `development`, which `pnpm dev` sets, and `off` otherwise. `off` registers no routes and shows nothing. Setting `full` when `NODE_ENV` is neither `development` nor `test` refuses to start: anything done during a switch is recorded under the account acted as, which only suits disposable data. Set the mode in `config.yml` or with `NOCOBASE_ACCOUNT_SWITCHER_MODE`. A Demo Mode deployment is always off, since its write protection would refuse a switch and its own menu already moves between accounts.

Only someone holding an unrestricted Permission Set can switch, in every mode. The check applies to the person who signed in, so they can move between accounts while acting as one that could not.

## Add it to an application

The templates include it. To add it to an older application:

1. Run `pnpm nocobase plugin register @nocobase/app-plugin-account-switcher`.
2. Add the configuration section, or the plugin stays off:

   ```ts
   // server/config/account-switcher.ts
   import type { AppConfigFactory } from '@nocobase/app-server/config';
   import {
     defineAccountSwitcherConfig,
     type AccountSwitcherConfig,
   } from '@nocobase/app-plugin-account-switcher/server';

   const accountSwitcher: AppConfigFactory<AccountSwitcherConfig> =
     defineAccountSwitcherConfig();

   export default accountSwitcher;
   ```

   List it in `server/config/index.ts` beside the other sections.

3. Mount the entries in the account menu, inside the application's `DropdownMenuContent`, and hide signing out during a switch because it would end the signed-in person's own session:

   ```tsx
   import {
     AccountSwitchMenu,
     useAccountSwitched,
   } from '@nocobase/app-plugin-account-switcher/client/menu';

   const switched = useAccountSwitched();

   <LanguageSwitcher />
   <AccountSwitchMenu />
   {switched ? null : <SignOutItem />}
   ```

The notice mounts by itself. Applications do not place it.

## What a switch refuses

While acting as another account, `/api/apiKeys` and every write to `/api/auth/*` answer `403 ACCOUNT_SWITCH_FORBIDDEN_ACTION`, because an issued key outlives the switch and Better Auth's own writes would change the signed-in person's account instead. Signing out is allowed and ends the switch with the session.

Everything else behaves as the account itself, including starting an Agent run. A switch ends after eight hours; the next request then answers `409 ACCOUNT_SWITCH_ENDED` and the page reloads as the signed-in person.

## Routes

All require a browser session and answer `403 ACCOUNT_SWITCH_BROWSER_ONLY` to an API key or a CLI token.

| Route                                          | Purpose                                                        | Requires     |
| ---------------------------------------------- | -------------------------------------------------------------- | ------------ |
| `GET /api/accountSwitcher/state`               | Whether the person may switch, and any switch in force         | Signed in    |
| `GET /api/accountSwitcher/accounts`            | Enabled people to choose from, with `q`, `page` and `pageSize` | Unrestricted |
| `POST /api/accountSwitcher/switches`           | Start or replace a switch with `{ userId }`                    | Unrestricted |
| `DELETE /api/accountSwitcher/switches/current` | Return to one's own account                                    | Signed in    |

Each switch is a row in `accountSwitches`, kept after it ends, and each start and end is logged by the `security` logger.

## Verify

Sign in as a Super Admin under `pnpm dev`, switch to an ordinary account from the account menu and confirm its pages and permissions apply and the notice shows. Move to another account, return, and confirm the menu and identity are your own again. Sign in as an ordinary account and confirm the menu has no entry.
