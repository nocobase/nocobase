# @nocobase/app-websocket

## 0.1.0-beta.1

### Minor Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.

## 0.0.2-beta.0

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.0.1

### Patch Changes

- Initial release.
