---
'@nocobase/message-broker': minor
'@nocobase/app-plugin-message-broker': minor
'@nocobase/app-plugin-message-broker-example': minor
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add message integration with external systems. Plugins publish and consume through logical names that the `messageBroker` configuration maps to the middleware's resources, so switching middleware changes configuration only. Backends declare their capabilities, and the service refuses at startup or at the call a subscription or call that needs one the backend lacks; startup fails naming any middleware resource that does not exist. Messages published inside a database transaction are stored in an outbox and sent after the commit, never after a rollback, and survive a crash; subscriptions can skip a repeated message ID through an inbox. Backend packages run the shared backend contract tests from `@nocobase/message-broker/contract`. The default and examples templates register the in-memory backend and the outbox plugin, and the examples template adds a runnable example plugin.
