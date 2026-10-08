# @nocobase/agent-protocol

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/agent-protocol`, the wire protocol between an application's agents plugin, the agent runner and the application's command line: zod schemas and types for runner registration, heartbeats, the claim, jobs, distribution, agent run payloads, run token endpoints and the CLI command manifest, together with the protocol version, the `x-nocobase-*` protocol headers, runner features and error codes. Every side imports the same schemas instead of keeping copies.

## 0.0.1

Initial version.
