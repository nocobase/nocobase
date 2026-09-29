# @nocobase/app-plugin-schedule-example

## 0.1.0-beta.0

### Minor Changes

- aeff80a: Add `@nocobase/app-plugin-schedule-example`, a plugin running a recurring job on the application's jobs service

  Its provider takes an executor of its own from `jobExecutorServiceToken`, registers a `heartbeat` job that runs every minute, sets the executor up, removes the rules of jobs it no longer defines, and shuts the executor down with the application. An authenticated `GET /api/schedule-example` returns the job's next firing and its recent runs. The examples template registers it.

### Patch Changes

- Updated dependencies [aeff80a]
  - @nocobase/jobs@0.1.0-beta.0
  - @nocobase/app-server@1.0.0-beta.30
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.0.1

### Patch Changes

- Initial release.
