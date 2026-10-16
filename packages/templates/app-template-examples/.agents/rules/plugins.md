# Demonstration plugins

Read this before working with the Mail, Mail Example and OnlineAgent demonstrations this template registers.

Mail and Mail Example are registered here with three offline providers in `server/config/mail.ts`. Open `/mail-example` to prepare the demo accounts and messages. These fixtures use `@example.test` addresses and never send mail to external services; keep this example out of Default applications. The Mail plugin's synchronized Skill describes its public integration contract.

## OnlineAgent example

Agents is registered in the CLI, server and client composition roots. Reuse its public `modelsRoute` under the application-owned Agents navigation group; preserve `/models` and its `settings:agents.services` read permission. Model mutations require `manage`. Do not substitute page grants or deep-import plugin pages.

The application integration lives in `client/components/online-agent/` and the installed Registry UI in `client/extensions/nocobase-agent-chat/`. Header, keyboard shortcut and homepage share one authenticated `ChatProvider`. Keep the identity reset: the SDK panel storage key and query cache are not user-scoped. Reset before mounting a new user's provider, dispose old subscriptions, and never reuse Default's configuration or database. The panel's model readiness gate disables only Send, not drafts, history or Stop. Revalidate the chat catalog when opening the panel and on window focus; a request failure is not an empty catalog.

Guard asynchronous mutation results and retained notification actions through `OnlineAgentIdentityScope`, not a transient row's mount state: archive Undo must still work after its row leaves the list, while old-account callbacks must neither write cache nor initiate another request. Keep the composer's body mounted across mobile/desktop transitions and mobile close/reopen; delayed upload completion must recheck current readiness before accepting a message.

The minimal example uses the built-in `online` Agent and an enabled offered chat model, without a Runner, custom Agent, tools, Skills or automatic resend/reconnect. Configure credentials through Models, never client code or `config.yml`. [OnlineAgent usage](../../online-agent.md) describes setup and verification boundaries. The application-owned HTTP model fixture in `tests/fixtures/online-agent-model.ts` verifies the real standalone server without external requests or real credentials; it is not evidence of real-provider connectivity.

The Users plugin's Skill covers user administration and application-owned role assignment. Registering, updating and customizing plugins in general is covered by [plugins](../skills/nocobase-app-development/references/plugins.md).
