# @nocobase/hub-cli

## 0.1.0-beta.0

### Minor Changes

- 84cc7d2: `release upload` and `release deploy` leave `@nocobase/app-cli` for the new `@nocobase/hub-cli` package as `hub upload` and `hub deploy`, and the `nocobase.cli.publishing` flag that registered them is removed. An application gets the commands by depending on `@nocobase/hub-cli`; the Default template declares it in `devDependencies`. `hub deploy` uploads `storage/exports/dist.tar.gz` and deploys it, as `release upload --deploy` did, and with `--release-id` deploys a Release already on the Hub, as `release deploy` did. `hub upload` only uploads and takes no `--deploy`, `--wait` or `--config`. The other flags, the `HUB_*` variables and the exit codes are unchanged; under `--json`, `command` names the new commands, and an unexpected upload failure is `UPLOAD_FAILED` where it was `PUBLISH_FAILED`. The client that `@nocobase/app-cli/hub-publishing` exported is now the `@nocobase/hub-cli` package root, and the Hub's `NO_DEPLOYMENT` and configuration-conflict messages name `hub deploy --release-id`.

  A direct `@nocobase/` dependency whose `package.json` names a CLI entry in `nocobase.cli.entry` now contributes that entry's `defineCliPlugin` commands without an entry in `cli/plugins.ts`, and a package that is not an application plugin takes its topic from its name without the `-cli` suffix. The runner imports such a package only for a command under its topic, for help on the whole tree and for `commands`; a package the application requires but nobody installed is reported as `PACKAGE_NOT_INSTALLED` with `pnpm install` as the suggestion. `AppLocation` no longer has `publishing`. `@nocobase/hub-cli` ships a `nocobase-hub-cli` Skill, and the `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

### Patch Changes

- Updated dependencies [9f75a27]
- Updated dependencies [84cc7d2]
  - @nocobase/app-cli@1.0.0-beta.9

## 0.0.1

### Minor Changes

- Add `nocobase hub deploy` and `nocobase hub upload` to the application that depends on this package, replacing `nocobase release upload` and `release deploy` from `@nocobase/app-cli`.
