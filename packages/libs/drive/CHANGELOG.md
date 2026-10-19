# @nocobase/drive

## 0.1.0-beta.6

### Minor Changes

- 89648ee: Add a native Aliyun OSS drive using the official server SDK, with access keys or ECS RAM role credentials, on-demand refresh, V4 signed URLs, file operations and ACL support. Handle input stream errors while credentials are loading so failed uploads reject safely without terminating the process. Default OSS transfer timeouts to ten minutes and allow a positive integer `timeout` in milliseconds (up to 2147483647), retained after credential refresh and bucket changes, so slow uploads and buffered downloads are not limited by the SDK default of sixty seconds. Metadata request timeouts remain unchanged. Allow OSS artifact storage in standalone App Hosts. S3 configuration and credential behavior remain unchanged. Validated with simulated metadata and the real OSS SDK request/signing chain; real ECS/OSS verification remains a follow-up.
- fe81e4b: Export `parseDriveDiskConfig` and `DriveDiskConfigError` to validate a disk configuration without echoing its values, and declare `forcePathStyle` and `supportsACL` on S3 disks as optional, since the S3 driver applies its own defaults when they are omitted.

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
