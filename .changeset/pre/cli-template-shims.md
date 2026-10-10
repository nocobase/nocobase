---
'@nocobase/app-cli': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

The application templates no longer carry forwarding files in `cli/`: `cli/database-command.ts`, `cli/hub-publishing.ts`, `cli/commands/i18n-check.ts` and `cli/standard-commands.ts` are gone, and `cli/commands/index.ts` now calls `createAppCommands` itself. `@nocobase/app-cli` drops the `./database-command` and `./commands/i18n-check` subpaths that existed only for those files; `./hub-publishing` remains. An existing application generated from an earlier template re-exports those subpaths, so upgrading `@nocobase/app-cli` requires the same change there: delete `cli/database-command.ts` and `cli/commands/i18n-check.ts`, and move the `createAppCommands` call from `cli/standard-commands.ts` into `cli/commands/index.ts`. The helpers behind the two removed subpaths are no longer public.
