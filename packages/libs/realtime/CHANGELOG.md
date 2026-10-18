# @nocobase/realtime

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
