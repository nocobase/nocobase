# @nocobase/app-plugin-distributed

## 0.1.0-beta.2

### Minor Changes

- a6b9b74: Add the read-only Cluster and distributed settings page and `GET /api/distributed/status`, which show the backend each shared service selected on the answering instance, whether it is shared between instances, and what must change before running several instances, with server and client extension points. Caching, concurrency, Jobs, Queue and Realtime gain a read-only `describe()` and let an adapter declare `sharing: 'local' | 'shared'` when it registers. The file plugin reports the file collections stored on a local disk. Both application templates register the plugin.

### Patch Changes

- a6b9b74: Show the optional worker ID release permission under Cluster and distributed, and display the risk level registered for settings actions in the role editor.
- a6b9b74: Declare the plugin's title and one-line description in English and Chinese under `nocobase` in `package.json`, which the App Foundation plugins page lists it by.
- a6b9b74: Use the available width on settings pages, manage role names, copies, and deletion from the role list while configuring permissions in the adjacent panel, hide empty permission tabs, align user totals with pagination, and list Database under System.
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [1048669]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [1048669]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [1048669]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [1048669]
- Updated dependencies [1048669]
- Updated dependencies [1048669]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
  - @nocobase/app-client@4.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.39
  - @nocobase/app-plugin-authentication@2.0.0-beta.24
  - @nocobase/app-server@5.0.0-beta.9
  - @nocobase/app-plugin-concurrency@0.1.0-beta.4
  - @nocobase/app-plugin-file@1.0.0-beta.33
  - @nocobase/i18n@2.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.1

### Patch Changes

- a2474ed: Refer to the NocoBase 3 source branch as `v3`, its new name, in Skills references, the Agents documentation and the Distributed Skill.

## 0.1.0-beta.0

### Minor Changes

- e2868c6: Add public Agent Skills for configuring and verifying multi-instance applications and shared Redis backends.

## 0.0.1

### Patch Changes

- Introduce Agent guidance for distributed applications and shared backend configuration.
