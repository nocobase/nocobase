---
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-cli-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-users': patch
---

Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
