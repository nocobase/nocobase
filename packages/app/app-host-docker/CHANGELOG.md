# @nocobase/app-host-docker

## 0.1.0-beta.2

### Patch Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [7afd595]
  - @nocobase/app-host@0.1.0-beta.17
  - @nocobase/app-server@3.0.0-beta.0

## 0.1.0-beta.1

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-host@0.1.0-beta.15
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/logging@0.1.0-beta.7

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/app-host-docker`, the Docker backend of the App Host: an `external-service` backend that runs each App's release image, pulled by digest from a registry, in a container of its own, with a health-gated start-first switch and hardened isolation, on-demand start, idle stop and dormancy through the Host's registry, and containers that keep running and are adopted again when the Host restarts. The Host's listener is the Apps' ingress, by path or by host name, and an App's deployment environment variables reach its container. The backend connects to the local Docker Engine the way the `docker` CLI does (`DOCKER_HOST`, else the current Docker context, else the default socket). It ships the `app-host-docker` executable, a managed Host with this backend only, so the Docker credentials never share a process with in-process App code.

### Patch Changes

- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
  - @nocobase/app-host@0.1.0-beta.14
  - @nocobase/app-server@2.0.0-beta.1

## 0.0.1

### Patch Changes

- Add the Docker activation backend for the App Host.
