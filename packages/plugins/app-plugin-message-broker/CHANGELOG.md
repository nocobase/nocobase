# @nocobase/app-plugin-message-broker

## 0.1.0-beta.1

### Patch Changes

- 1952789: Declare whether each product plugin is enabled by default, preinstalled only, available separately, or deprecated.
- cf23bfe: Stop publishing CHANGELOG.md in the package; the changelog stays in the repository.
- Updated dependencies [1952789]
  - @nocobase/app-plugin-concurrency@0.1.0-beta.5

## 0.1.0-beta.0

### Minor Changes

- 4561d5f: Add a message broker for publishing and consuming messages within and across applications: business events, asynchronous commands and integration with external systems. Plugins publish and consume through logical names that the `messageBroker` configuration maps to the middleware's resources, so switching middleware changes configuration only. Backends declare their capabilities, and the service refuses at startup or at the call a subscription or call that needs one the backend lacks; startup fails naming any middleware resource that does not exist. Messages published inside a database transaction are stored in an outbox and sent after the commit, never after a rollback, and survive a crash; subscriptions can use an inbox that records each message in the same transaction as the handler's database writes, so a repeated message does not repeat them. Backend packages run the shared backend contract tests from `@nocobase/message-broker/contract`. The default and examples templates register the in-memory backend and the outbox plugin, the examples template adds a runnable example plugin with business tables, and the application development Skill gains a guide to choosing between jobs, queues and the message broker and to using it.

### Patch Changes

- cc0bf33: Run outstanding sample data when enabled on existing databases. Write seed history only after a successful run and omit disabled sample seeds from dry-run plans. Apply the preview environment's sample data setting on every deployment and document the guidance for adding sample seeds to business changes.
- Updated dependencies [cc0bf33]
- Updated dependencies [4561d5f]
- Updated dependencies [52d0b0d]
- Updated dependencies [9acf418]
  - @nocobase/app-server@5.0.0-beta.12
  - @nocobase/db@1.0.0-beta.31
  - @nocobase/message-broker@0.1.0-beta.0

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
