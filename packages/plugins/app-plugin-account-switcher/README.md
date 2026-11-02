# @nocobase/app-plugin-account-switcher

Lets a Super Admin act as another account and return, without signing out or knowing a password, to test how an application behaves for different accounts during development.

The account menu lists the accounts, a notice stays on screen during a switch, and every route, permission and page answers as the chosen account. API keys and Better Auth's own writes stay out of reach. Each switch is recorded in `accountSwitches`.

It is on while `NODE_ENV` is `development`, which `pnpm dev` sets, and off otherwise and in Demo Mode. `accountSwitcher.mode: full` refuses to start unless `NODE_ENV` is `development` or `test`. Application integration is in the [plugin Skill](skills/nocobase-app-plugin-account-switcher/SKILL.md).

## How it works

A switch creates no session for the account. It records which account the signed-in person's session acts as, and `Auth.addSessionSubstitution` applies that on each request, so the person's cookie and session never change and returning only ends the record. Revoking that session or disabling that person ends the switch with no further code.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-account-switcher lint
pnpm --filter @nocobase/app-plugin-account-switcher typecheck
pnpm --filter @nocobase/app-plugin-account-switcher test
pnpm --filter @nocobase/app-plugin-account-switcher build
```
