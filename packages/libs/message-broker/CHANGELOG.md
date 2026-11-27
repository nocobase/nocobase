# @nocobase/message-broker

## 0.1.0-beta.0

### Minor Changes

- 4561d5f: Add a message broker for publishing and consuming messages within and across applications: business events, asynchronous commands and integration with external systems. Plugins publish and consume through logical names that the `messageBroker` configuration maps to the middleware's resources, so switching middleware changes configuration only. Backends declare their capabilities, and the service refuses at startup or at the call a subscription or call that needs one the backend lacks; startup fails naming any middleware resource that does not exist. Messages published inside a database transaction are stored in an outbox and sent after the commit, never after a rollback, and survive a crash; subscriptions can use an inbox that records each message in the same transaction as the handler's database writes, so a repeated message does not repeat them. Backend packages run the shared backend contract tests from `@nocobase/message-broker/contract`. The default and examples templates register the in-memory backend and the outbox plugin, the examples template adds a runnable example plugin with business tables, and the application development Skill gains a guide to choosing between jobs, queues and the message broker and to using it.

## 0.0.1

### Minor Changes

- Add middleware-neutral message publishing and subscription APIs with an in-memory backend.
