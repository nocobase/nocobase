# @nocobase/realtime

## 1.0.0-beta.0

### Major Changes

- cf23bfe: Move Redis realtime broadcasting to the commercial Realtime Redis plugin. Register its Server plugin before selecting Redis in an application, or import the standalone broker from its `/broker` entry. Preserve the Memory default, service identity, authorization and recovery protocol, and republish runtime consumers against the new host and realtime major versions. Install the compatible commercial cohort before deploying the final removal.

## 1.0.0-beta

### Breaking changes

Remove the built-in Redis broker and its public factory and options type. Standalone Redis consumers must import them from `@nocobase/app-plugin-realtime-redis/broker`; host applications register its Server plugin. Memory, authorization, the browser protocol and generic recovery/control contracts remain open source. Deploy the compatible commercial cohort before this final-removal version.

## 0.1.0-beta.3

### Minor Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- 1952789: Isolate delivery queues by subscription, bound global authorization work and expose delivery, authorization and broker diagnostics. Publish receipts now describe broker admission; `flush()` observes current local queues without claiming remote delivery. Add optional latest-snapshot coalescing, bounded event deduplication and event IDs for tracing.

  Add an optional Redis Pub/Sub broker with namespace isolation, distributed user/session revocation and resubscription recovery. Broker recovery requests fresh client subscriptions and authoritative snapshots. Redis publication is never retried automatically after an ambiguous result; applications remain responsible for durable state, cursors and outbox retry.

- 1952789: Ship a dedicated versioned Realtime integration Skill and references for authorization, snapshot recovery, distributed delivery, polling decisions and business verification. Include it in both application templates' direct dependencies so Skills synchronization discovers it, and document optional Redis configuration in both templates.

  Use one refresh scheduler for the Realtime business examples' initial, manual and event reads. Retry transient snapshot failures without another event, preserve trailing reads and provide low-frequency reconciliation. Forward capability-lab read failures to the shared retry policy.

- 1952789: Retry transient subscription failures independently with bounded exponential backoff and jitter. Preserve permanent authorization refusals and correlation checks, cancel retries on disposal, and probe healthy foreground connections instead of rebuilding them.

  Retain stale snapshot state after failed reads and retry transient refresh failures without another realtime event. Expose refresh status, last successful synchronization, manual retry and separate subscription error callbacks. Clear previously authorized query data after an HTTP 401 or 403. Reuse the scheduler for Agent Sessions and subject run discovery while preserving slow reads and stream coalescing.

## 0.1.0-beta.2

### Minor Changes

- c0b7537: Prepare the signed-in realtime identity before mounting template pages to avoid repeated loading after login. Expose session preparation and retry state, and show a retryable connection error with sign-out when initialization times out. Keep runtime permission invalidation and session isolation.

## 0.0.2-beta.1

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.0.2-beta.0

### Patch Changes

- 90a4903: Preserve configured API and realtime endpoints after splitting the client services. Integrate file inventory and the plugin-owned inbox with the shared API and realtime clients, including reconnection refresh and isolated event listeners.

  Allow the Oracle driver install script in both templates’ standalone deployment workspace settings.

  Resolve SQLite auto-incrementing bigint metadata correctly, narrow Oracle LOB values before reading their type, preserve legacy file timestamps, and rebuild the AI registry against the current API client.

## 0.0.1

### Patch Changes

- Add the shared realtime protocol and browser WebSocket client.
