# @nocobase/drive

## 0.1.0-beta.5

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.1.0-beta.4

### Patch Changes

- 5281fd1: Allow drive configurations to omit storage links so application startup succeeds when no symbolic links are configured.

  Display an empty links map in application configuration summaries when drive links are omitted.

## 0.1.0-beta.3

### Minor Changes

- 9536bf5: Drop `links` from `AppDriveConfig` and stop creating symlinks in `prepareDriveStorage`, which now takes no options and returns only `directories`.

  The change itself landed with the Hub deployment work, but only the packages on the other side of it were released: `@nocobase/app-server` shipped as `1.0.0-beta.7` without `links` in its drive configuration, while `@nocobase/drive` stayed at the previously published `0.1.0-beta.2`, whose `prepareDriveStorage` still reads `config.links`. An application installing both from the registry gets that pair — `app-server` declares `^0.1.0-beta.2`, so nothing rejects it — and crashes on boot with `TypeError: Cannot convert undefined or null to object` from `Object.entries(config.links)`. Releasing this package is what makes the two halves agree again.

## 0.1.0-beta.2

### Minor Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.

## 0.0.1-beta.1

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
- Updated dependencies [ce4eab8]
  - @nocobase/service-provider@0.0.2-beta.0

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
